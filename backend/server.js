const express = require('express');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const FORTIGATE_TOKEN = process.env.FORTIGATE_TOKEN;
const FORTIGATE_ADDRESS = process.env.FORTIGATE_ADDRESS;
const deployedVMs = new Set(); // Track deployed VMs

if (!FORTIGATE_TOKEN || !FORTIGATE_ADDRESS) {
  console.error('FORTIGATE_TOKEN or FORTIGATE_ADDRESS is not set in .env file');
  process.exit(1);
}

const axiosInstance = axios.create({
  httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
  timeout: 10000
});

// Generate or update prometheus.yml with VM IPs
const updatePrometheusConfig = async () => {
  const config = {
    global: { scrape_interval: '15s' },
    scrape_configs: [
      {
        job_name: 'node',
        static_configs: [
          ...Array.from(deployedVMs).map(ip => ({ targets: [`${ip}:9100`] }))
        ]
      }
    ]
  };
  await fs.writeFile(
    path.join(__dirname, 'prometheus.yml'),
    JSON.stringify(config, null, 2).replace(/"/g, '').replace(/:/g, ': ')
  );
  // Restart Prometheus container to apply changes
  exec('docker restart prometheus');
};

// Endpoint to get existing FortiGate firewall policies
app.get('/api/fortigate-policies', async (req, res) => {
  console.log(`Fetching policies from ${FORTIGATE_ADDRESS}`);
  try {
    const response = await axiosInstance.get(`https://${FORTIGATE_ADDRESS}/api/v2/cmdb/firewall/policy`, {
      headers: { 'Authorization': `Bearer ${FORTIGATE_TOKEN}` }
    });
    const policies = response.data.results.map(policy => policy.name);
    console.log('Fetched policies:', policies);
    res.json({ policies });
  } catch (error) {
    console.error('Error fetching FortiGate policies:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// Endpoint to create a new FortiGate firewall policy
app.post('/api/create-fortigate-policy', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Policy name is required' });

  console.log(`Creating policy ${name} on ${FORTIGATE_ADDRESS}`);
  try {
    const payload = {
      name: name,
      srcintf: ['any'],
      dstintf: ['any'],
      srcaddr: ['all'],
      dstaddr: ['all'],
      action: 'accept',
      schedule: 'always',
      service: ['ALL'],
      status: 'enable'
    };
    const response = await axiosInstance.post(`https://${FORTIGATE_ADDRESS}/api/v2/cmdb/firewall/policy`, payload, {
      headers: { 'Authorization': `Bearer ${FORTIGATE_TOKEN}` }
    });
    console.log('Policy creation response:', response.data);
    res.json({ message: `FortiGate firewall policy ${name} created` });
  } catch (error) {
    console.error('Error creating FortiGate policy:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    res.status(500).json({ error: 'Failed to create policy' });
  }
});

// Endpoint to get VM specs from Prometheus
app.get('/api/vm-specs', async (req, res) => {
  const { ip } = req.query;
  if (!ip) return res.status(400).json({ error: 'IP address is required' });

  try {
    const promResponse = await axios.get('http://localhost:9090/api/v1/query', {
      params: {
        query: `
          avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) or vector(0)
          avg(node_memory_MemTotal_bytes - node_memory_MemFree_bytes) / 1024 / 1024
          avg(node_filesystem_size_bytes - node_filesystem_free_bytes) / 1024 / 1024 / 1024
        `
      }
    });
    const specs = {
      cpuUsage: 100 - (promResponse.data.data.result[0]?.value[1] * 100 || 0),
      memoryUsage: promResponse.data.data.result[1]?.value[1] || 0,
      diskUsage: promResponse.data.data.result[2]?.value[1] || 0
    };
    res.json({ specs });
  } catch (error) {
    console.error('Error fetching VM specs:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    res.status(500).json({ error: 'Failed to fetch VM specs' });
  }
});

// Endpoint to get list of deployed VMs
app.get('/api/vm-list', (req, res) => {
  const vmList = Array.from(deployedVMs).map(ip => ({ ip }));
  res.json({ vms: vmList });
});

// Endpoint to delete a VM
app.delete('/api/delete-vm', async (req, res) => {
  const { ip } = req.query;
  if (!ip || !deployedVMs.has(ip)) return res.status(400).json({ error: 'Invalid IP' });

  try {
    // Placeholder: Replace with actual VM deletion logic (e.g., Terraform destroy)
    exec(`cd ../terraform && terraform destroy -var 'ip_address=${ip}' -auto-approve`, { cwd: __dirname }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Terraform Error: ${stderr}`);
        return res.status(500).json({ error: stderr });
      }
      deployedVMs.delete(ip);
      updatePrometheusConfig();
      res.json({ message: `VM at ${ip} deleted` });
    });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// VM deployment endpoint
app.post('/api/deploy', async (req, res) => {
  console.log('Request body:', req.body);
  const { template, cpu, memory, disk, ip, gateway, dns, name, firewallPolicy } = req.body;

  const tfVarsObj = {
    vm_name: name || 'default-vm',
    template_name: template || 'Clonage-VM',
    num_cpus: parseInt(cpu) || 2,
    memory: parseInt(memory) || 2048,
    disk_size: parseInt(disk) || 40,
    ip_address: ip || '10.0.1.91',
    gateway: gateway || '10.0.1.1',
    dns: dns || '8.8.8.8',
    firewall_policy: firewallPolicy || 'default-policy'
  };

  const tfVars = JSON.stringify(tfVarsObj, null, 2);
  console.log('Generated tfVars:', tfVars);

  try {
    const filePath = path.join(__dirname, '..', 'terraform', 'terraform.tfvars.json');
    console.log('Attempting to write to:', filePath);
    await fs.writeFile(filePath, tfVars);
    console.log('File written successfully');
    exec('cd ../terraform && terraform init && terraform apply -auto-approve -var-file=terraform.tfvars.json', { cwd: __dirname }, async (err, stdout, stderr) => {
      if (err) {
        console.error(`Terraform Error: ${stderr}`);
        return res.status(500).json({ error: stderr });
      }
      console.log(`Terraform Output: ${stdout}`);
      deployedVMs.add(ip);
      await updatePrometheusConfig(); // Update Prometheus targets
      if (firewallPolicy && ip) {
        console.log(`Applying FortiGate policy ${firewallPolicy} to VM IP ${ip}`);
      }
      res.json({ message: 'VM deployment started', output: stdout });
    });
  } catch (error) {
    console.error('Write Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to edit a VM (placeholder)
app.put('/api/edit-vm', async (req, res) => {
  const { ip, ...updates } = req.body;
  if (!ip || !deployedVMs.has(ip)) return res.status(400).json({ error: 'Invalid IP' });

  try {
    // Placeholder: Update Terraform variables and reapply
    const tfVarsObj = {
      vm_name: updates.name || 'default-vm',
      template_name: updates.template || 'Clonage-VM',
      num_cpus: parseInt(updates.cpu) || 2,
      memory: parseInt(updates.memory) || 2048,
      disk_size: parseInt(updates.disk) || 40,
      ip_address: ip,
      gateway: updates.gateway || '10.0.1.1',
      dns: updates.dns || '8.8.8.8',
      firewall_policy: updates.firewallPolicy || 'default-policy'
    };
    const tfVars = JSON.stringify(tfVarsObj, null, 2);
    const filePath = path.join(__dirname, '..', 'terraform', 'terraform.tfvars.json');
    await fs.writeFile(filePath, tfVars);
    exec('cd ../terraform && terraform apply -auto-approve -var-file=terraform.tfvars.json', { cwd: __dirname }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Terraform Error: ${stderr}`);
        return res.status(500).json({ error: stderr });
      }
      res.json({ message: `VM at ${ip} updated`, output: stdout });
    });
  } catch (error) {
    console.error('Edit Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));

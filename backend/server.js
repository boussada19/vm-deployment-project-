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

if (!FORTIGATE_TOKEN || !FORTIGATE_ADDRESS) {
  console.error('FORTIGATE_TOKEN or FORTIGATE_ADDRESS is not set in .env file');
  process.exit(1);
}

// Endpoint to get existing FortiGate firewall policies
app.get('/api/fortigate-policies', async (req, res) => {
  try {
    const response = await axios.get(`https://${FORTIGATE_ADDRESS}/api/v2/cmdb/firewall/policy`, {
      headers: {
        'Authorization': `Bearer ${FORTIGATE_TOKEN}`
      },
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
    });
    const policies = response.data.results.map(policy => policy.name);
    res.json({ policies });
  } catch (error) {
    console.error('Error fetching FortiGate policies:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// Endpoint to create a new FortiGate firewall policy
app.post('/api/create-fortigate-policy', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Policy name is required' });

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
    await axios.post(`https://${FORTIGATE_ADDRESS}/api/v2/cmdb/firewall/policy`, payload, {
      headers: {
        'Authorization': `Bearer ${FORTIGATE_TOKEN}`
      },
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
    });
    res.json({ message: `FortiGate firewall policy ${name} created` });
  } catch (error) {
    console.error('Error creating FortiGate policy:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create policy' });
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
    exec('cd ../terraform && terraform init && terraform apply -auto-approve -var-file=terraform.tfvars.json', { cwd: __dirname }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Terraform Error: ${stderr}`);
        return res.status(500).json({ error: stderr });
      }
      console.log(`Terraform Output: ${stdout}`);
      if (firewallPolicy && ip) {
        console.log(`Applying FortiGate policy ${firewallPolicy} to VM IP ${ip}`);
        // Placeholder for API call to update policy with VM IP
        // await axios.put(`https://${FORTIGATE_ADDRESS}/api/v2/cmdb/firewall/policy/${firewallPolicy}`, {
        //   srcaddr: [ip]
        // }, {
        //   headers: { 'Authorization': `Bearer ${FORTIGATE_TOKEN}` },
        //   httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
        // });
      }
      res.json({ message: 'VM deployment started', output: stdout });
    });
  } catch (error) {
    console.error('Write Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));

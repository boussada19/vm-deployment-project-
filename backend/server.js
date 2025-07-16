const express = require('express');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.post('/api/deploy', async (req, res) => {
  console.log('Request body:', req.body); // Debug incoming data
  const { template, cpu, memory, disk, ip, gateway, dns, name } = req.body;

  const tfVarsObj = {
    vm_name: name || 'default-vm',
    template_name: template || 'Clonage-VM',
    num_cpus: parseInt(cpu) || 2,
    memory: parseInt(memory) || 2048,
    disk_size: parseInt(disk) || 40,
    ip_address: ip || '10.0.1.91',
    gateway: gateway || '10.0.1.1',
    dns: dns || '8.8.8.8'
  };

  const tfVars = JSON.stringify(tfVarsObj, null, 2);
  console.log('Generated tfVars:', tfVars); // Debug generated JSON

  try {
    const filePath = path.join(__dirname, '..', 'terraform', 'terraform.tfvars.json');
    console.log('Attempting to write to:', filePath); // Debug path
    await fs.writeFile(filePath, tfVars);
    console.log('File written successfully'); // Confirm write
    exec('cd ../terraform && terraform init && terraform apply -auto-approve -var-file=terraform.tfvars.json', { cwd: __dirname }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Terraform Error: ${stderr}`);
        return res.status(500).json({ error: stderr });
      }
      console.log(`Terraform Output: ${stdout}`);
      res.json({ message: 'VM deployment started', output: stdout });
    });
  } catch (error) {
    console.error('Write Error:', error); // Catch file write errors
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));

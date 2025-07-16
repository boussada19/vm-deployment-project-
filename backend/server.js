const express = require('express');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path'); // Ensure this is included
const cors = require('cors');
const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.post('/api/deploy', async (req, res) => {
  const { template, cpu, memory, disk, ip, gateway, dns, name } = req.body;
  const tfVars = `
    vm_name = "${name}"
    template_name = "${template}"
    num_cpus = ${cpu}
    memory = ${memory}
    disk_size = ${disk}
    ip_address = "${ip}"
    gateway = "${gateway}"
    dns = "${dns}"
  `;
  try {
    await fs.writeFile(path.join(__dirname, '..', 'terraform', 'variables.tfvars'), tfVars); // Navigate up to project root
    exec('cd ../terraform && terraform init && terraform apply -auto-approve -var-file=variables.tfvars', { cwd: __dirname }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error: ${stderr}`);
        return res.status(500).json({ error: stderr });
      }
      console.log(`Output: ${stdout}`);
      res.json({ message: 'VM deployment started', output: stdout });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));

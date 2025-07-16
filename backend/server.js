const express = require('express');
const { exec } = require('child_process');
const fs = require('fs').promises;
const axios = require('axios');
const app = express();
const cors = require('cors'); // Add this line

// Enable CORS for all routes (or specify origins)
app.use(cors({
  origin: 'http://localhost:3000' // Allow requests from the front-end origin
}));

app.use(express.json());

app.post('/api/deploy', async (req, res) => {
  const { template, cpu, memory, disk, ip, gateway, dns, name } = req.body;

  // Validate IP (placeholder: implement actual validation)
  // Example: Check against a database or vSphere API

  // Update Terraform variables file
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
    await fs.writeFile('terraform/variables.tfvars', tfVars);

    // Trigger Terraform apply
    exec('cd terraform && terraform init && terraform apply -auto-approve -var-file=variables.tfvars', (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ error: stderr });
      }
      // Optionally trigger GitHub Actions workflow
      axios.post('https://api.github.com/repos/your-repo/terraform-workflow/dispatches', {
        event_type: 'deploy-vm',
        client_payload: { vm_name: name }
      }, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      }).catch(err => console.error(err));

      res.json({ message: 'VM deployment started', output: stdout });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));

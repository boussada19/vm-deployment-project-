import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Container, Typography } from '@mui/material';

const VMDeployForm = () => {
  const [formData, setFormData] = useState({
    template: 'Clonage-VM',
    cpu: 2,
    memory: 2048,
    disk: 40,
    ip: '10.0.1.85',
    gateway: '10.0.1.1',
    dns: '10.0.1.70',
    name: 'win-cloned-custom',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/deploy', formData);
      alert('VM Deployment Triggered: ' + response.data.message);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  return (
    <Container>
      <Typography variant="h4">Deploy VM</Typography>
      <form onSubmit={handleSubmit}>
        <TextField label="VM Name" name="name" value={formData.name} onChange={handleChange} fullWidth margin="normal" />
        <TextField label="Template" name="template" value={formData.template} onChange={handleChange} fullWidth margin="normal" />
        <TextField label="CPUs" name="cpu" type="number" value={formData.cpu} onChange={handleChange} fullWidth margin="normal" />
        <TextField label="Memory (MB)" name="memory" type="number" value={formData.memory} onChange={handleChange} fullWidth margin="normal" />
        <TextField label="Disk Size (GB)" name="disk" type="number" value={formData.disk} onChange={handleChange} fullWidth margin="normal" />
        <TextField label="IP Address" name="ip" value={formData.ip} onChange={handleChange} fullWidth margin="normal" />
        <TextField label="Gateway" name="gateway" value={formData.gateway} onChange={handleChange} fullWidth margin="normal" />
        <TextField label="DNS Server" name="dns" value={formData.dns} onChange={handleChange} fullWidth margin="normal" />
        <Button type="submit" variant="contained" color="primary">Deploy VM</Button>
      </form>
    </Container>
  );
};

export default VMDeployForm;
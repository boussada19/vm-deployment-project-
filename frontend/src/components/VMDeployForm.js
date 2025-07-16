import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TextField, Button, Container, Typography } from '@mui/material';

const VMDeployForm = () => {
  const [formData, setFormData] = useState({
    name: 'win-cloned-custom',
    template: 'Clonage-VM',
    cpu: 2,
    memory: 2048,
    disk: 40,
    ip: '10.0.1.85',
    gateway: '10.0.1.1',
    dns: '10.0.1.70',
    firewallPolicy: '' // New field for FortiGate firewall policy
  });
  const [existingPolicies, setExistingPolicies] = useState([]); // Store existing policies

  // Fetch existing firewall policies on component mount
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/fortigate-policies');
        setExistingPolicies(response.data.policies || []);
      } catch (error) {
        console.error('Error fetching policies:', error);
      }
    };
    fetchPolicies();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/deploy', formData);
      alert('VM Deployment Triggered: ' + response.data.message);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleCreatePolicy = async () => {
    const newPolicyName = prompt('Enter new FortiGate firewall policy name:');
    if (newPolicyName) {
      try {
        const response = await axios.post('http://localhost:3001/api/create-fortigate-policy', { name: newPolicyName });
        alert('FortiGate firewall policy created: ' + response.data.message);
        // Refresh policies
        const fetchResponse = await axios.get('http://localhost:3001/api/fortigate-policies');
        setExistingPolicies(fetchResponse.data.policies || []);
      } catch (error) {
        alert('Error creating policy: ' + (error.response?.data?.error || 'Unknown error'));
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Deploy VM with FortiGate Firewall Policy</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>VM Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} />
        </div>
        <div>
          <label>Template:</label>
          <input type="text" name="template" value={formData.template} onChange={handleChange} />
        </div>
        <div>
          <label>CPUs:</label>
          <input type="number" name="cpu" value={formData.cpu} onChange={handleChange} />
        </div>
        <div>
          <label>Memory (MB):</label>
          <input type="number" name="memory" value={formData.memory} onChange={handleChange} />
        </div>
        <div>
          <label>Disk Size (GB):</label>
          <input type="number" name="disk" value={formData.disk} onChange={handleChange} />
        </div>
        <div>
          <label>IP Address:</label>
          <input type="text" name="ip" value={formData.ip} onChange={handleChange} />
        </div>
        <div>
          <label>Gateway:</label>
          <input type="text" name="gateway" value={formData.gateway} onChange={handleChange} />
        </div>
        <div>
          <label>DNS:</label>
          <input type="text" name="dns" value={formData.dns} onChange={handleChange} />
        </div>
        <div>
          <label>FortiGate Firewall Policy:</label>
          <select name="firewallPolicy" value={formData.firewallPolicy} onChange={handleChange}>
            <option value="">Select a policy...</option>
            {existingPolicies.map((policy) => (
              <option key={policy} value={policy}>{policy}</option>
            ))}
          </select>
          <button type="button" onClick={handleCreatePolicy} style={{ marginLeft: '10px' }}>
            Create New Policy
          </button>
        </div>
        <button type="submit">Deploy VM</button>
      </form>
    </div>
  );
};

export default VMDeployForm;

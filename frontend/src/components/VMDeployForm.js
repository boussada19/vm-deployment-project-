"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { TextField, Button, Container, Typography } from '@mui/material';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Box,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Breadcrumbs,
  Link,
} from "@mui/material"
import {
  Computer as ComputerIcon,
  Add as AddIcon,
  Monitor as MonitorIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Launch as LaunchIcon,
  Home as HomeIcon,
} from "@mui/icons-material"

const VMDeployForm = () => {
  const [formData, setFormData] = useState({
    name: "win-cloned-custom",
    template: "Clonage-VM",
    cpu: 2,
    memory: 2048,
    disk: 40,
    ip: "10.0.1.85",
    gateway: "10.0.1.1",
    dns: "10.0.1.70",
    firewallPolicy: "",
  })

  const [existingPolicies, setExistingPolicies] = useState([])
  const [vmSpecs, setVmSpecs] = useState(null)
  const [vmList, setVmList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/fortigate-policies")
        setExistingPolicies(response.data.policies || [])
      } catch (error) {
        console.error("Error fetching policies:", error)
      }
    }

    const fetchVmList = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/vm-list")
        setVmList(response.data.vms || [])
      } catch (error) {
        console.error("Error fetching VM list:", error)
      }
    }

    fetchPolicies()
    fetchVmList()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await axios.post("http://localhost:3001/api/deploy", formData)
      alert("VM Deployment Triggered: " + response.data.message)
      // Refresh VM list
      const vmResponse = await axios.get("http://localhost:3001/api/vm-list")
      setVmList(vmResponse.data.vms || [])
      setActiveTab(1) // Switch to manage tab
    } catch (error) {
      alert("Error: " + (error.response?.data?.error || "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePolicy = async () => {
    const newPolicyName = prompt("Enter new FortiGate firewall policy name:")
    if (newPolicyName) {
      try {
        const response = await axios.post("http://localhost:3001/api/create-fortigate-policy", { name: newPolicyName })
        alert("FortiGate firewall policy created: " + response.data.message)
        const fetchResponse = await axios.get("http://localhost:3001/api/fortigate-policies")
        setExistingPolicies(fetchResponse.data.policies || [])
      } catch (error) {
        alert("Error creating policy: " + (error.response?.data?.error || "Unknown error"))
      }
    }
  }

  const handleMonitoring = async (ip) => {
    try {
      const response = await axios.get("http://localhost:3001/api/vm-specs", { params: { ip } })
      setVmSpecs(response.data.specs)
    } catch (error) {
      alert("Error fetching VM specs: " + (error.response?.data?.error || "Unknown error"))
    }
  }

  const handleDeleteVM = async (ip) => {
    if (window.confirm(`Are you sure you want to delete VM at ${ip}?`)) {
      try {
        const response = await axios.delete("http://localhost:3001/api/delete-vm", { params: { ip } })
        alert(response.data.message)
        setVmList(vmList.filter((vm) => vm.ip !== ip))
        setVmSpecs(null)
      } catch (error) {
        alert("Error deleting VM: " + (error.response?.data?.error || "Unknown error"))
      }
    }
  }

  const handleEditVM = (ip) => {
    const newData = prompt("Enter new specs (e.g., cpu:4,memory:4096):")
    if (newData) {
      const updates = {}
      newData.split(",").forEach((pair) => {
        const [key, value] = pair.split(":")
        if (key && value) updates[key] = value
      })
      axios
        .put("http://localhost:3001/api/edit-vm", { ip, ...updates })
        .then((response) => alert(response.data.message))
        .catch((error) => alert("Error editing VM: " + (error.response?.data?.error || "Unknown error")))
    }
  }

  const refreshData = async () => {
    setVmList([])
    setVmSpecs(null)
    window.location.reload()
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)",
        pb: 4,
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          backgroundColor: "white",
          color: "#1976d2",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          borderBottom: "1px solid #e3f2fd",
        }}
      >
        <Toolbar>
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                backgroundColor: "#1976d2",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 1.5,
              }}
            >
              <ComputerIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0d47a1" }}>
              Danone Cloud
            </Typography>
          </Box>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              "& .MuiTab-root": {
                color: "#666",
                fontWeight: 500,
                textTransform: "none",
              },
              "& .Mui-selected": {
                color: "#1976d2 !important",
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#1976d2",
              },
            }}
          >
            <Tab label="Deploy VM" />
            <Tab label="Manage VMs" />
          </Tabs>

          <IconButton onClick={refreshData} sx={{ ml: 2, color: "#666" }}>
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Breadcrumb */}
        <Breadcrumbs sx={{ mb: 4, color: "#666" }}>
          <Link color="inherit" href="#" sx={{ display: "flex", alignItems: "center" }}>
            <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Home
          </Link>
          <Typography color="primary" sx={{ fontWeight: 500 }}>
            {activeTab === 0 ? "Deploy VM" : "Manage VMs"}
          </Typography>
        </Breadcrumbs>

        {/* Deploy Tab */}
        {activeTab === 0 && (
          <Paper
            elevation={3}
            sx={{
              borderRadius: 3,
              border: "1px solid #e3f2fd",
              overflow: "hidden",
            }}
          >
            {/* Form Header */}
            <Box
              sx={{
                textAlign: "center",
                py: 4,
                px: 4,
                backgroundColor: "white",
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#e3f2fd",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <ComputerIcon sx={{ color: "#1976d2", fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#212121", mb: 1 }}>
                Deploy Virtual Machine
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: "auto" }}>
                Configure and deploy a new virtual machine with FortiGate firewall protection
              </Typography>
            </Box>

            {/* Form Content */}
            <Box sx={{ p: 4 }}>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="VM Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8fbff",
                          "& fieldset": { borderColor: "#e3f2fd" },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                          "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Template"
                      name="template"
                      value={formData.template}
                      onChange={handleChange}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8fbff",
                          "& fieldset": { borderColor: "#e3f2fd" },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                          "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="CPUs"
                      name="cpu"
                      type="number"
                      value={formData.cpu}
                      onChange={handleChange}
                      inputProps={{ min: 1, max: 16 }}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8fbff",
                          "& fieldset": { borderColor: "#e3f2fd" },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                          "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Memory (MB)"
                      name="memory"
                      type="number"
                      value={formData.memory}
                      onChange={handleChange}
                      inputProps={{ min: 512, step: 512 }}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8fbff",
                          "& fieldset": { borderColor: "#e3f2fd" },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                          "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Disk Size (GB)"
                      name="disk"
                      type="number"
                      value={formData.disk}
                      onChange={handleChange}
                      inputProps={{ min: 10 }}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8fbff",
                          "& fieldset": { borderColor: "#e3f2fd" },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                          "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="IP Address"
                      name="ip"
                      value={formData.ip}
                      onChange={handleChange}
                      placeholder="10.0.1.85"
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8fbff",
                          "& fieldset": { borderColor: "#e3f2fd" },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                          "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Gateway"
                      name="gateway"
                      value={formData.gateway}
                      onChange={handleChange}
                      placeholder="10.0.1.1"
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8fbff",
                          "& fieldset": { borderColor: "#e3f2fd" },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                          "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="DNS Server"
                      name="dns"
                      value={formData.dns}
                      onChange={handleChange}
                      placeholder="10.0.1.70"
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8fbff",
                          "& fieldset": { borderColor: "#e3f2fd" },
                          "&:hover fieldset": { borderColor: "#1976d2" },
                          "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                        },
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Firewall Policy Section */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  FortiGate Firewall Policy
                </Typography>

                <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
                  <FormControl
                    fullWidth
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "#f8fbff",
                        "& fieldset": { borderColor: "#e3f2fd" },
                        "&:hover fieldset": { borderColor: "#1976d2" },
                        "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                      },
                    }}
                  >
                    <InputLabel>Select a firewall policy</InputLabel>
                    <Select
                      name="firewallPolicy"
                      value={formData.firewallPolicy}
                      onChange={handleChange}
                      label="Select a firewall policy"
                    >
                      <MenuItem value="">
                        <em>Select a policy...</em>
                      </MenuItem>
                      {existingPolicies.map((policy) => (
                        <MenuItem key={policy} value={policy}>
                          {policy}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="outlined"
                    onClick={handleCreatePolicy}
                    startIcon={<AddIcon />}
                    sx={{
                      minWidth: 160,
                      borderColor: "#e3f2fd",
                      color: "#1976d2",
                      backgroundColor: "transparent",
                      "&:hover": {
                        backgroundColor: "#f8fbff",
                        borderColor: "#1976d2",
                      },
                    }}
                  >
                    New Policy
                  </Button>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isLoading}
                  sx={{
                    py: 2,
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    backgroundColor: "#1976d2",
                    "&:hover": { backgroundColor: "#1565c0" },
                  }}
                >
                  {isLoading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                      Deploying...
                    </>
                  ) : (
                    "Deploy Virtual Machine"
                  )}
                </Button>
              </form>
            </Box>
          </Paper>
        )}

        {/* Manage Tab */}
        {activeTab === 1 && (
          <Box>
            {/* VM Specifications */}
            {vmSpecs && (
              <Paper
                elevation={2}
                sx={{
                  mb: 4,
                  p: 3,
                  backgroundColor: "#e8f5e8",
                  border: "1px solid #c8e6c9",
                  borderRadius: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <MonitorIcon sx={{ color: "#2e7d32", mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "#2e7d32" }}>
                    VM Specifications
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4} sx={{ textAlign: "center" }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#2e7d32" }}>
                      {vmSpecs.cpuUsage}%
                    </Typography>
                    <Typography variant="body2" color="#4caf50">
                      CPU Usage
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ textAlign: "center" }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#2e7d32" }}>
                      {vmSpecs.memoryUsage} MB
                    </Typography>
                    <Typography variant="body2" color="#4caf50">
                      Memory Usage
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ textAlign: "center" }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#2e7d32" }}>
                      {vmSpecs.diskUsage} GB
                    </Typography>
                    <Typography variant="body2" color="#4caf50">
                      Disk Usage
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* VM List */}
            <Paper elevation={3} sx={{ borderRadius: 3, border: "1px solid #e3f2fd" }}>
              <Box sx={{ p: 3, borderBottom: "1px solid #f0f0f0" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <ComputerIcon sx={{ color: "#1976d2", mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mr: 1 }}>
                    Running Virtual Machines
                  </Typography>
                  <Chip label={vmList.length} size="small" sx={{ backgroundColor: "#f5f5f5", color: "#666" }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Manage your deployed virtual machines
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                {vmList.length === 0 ? (
                  <Alert severity="info" sx={{ textAlign: "center" }}>
                    No virtual machines are currently running. Deploy a new VM to get started.
                  </Alert>
                ) : (
                  <Box>
                    {vmList.map((vm, index) => (
                      <Card
                        key={vm.ip}
                        variant="outlined"
                        sx={{
                          mb: index === vmList.length - 1 ? 0 : 2,
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 2,
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  backgroundColor: "#e3f2fd",
                                  borderRadius: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  mr: 2,
                                }}
                              >
                                <ComputerIcon sx={{ color: "#1976d2", fontSize: 20 }} />
                              </Box>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                  VM at {vm.ip}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Active
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<MonitorIcon />}
                                onClick={() => handleMonitoring(vm.ip)}
                                sx={{
                                  borderColor: "#e3f2fd",
                                  color: "#1976d2",
                                  "&:hover": { backgroundColor: "#f8fbff" },
                                }}
                              >
                                Monitor
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => handleEditVM(vm.ip)}
                                sx={{
                                  borderColor: "#e0e0e0",
                                  color: "#666",
                                  "&:hover": { backgroundColor: "#f5f5f5" },
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDeleteVM(vm.ip)}
                                sx={{
                                  borderColor: "#ffebee",
                                  color: "#d32f2f",
                                  "&:hover": { backgroundColor: "#fef5f5" },
                                }}
                              >
                                Delete
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<LaunchIcon />}
                                component="a"
                                href="http://localhost:3000/d/1860/node-exporter-full?orgId=1&refresh=10s"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  borderColor: "#e8f5e8",
                                  color: "#2e7d32",
                                  "&:hover": { backgroundColor: "#f1f8e9" },
                                }}
                              >
                                Grafana
                              </Button>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        )}
      </Container>
    </Box>
  )
}

export default VMDeployForm


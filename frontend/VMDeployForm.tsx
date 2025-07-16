"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Server, Monitor, Trash2, Edit, ExternalLink, Plus, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [activeTab, setActiveTab] = useState("deploy")

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

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await axios.post("http://localhost:3001/api/deploy", formData)
      alert("VM Deployment Triggered: " + response.data.message)
      const vmResponse = await axios.get("http://localhost:3001/api/vm-list")
      setVmList(vmResponse.data.vms || [])
      setActiveTab("manage")
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-blue-900">Danone Cloud</span>
              </div>
            </div>
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("deploy")}
                className={`text-sm font-medium transition-colors ${
                  activeTab === "deploy"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-blue-600"
                }`}
              >
                Deploy VM
              </button>
              <button
                onClick={() => setActiveTab("manage")}
                className={`text-sm font-medium transition-colors ${
                  activeTab === "manage"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-blue-600"
                }`}
              >
                Manage VMs
              </button>
              <button
                onClick={refreshData}
                className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors flex items-center space-x-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>Home</li>
            <li>/</li>
            <li className="text-blue-600 font-medium">{activeTab === "deploy" ? "Deploy VM" : "Manage VMs"}</li>
          </ol>
        </nav>

        {activeTab === "deploy" && (
          <div className="space-y-8">
            {/* Main Form */}
            <Card className="border-blue-200 shadow-lg">
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Server className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Deploy Virtual Machine</CardTitle>
                <CardDescription className="text-gray-600 max-w-md mx-auto">
                  Configure and deploy a new virtual machine with FortiGate firewall protection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        VM Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className="bg-blue-50 border-blue-200 focus:border-blue-500"
                        placeholder="Enter VM name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template" className="text-sm font-medium text-gray-700">
                        Template
                      </Label>
                      <Input
                        id="template"
                        name="template"
                        value={formData.template}
                        onChange={(e) => handleChange("template", e.target.value)}
                        className="bg-blue-50 border-blue-200 focus:border-blue-500"
                        placeholder="Enter template name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpu" className="text-sm font-medium text-gray-700">
                        CPUs
                      </Label>
                      <Input
                        id="cpu"
                        name="cpu"
                        type="number"
                        value={formData.cpu}
                        onChange={(e) => handleChange("cpu", Number.parseInt(e.target.value))}
                        className="bg-blue-50 border-blue-200 focus:border-blue-500"
                        min="1"
                        max="16"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="memory" className="text-sm font-medium text-gray-700">
                        Memory (MB)
                      </Label>
                      <Input
                        id="memory"
                        name="memory"
                        type="number"
                        value={formData.memory}
                        onChange={(e) => handleChange("memory", Number.parseInt(e.target.value))}
                        className="bg-blue-50 border-blue-200 focus:border-blue-500"
                        min="512"
                        step="512"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="disk" className="text-sm font-medium text-gray-700">
                        Disk Size (GB)
                      </Label>
                      <Input
                        id="disk"
                        name="disk"
                        type="number"
                        value={formData.disk}
                        onChange={(e) => handleChange("disk", Number.parseInt(e.target.value))}
                        className="bg-blue-50 border-blue-200 focus:border-blue-500"
                        min="10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ip" className="text-sm font-medium text-gray-700">
                        IP Address
                      </Label>
                      <Input
                        id="ip"
                        name="ip"
                        value={formData.ip}
                        onChange={(e) => handleChange("ip", e.target.value)}
                        className="bg-blue-50 border-blue-200 focus:border-blue-500"
                        placeholder="10.0.1.85"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gateway" className="text-sm font-medium text-gray-700">
                        Gateway
                      </Label>
                      <Input
                        id="gateway"
                        name="gateway"
                        value={formData.gateway}
                        onChange={(e) => handleChange("gateway", e.target.value)}
                        className="bg-blue-50 border-blue-200 focus:border-blue-500"
                        placeholder="10.0.1.1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dns" className="text-sm font-medium text-gray-700">
                        DNS Server
                      </Label>
                      <Input
                        id="dns"
                        name="dns"
                        value={formData.dns}
                        onChange={(e) => handleChange("dns", e.target.value)}
                        className="bg-blue-50 border-blue-200 focus:border-blue-500"
                        placeholder="10.0.1.70"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">FortiGate Firewall Policy</Label>
                    <div className="flex space-x-3">
                      <Select
                        value={formData.firewallPolicy}
                        onValueChange={(value) => handleChange("firewallPolicy", value)}
                      >
                        <SelectTrigger className="flex-1 bg-blue-50 border-blue-200 focus:border-blue-500">
                          <SelectValue placeholder="Select a firewall policy..." />
                        </SelectTrigger>
                        <SelectContent>
                          {existingPolicies.map((policy) => (
                            <SelectItem key={policy} value={policy}>
                              {policy}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCreatePolicy}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Policy
                      </Button>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
                    >
                      {isLoading ? "Deploying..." : "Deploy Virtual Machine"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "manage" && (
          <div className="space-y-8">
            {/* VM Specifications */}
            {vmSpecs && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-green-800 flex items-center">
                    <Monitor className="w-5 h-5 mr-2" />
                    VM Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{vmSpecs.cpuUsage}%</div>
                      <div className="text-sm text-green-600">CPU Usage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{vmSpecs.memoryUsage} MB</div>
                      <div className="text-sm text-green-600">Memory Usage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{vmSpecs.diskUsage} GB</div>
                      <div className="text-sm text-green-600">Disk Usage</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VM List */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <Server className="w-5 h-5 mr-2" />
                  Running Virtual Machines
                  <Badge variant="secondary" className="ml-2">
                    {vmList.length}
                  </Badge>
                </CardTitle>
                <CardDescription>Manage your deployed virtual machines</CardDescription>
              </CardHeader>
              <CardContent>
                {vmList.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No virtual machines are currently running. Deploy a new VM to get started.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {vmList.map((vm) => (
                      <Card key={vm.ip} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Server className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">VM at {vm.ip}</div>
                                <div className="text-sm text-gray-500">Active</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMonitoring(vm.ip)}
                                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                <Monitor className="w-4 h-4 mr-1" />
                                Monitor
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditVM(vm.ip)}
                                className="border-gray-200 text-gray-600 hover:bg-gray-50"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteVM(vm.ip)}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="border-green-200 text-green-600 hover:bg-green-50 bg-transparent"
                              >
                                <a
                                  href="http://localhost:3000/d/1860/node-exporter-full?orgId=1&refresh=10s"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Grafana
                                </a>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default VMDeployForm

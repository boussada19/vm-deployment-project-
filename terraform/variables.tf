variable "vsphere_user" {
  type        = string
  description = "Nom d'utilisateur vSphere"
  default     = "administrator@vsphere.local"
}

variable "vsphere_password" {
  type        = string
  description = "Mot de passe vSphere"
  sensitive   = true
  default     = "y#1>hwAsr%r,sx1"
}

variable "vsphere_server" {
  type        = string
  description = "Adresse IP ou nom DNS du vCenter Server"
  default     = "10.0.1.50"
}

variable "vm_name" {
  type        = string
  description = "Name of the VM"
}

variable "template_name" {
  type        = string
  description = "Name of the VM template"
}

variable "num_cpus" {
  type        = number
  description = "Number of CPUs"
}

variable "memory" {
  type        = number
  description = "Memory in MB"
}

variable "disk_size" {
  type        = number
  description = "Disk size in GB"
}

variable "ip_address" {
  type        = string
  description = "IP address for the VM"
}

variable "gateway" {
  type        = string
  description = "Gateway IP"
}

variable "dns" {
  type        = string
  description = "DNS server IP"
}

variable "firewall_policy" {
  type        = string
  description = "FortiGate firewall policy to apply"
  default     = "default-policy"
}

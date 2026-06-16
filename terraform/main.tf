terraform {
required_providers {
local = {
source = "hashicorp/local"
version = "~> 2.4"
}
}
}

provider "local" {}

resource "local_file" "helixai_infra" {
filename = "helixai-infrastructure.txt"

content = <<EOT
HelixAI Infrastructure

Kubernetes Cluster
PostgreSQL Database
Vault
Prometheus
Grafana
Loki
Jenkins
EOT
}

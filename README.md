# 🧬 HelixAI – Global Precision Medicine and Genomic Intelligence Platform

## 🚀 Project Overview

HelixAI is a cloud-native precision medicine platform designed to process genomic data, clinical records, laboratory reports, and healthcare analytics at scale.

The platform demonstrates a complete DevOps ecosystem capable of supporting healthcare workloads while ensuring scalability, observability, security, automation, and operational reliability.

---

## ❓ Problem Statement

Modern healthcare organizations generate massive amounts of genomic and clinical data.

Traditional infrastructure suffers from:

❌ Infrastructure outages

❌ Delayed genomic analysis

❌ Failed deployments

❌ Poor observability

❌ Data synchronization issues

❌ Security vulnerabilities

HelixAI addresses these challenges through a cloud-native DevOps architecture.

---

## 🎯 Objectives

✅ Build a scalable healthcare platform

✅ Automate infrastructure provisioning

✅ Containerize applications

✅ Implement CI/CD pipelines

✅ Enable Kubernetes orchestration

✅ Implement monitoring and logging

✅ Secure credentials using Vault

✅ Demonstrate Infrastructure as Code using Terraform

---

## 🛠 Technology Stack

### 🔹 Frontend

* React 19 with TypeScript
* Vite
* Tailwind CSS and a custom HelixAI design system
* React Router
* TanStack Query
* Axios
* React Hook Form and Zod
* Recharts
* Framer Motion

### 🔹 Backend

* FastAPI
* Python

### 🔹 Database

* PostgreSQL

### 🔹 Containerization

* Docker
* Docker Compose

### 🔹 CI/CD

* Jenkins

### 🔹 Orchestration

* Kubernetes

### 🔹 Monitoring

* Prometheus
* Grafana

### 🔹 Logging

* Loki
* Promtail

### 🔹 Security

* HashiCorp Vault

### 🔹 Infrastructure as Code

* Terraform

---

## 📂 Project Structure

```text
helixai/

├── app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── test/
│   ├── Dockerfile
│   └── nginx.conf
├── docker/
├── k8s/
├── terraform/
├── monitoring/
├── logging/
├── security/
├── screenshots/
├── Jenkinsfile
└── README.md
```

---

## ✨ Features

🔹 Patient Management API

🔹 PostgreSQL Integration

🔹 Dockerized Deployment

🔹 Kubernetes Deployment

🔹 Health Checks

🔹 Autoscaling

🔹 Centralized Logging

🔹 Monitoring Dashboard

🔹 Vault Secret Management

🔹 Terraform Automation

---

## 🔄 CI/CD Pipeline

```text
GitHub
   ↓
Jenkins
   ↓
Docker Build
   ↓
Docker Hub
   ↓
Kubernetes Deployment
```

---

## 📊 Monitoring

Prometheus collects infrastructure and application metrics.

Grafana provides visual dashboards for monitoring:

📈 CPU Utilization

📈 Memory Utilization

📈 Pod Health

📈 Cluster Status

📈 Application Performance

---

## 📝 Logging

Loki and Promtail collect centralized logs from Kubernetes workloads.

Benefits:

✅ Centralized Log Storage

✅ Faster Troubleshooting

✅ Real-Time Log Analysis

---

## 🔐 Security

Vault securely stores and manages:

🔑 Database Credentials

🔑 API Keys

🔑 Application Secrets

🔑 Sensitive Configuration Data

---

## ☁️ Infrastructure Automation

Terraform provisions infrastructure resources using Infrastructure as Code principles.

Benefits:

✅ Repeatable Deployments

✅ Version Controlled Infrastructure

✅ Automated Provisioning

✅ Reduced Human Errors

---

## 🧪 Running Tests

### API Health Check

```bash
curl http://localhost:8000/health
```

### Verify Kubernetes Resources

```bash
kubectl get pods
kubectl get services
kubectl get deployments
```

### Verify Docker Containers

```bash
docker ps
```

### Verify Vault

```bash
vault status
```

### Verify Terraform

```bash
terraform validate
terraform plan
```

---

## ▶️ How to Run Locally

### Clone Repository

```bash
git clone https://github.com/codebreaker939/helixai.git

cd helixai
```

### Start Application

```bash
docker compose -f docker/docker-compose.yml up -d
```

### Start Application With Dashboards

```bash
docker compose -f docker/docker-compose.yml --profile dashboards up -d
```

### Verify Containers

```bash
docker ps
```

### Access API

```text
http://localhost:8000
```

### Access HelixAI Web Platform

```text
http://localhost:3000
```

### Swagger Documentation

```text
http://localhost:8000/docs
```

### Local Dashboards

```text
FastAPI Swagger: http://localhost:8000/docs
HelixAI Web Platform: http://localhost:3000
Grafana: http://localhost:3001
Prometheus: http://localhost:9091
Loki API: http://localhost:3100/ready
Vault UI: http://localhost:8200
Jenkins: http://localhost:8081
PostgreSQL Adminer: http://localhost:8082
```

Default local credentials:

```text
Grafana: admin / admin
Vault token: root
Adminer:
  System: PostgreSQL
  Server: postgres
  Username: helixai
  Password: helixai123
  Database: helixai_db
```

Useful local dashboard paths:

```text
Grafana HelixAI Overview: http://localhost:3001/d/helixai-overview/helixai-overview
Prometheus Targets: http://localhost:9091/targets
Prometheus HelixAI Metrics: http://localhost:9091/query?g0.expr=helixai_http_requests_total
Vault HelixAI secrets:
  secret/helixai/database
  secret/helixai/api
  secret/helixai/monitoring
```

---

## 🌍 Live Demo

### Application

```text
http://localhost:8000
```

### Swagger UI

```text
http://localhost:8000/docs
```

### Grafana Dashboard

```text
http://localhost:3001
```

### Prometheus

```text
http://localhost:9091
```

### Vault UI

```text
http://localhost:8200
```

### Jenkins

```text
http://localhost:8081
```

### PostgreSQL Adminer

```text
http://localhost:8082
```

> Replace these URLs with your deployed endpoints once hosted.

---

## 🖥 Frontend Platform

The `frontend/` application is a responsive operations and clinical-data console built against the
real FastAPI API. It includes:

* Public HelixAI landing page
* Live system-health overview
* Searchable, sortable, paginated patient CRUD
* Jenkins build metadata, stages, and console polling
* Prometheus request-rate, error-rate, latency, availability, and record-count charts
* Restricted Kubernetes deployment, pod, and service inventory
* Sanitized Vault and environment security posture
* API explorer generated from `/openapi.json`
* Runtime activity and local operator preferences

Authentication pages are intentionally absent because the current FastAPI backend does not expose an
authentication or account API.

### Local frontend development

Start PostgreSQL and FastAPI:

```bash
docker compose -f docker/docker-compose.yml up -d postgres api
```

Then run the Vite development server:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies API requests to `http://localhost:8000` by
default. If that port is already in use, start the API on another port and set
`VITE_API_PROXY_TARGET` when starting Vite, for example:

```bash
API_PORT=8001 docker compose -f docker/docker-compose.yml up -d api
cd frontend
VITE_API_PROXY_TARGET=http://localhost:8001 npm run dev
```

### Frontend environment variables

| Variable | Purpose | Local default |
|---|---|---|
| `VITE_API_BASE_URL` | FastAPI base path or origin | `/api` |
| `VITE_API_PROXY_TARGET` | Vite development proxy target | `http://localhost:8000` |
| `VITE_GRAFANA_URL` | Public Grafana link | `http://localhost:3001` |
| `VITE_PROMETHEUS_URL` | Public Prometheus link | `http://localhost:9091` |
| `VITE_JENKINS_PUBLIC_URL` | Public Jenkins link | `http://localhost:8081` |
| `VITE_ENVIRONMENT` | Environment label | `development` |

These variables are public build-time configuration. Do not put credentials or secret values in any
`VITE_*` variable.

### Quality commands

```bash
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
```

### Production container

The multi-stage `frontend/Dockerfile` builds static assets and serves them with Nginx. Nginx:

* falls back to `index.html` for React Router paths;
* proxies FastAPI paths to the Compose `api` service;
* exposes `/frontend-health` for container and Kubernetes probes;
* applies basic browser security headers;
* caches fingerprinted assets.

Build and run the full core stack:

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

Start the platform with Grafana, Prometheus, Loki, Vault, Jenkins, and Adminer:

```bash
docker compose -f docker/docker-compose.yml --profile dashboards up -d --build
```

### Kubernetes deployment

The frontend workload is defined in `k8s/frontend-deployment.yaml` and is exposed locally through
NodePort `30081`. Apply resources in this order:

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/api-ops-rbac.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/hpa.yaml
```

`api-ops-rbac.yaml` grants the FastAPI service account read-only access to deployments, pods, and
services in its namespace. It does not grant mutation access or expose Kubernetes credentials to the
browser.

### Jenkins integration

The Jenkinsfile preserves the original backend image stages and adds:

1. Frontend dependency installation
2. Linting, type checking, and tests
3. Production frontend build
4. Backend and frontend Docker image builds
5. Backend and frontend image pushes
6. Optional Kubernetes deployment
7. API and frontend rollout verification

Set these variables only on the FastAPI/Jenkins server side:

```text
JENKINS_URL
JENKINS_JOB
JENKINS_USERNAME
JENKINS_API_TOKEN
```

The browser polls `/api/ops/jenkins` and `/api/ops/jenkins/log` every four seconds. The FastAPI proxy
uses credentials server-side and returns only build metadata, workflow stages, and capped console
text. Trigger/retry actions are not exposed because the existing Jenkins setup does not define a
safe, authorized build-trigger endpoint.

### Monitoring integration

FastAPI exports Prometheus metrics at `/metrics`:

```text
helixai_http_requests_total
helixai_http_request_duration_seconds
helixai_patient_records
```

The web platform requests bounded query ranges through `/api/ops/monitoring`; it does not send
Prometheus credentials to the browser. CPU, memory, pod restart, and node metrics require a
Kubernetes metrics exporter such as kube-state-metrics or node-exporter and are shown as unavailable
until those exporters exist.

### Dashboard data provenance

| Dashboard value | Real source | Availability |
|---|---|---|
| Patient records and count | FastAPI + PostgreSQL | Available |
| API/database health and API uptime | FastAPI process + SQLAlchemy | Available |
| Request rate, 5xx rate, p95 latency, API instances | Prometheus | Available when dashboards profile is running |
| Jenkins build, commit, stages, duration, logs | Jenkins APIs through FastAPI | Available after a job and server-side credentials are configured |
| Deployments, pods, services, replicas, images, restarts | Kubernetes API through restricted FastAPI service account | Available when deployed in-cluster |
| Vault seal, initialization, version, cluster state | Vault health API through FastAPI | Available when Vault is reachable |
| Grafana/Prometheus/Vault/Jenkins reachability | FastAPI server-side checks | Available |
| CPU and memory | No exporter in current repository | Unavailable |
| Durable audit history | No audit table in current schema | Runtime-only activity |
| User/account status | No authentication API | Unavailable |
| Last secret rotation | No least-privilege metadata policy | Unavailable |

The UI displays disconnected or unavailable states for missing integrations; it does not generate
successful mock data.

### Troubleshooting

**The dashboard reports optional systems as unavailable**

Start the dashboards profile and allow up to 30 seconds for Prometheus and Grafana to initialize:

```bash
docker compose -f docker/docker-compose.yml --profile dashboards up -d
docker compose -f docker/docker-compose.yml --profile dashboards ps
```

**Jenkins has no build data**

Create/configure the `helixai` Jenkins job or set `JENKINS_JOB`, then provide server-side
`JENKINS_USERNAME` and `JENKINS_API_TOKEN`. Never add them to `frontend/.env`.

**Kubernetes page is unavailable locally**

This is expected in Docker Compose. The endpoint requires an in-cluster service-account token and
the restricted RBAC manifest.

**A React route returns 404 after refresh**

Use the supplied Nginx configuration. It routes unknown application paths back to `index.html`.

**Prometheus charts are empty**

Generate API traffic, verify the `helixai-api` target at `http://localhost:9091/targets`, and query
`helixai_http_requests_total`.

## 📸 Web screenshots

Add validated desktop, tablet, and mobile captures to `screenshots/` after deploying the desired
environment. Existing screenshots document the backend and infrastructure setup.

---

## 📸 Screenshots

Refer to the screenshots folder for:

📷 API Documentation

📷 Jenkins Pipeline

📷 Docker Containers

📷 Kubernetes Deployment

📷 Prometheus Metrics

📷 Grafana Dashboard

📷 Vault Secrets

📷 Terraform Deployment

---

## 🔮 Future Scope

🚀 Multi-Region Deployment

🚀 Genomic Data Processing Pipelines

🚀 AI-Powered Diagnostics

🚀 Service Mesh Integration

🚀 Automated Disaster Recovery

🚀 Multi-Cloud Deployment

🚀 Healthcare Data Compliance Enhancements

---

## 👨‍💻 Author

**Aniket Rai**

B.Tech CSE (2024–2028)

ITM Skills University

GitHub: https://github.com/codebreaker939/helixai

---

## 🎉 Conclusion

HelixAI successfully demonstrates a production-ready DevOps ecosystem integrating application development, infrastructure automation, security, monitoring, logging, and Kubernetes orchestration.

The project showcases modern DevOps practices used in real-world healthcare and genomic intelligence platforms while emphasizing scalability, reliability, observability, and security.

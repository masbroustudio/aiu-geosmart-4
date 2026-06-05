# 12 — Azure Architecture 2026: Modern Patterns & Upgrade Strategy

**Version:** 4.0 (Planning) → 4.1 (Implementation)  
**Last Updated:** 2026-06-02  
**Status:** Architecture Decision Document

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Compute Strategy: Functions vs Container Apps vs AKS](#compute-strategy)
3. [Managed Identity: Passwordless Authentication](#managed-identity)
4. [API Gateway: Rate Limiting & Versioning](#api-gateway)
5. [Multi-Region Disaster Recovery](#multi-region-dr)
6. [Database Evolution: PostgreSQL → Cosmos DB](#database-evolution)
7. [Infrastructure-as-Code (Terraform/Bicep)](#infrastructure-as-code)
8. [Cost Optimization](#cost-optimization)
9. [Upgrade Path: v4.0 → v4.1](#upgrade-path)

---

## Executive Summary

GeoUMKM Smart v4.0 is production-ready on **Azure Functions** (simple, proven, cost-effective). However, as traffic scales and features grow, we need to prepare for 2026+ cloud best practices:

| Aspect | v4.0 (Now) | v4.1 (Q3 2026) | Rationale |
|--------|-----------|---------------|-----------|
| **Compute** | Azure Functions | Container Apps | Better scaling (>10k req/min) + streaming |
| **Secrets** | Key Vault API calls | Managed Identity | No passwords, automatic rotation |
| **Gateway** | Functions direct | API Gateway | Rate limiting at edge, versioning |
| **Region** | Single (Southeast Asia) | Multi-region (read replicas) | DR + low latency for multiple regions |
| **Database** | PostgreSQL | PostgreSQL + Cosmos DB | Relational + distributed cache |
| **Cost** | ~$800/month | ~$1200/month | Better performance, enterprise features |

**Bottom Line**: v4.0 works great now. v4.1 adds enterprise-grade resilience + global scale.

---

## Compute Strategy: Functions vs Container Apps vs AKS

### Azure Functions (v4.0 - Current)

**Architecture**:
```
User Request → API Gateway (future) → Azure Functions → PostgreSQL/Redis
```

**Pros**:
- ✅ Serverless (pay per execution)
- ✅ Simple deployment (GitHub Actions → auto-deploy)
- ✅ Built-in auth (Easy Auth)
- ✅ Monitoring (Application Insights integrated)
- ✅ Cost-effective for intermittent traffic (~$50-150/month compute)
- ✅ No infrastructure to manage

**Cons**:
- ❌ Cold starts (1-5 seconds on first invocation)
- ❌ Streaming inefficient (long-running not ideal)
- ❌ Scaling limited (>10k concurrent = expensive)
- ❌ Model hosting tricky (large ML models)
- ❌ Not ideal for Chat feature (needs streaming response)

**Best For**:
- REST APIs with request-response patterns
- Batch jobs (<5 min execution)
- Webhook handlers
- Scheduled tasks

**Deployment** (GitHub Actions):
```yaml
# v4.0 today
- name: Deploy to Azure Functions
  uses: Azure/functions-action@v1
  with:
    app-name: 'fa-geoumkm-api'
    package: '.'
```

**Cost Calculation** (v4.0):
```
Function executions: 10M/month × $0.0000002 = $2
Compute time: 10M × 100ms × $0.000016667 = $17
Total: ~$19/month (cheapest tier)
+ Database: ~$300
+ Storage: ~$100
= ~$420/month base
```

---

### Container Apps (v4.1 - Recommended Upgrade)

**Architecture**:
```
User Request → API Gateway → Container Apps (load balanced) → PostgreSQL/Redis
```

**What is Container Apps?**
- Serverless Kubernetes alternative
- Runs Docker containers
- Auto-scales based on CPU/memory/HTTP requests
- Pay per vCore-hour used (more predictable than Functions)

**Pros**:
- ✅ Streaming support (Server-Sent Events, WebSocket)
- ✅ Better scaling (>100k req/min easily)
- ✅ Cheaper for sustained load (vCore-hour model)
- ✅ Large model hosting (GPU support via revision settings)
- ✅ Multiple revisions/blue-green deployment
- ✅ Better for Chat feature (long-running connections)
- ✅ Dapr integration (service-to-service communication)

**Cons**:
- ❌ Slightly more complex (manage container registry, images)
- ❌ Cold starts still exist (but mitigated with min replicas)
- ❌ Not fully serverless (some infrastructure awareness needed)

**Best For**:
- APIs with varying loads (peaks & valleys)
- WebSocket/streaming applications (like Chat)
- Microservices architecture
- Running custom Docker images

**Cost Calculation** (v4.1):
```
Min replicas: 2 vCore-hours
Avg traffic: 50 vCore-hours/month
Storage: included with container registry
Total: ~$150/month (Container Apps)
+ Database: ~$400 (slightly larger)
+ Redis: ~$100
= ~$650/month (vs $420 for Functions)
Extra cost: $230/month for 3-5x better scaling
```

**Deployment** (GitHub Actions v4.1):
```yaml
# v4.1 future
- name: Build & push to ACR
  uses: azure/docker-login@v1
  with:
    login-server: acrgeoumkm.azurecr.io
    username: ${{ secrets.REGISTRY_USERNAME }}
    password: ${{ secrets.REGISTRY_PASSWORD }}

- name: Build Docker image
  run: docker build . -t acrgeoumkm.azurecr.io/geoumkm-api:${{ github.sha }}

- name: Deploy to Container Apps
  uses: Azure/container-apps-deploy-action@v1
  with:
    imageToDeploy: acrgeoumkm.azurecr.io/geoumkm-api:${{ github.sha }}
    containerAppName: ca-geoumkm-api
```

---

### Azure Kubernetes Service (AKS - Future 2027+)

**When to Use**: Only if you need true multi-cluster, complex orchestration, or vendor lock-in avoidance.

Not recommended for GeoUMKM Smart (Container Apps covers 99% of needs at lower cost).

---

### Recommendation

| Version | Compute | Rationale |
|---------|---------|-----------|
| **v4.0 (Now)** | Azure Functions | Proven, simple, cost-effective |
| **v4.1** | Container Apps | Better Chat feature, scaling |
| **v5.0** | AKS (if needed) | True multi-region, advanced patterns |

**Action Items**:
1. ✅ v4.0: Deploy to Functions now (already done)
2. 📋 v4.1: Plan Container Apps migration (parallel deployment, blue-green)
3. 📋 v5.0: Evaluate AKS if business scales beyond expectations

---

## Managed Identity: Passwordless Authentication

### Current (v4.0): Key Vault API calls with secrets

```python
# Problem: Hardcoded secret rotation
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

credential = DefaultAzureCredential()  # Looks for env vars, client secrets, etc.
client = SecretClient(vault_url=kv_url, credential=credential)

# Fetches POSTGRES_PASSWORD at runtime
db_password = client.get_secret("postgres-password").value
```

**Issues**:
- ❌ Secrets exposed in environment variables
- ❌ Manual rotation needed
- ❌ Audit trail incomplete
- ❌ Not aligned with Zero Trust principles

---

### Future (v4.1): Managed Identity

```python
# Solution: Managed Identity (no credentials needed)
from azure.identity import DefaultAzureCredential

# Container App has system-assigned Managed Identity
credential = DefaultAzureCredential()

# Directly connect to PostgreSQL using Managed Identity
import pyodbc
# Connection string: 
# Driver={ODBC Driver 17 for SQL Server};Server=prod-postgres.postgres.database.azure.com;Database=geoumkm_prod;Authentication=ActiveDirectoryManagedIdentity;UID=<app-managed-identity-client-id>;

# No password needed!
conn = pyodbc.connect(connection_string)
```

**Setup for v4.1**:

1. **Enable Managed Identity on Container App**:
```bash
az containerapp identity assign \
  --name ca-geoumkm-api \
  --resource-group rg-geoumkm \
  --system-assigned
```

2. **Grant Managed Identity access to PostgreSQL**:
```bash
# Create a database user for the Managed Identity
# In PostgreSQL:
CREATE USER "ca-geoumkm-api" WITH LOGIN;
GRANT CONNECT ON DATABASE geoumkm_prod TO "ca-geoumkm-api";
GRANT ALL PRIVILEGES ON SCHEMA public TO "ca-geoumkm-api";
```

3. **Connection in application**:
```python
# No credentials in environment!
conn = psycopg2.connect(
    host="prod-postgres.postgres.database.azure.com",
    database="geoumkm_prod",
    user="ca-geoumkm-api",  # Managed Identity user
    password=get_access_token(),  # Token from Managed Identity
    sslmode="require"
)
```

**Benefits**:
- ✅ No hardcoded secrets
- ✅ Automatic token rotation
- ✅ Better audit trail
- ✅ Aligned with Zero Trust security

---

## API Gateway: Rate Limiting & Versioning

### Current (v4.0): Rate limiting in function code

```python
# Hardcoded rate limit logic
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@limiter.limit("100/minute")  # Simple rate limit
@app.post("/api/v1/credit-score")
async def credit_score(request):
    return {"score": 0.75}
```

**Problems**:
- ❌ Rate limit enforced after function start (wastes compute)
- ❌ No per-role differentiation at entry point
- ❌ API versioning hidden in code
- ❌ Can't throttle at network edge

---

### Future (v4.1): Azure API Gateway

**Architecture**:
```
Client → API Gateway → Container App → PostgreSQL

Gateway handles:
  • Rate limiting (per role, per IP)
  • API versioning (v1, v2 routes)
  • Authentication validation (JWT)
  • Request/response transformation
  • CORS
```

**Setup (v4.1)**:

1. **Create API Gateway**:
```bash
az apim create \
  --name apim-geoumkm \
  --resource-group rg-geoumkm \
  --publisher-name "GeoUMKM Smart" \
  --publisher-email admin@geoumkm.com \
  --sku-name Developer
```

2. **Create API in Gateway**:
```bash
az apim api create \
  --resource-group rg-geoumkm \
  --apim-name apim-geoumkm \
  --api-id geoumkm-api \
  --path geoumkm \
  --protocols https \
  --service-url https://ca-geoumkm-api.azurecontainerapps.io/api
```

3. **Add rate limiting policy**:
```xml
<!-- In gateway policy -->
<policies>
  <inbound>
    <!-- Different limits by operation tag -->
    <rate-limit-by-key calls="100" renewal-period="60" counter-key="@(context.User.Id)" />
  </inbound>
</policies>
```

4. **Rate limits per role** (via subscriptions):
```
Bank subscription: 100 requests/minute
Government subscription: 50 requests/minute
Investor subscription: 50 requests/minute
```

**Benefits**:
- ✅ Rate limiting at network edge (before Container App)
- ✅ Per-role limits easy to enforce
- ✅ Better cost (failed requests don't consume compute)
- ✅ API versioning separation (v1, v2 routes)
- ✅ Monitoring per endpoint

**Cost**: ~$50-200/month depending on tier (Developer to Premium)

---

## Multi-Region Disaster Recovery

### Current (v4.0): Single region

```
User in Jakarta   →  Southeast Asia datacenter  →  PostgreSQL
User in Surabaya →  Same datacenter (1000 km!)  →  Same DB
```

**Problem**: If Southeast Asia region goes down, entire service down. ~99.9% SLA.

---

### Future (v4.1): Multi-region with read replicas

**Architecture**:
```
                    Traffic Manager
                         |
                    (geo-routing)
                   /            \
         Southeast Asia      East Asia
         (Primary)           (Secondary)
              |                  |
       Container App        Container App
              |                  |
       PostgreSQL Master   PostgreSQL Read Replica
              |                  |
           (writes)         (read-only)
              |__________________|
                       |
                  Stream Replication
```

**Setup (v4.1)**:

1. **Create read replica**:
```bash
az postgres server replica create \
  --name prod-postgres-replica \
  --source-server prod-postgres \
  --location eastasia  # Different region
  --resource-group rg-geoumkm
```

2. **Create Traffic Manager**:
```bash
az network traffic-manager profile create \
  --name tm-geoumkm \
  --resource-group rg-geoumkm \
  --routing-method Geographic
```

3. **Add endpoints**:
```bash
# Primary
az network traffic-manager endpoint create \
  --name endpoint-primary \
  --profile-name tm-geoumkm \
  --resource-group rg-geoumkm \
  --type azureEndpoints \
  --target-resource-id /subscriptions/.../containerApps/ca-geoumkm-api
  --geo-mapping="ID"  # Indonesia

# Secondary (disaster recovery)
az network traffic-manager endpoint create \
  --name endpoint-secondary \
  --profile-name tm-geoumkm \
  --resource-group rg-geoumkm \
  --type azureEndpoints \
  --target-resource-id /subscriptions/.../containerApps/ca-geoumkm-api-replica
  --geo-mapping="TH"  # Thailand as fallback
```

4. **Health check configuration**:
```bash
# Monitor if primary is down, automatically failover to secondary
az network traffic-manager profile update \
  --name tm-geoumkm \
  --resource-group rg-geoumkm \
  --protocol HTTPS \
  --port 443 \
  --path /api/v1/health
```

**RTO/RPO Targets**:
- **RTO** (Recovery Time Objective): 5 minutes (automatic failover)
- **RPO** (Recovery Point Objective): 1 minute (replication lag)

**Cost**: +$300-500/month for read replica + Traffic Manager

---

## Database Evolution: PostgreSQL → Cosmos DB

### Current (v4.0): PostgreSQL only

```
PostgreSQL (Southeast Asia)
├─ Credit scores table
├─ UMKM profiles table
├─ Audit logs table
└─ Model metadata table

Limitations:
  • Single region (latency for international users)
  • Not optimized for document data (Chat history, RAG cache)
  • Scaling write-heavy workloads expensive
```

---

### Future (v4.1): PostgreSQL + Cosmos DB

**When to use Cosmos DB**:
- ✅ Chat conversation history (document format ideal)
- ✅ RAG knowledge base cache (vector embeddings)
- ✅ Global distribution (users in 10+ countries)
- ✅ Real-time data sync across regions

**When NOT to use Cosmos DB**:
- ❌ Structured relational data (UMK profiles) → keep in PostgreSQL
- ❌ Complex transactions → PostgreSQL better
- ❌ Cost-sensitive (Cosmos DB pricier)

**Recommendation for v4.1**:
```
PostgreSQL (primary datastore)
├─ Credit scores (relational, strongly consistent)
├─ UMKM profiles
└─ Audit logs

Cosmos DB (cache + documents)
├─ Chat conversation history (document, TTL=30 days)
├─ RAG knowledge base (vector embeddings for semantic search)
└─ User preferences (document)
```

**Setup (v4.1)**:

1. **Create Cosmos DB account**:
```bash
az cosmosdb create \
  --resource-group rg-geoumkm \
  --name cosmos-geoumkm \
  --kind MongoDB  # or SQL API
  --locations regionName=Southeast\ Asia failoverPriority=0
  --locations regionName=East\ Asia failoverPriority=1
```

2. **Create database & containers**:
```bash
# Chat history (TTL: documents auto-delete after 30 days)
az cosmosdb database create \
  --account-name cosmos-geoumkm \
  --resource-group rg-geoumkm \
  --name geoumkm_vectors

az cosmosdb sql container create \
  --account-name cosmos-geoumkm \
  --database-name geoumkm_vectors \
  --name chat_history \
  --partition-key-path /umkm_id \
  --ttl 2592000  # 30 days in seconds
```

3. **Cost estimate**:
```
Provisioned throughput: 400 RU/s (min)
Monthly cost: 400 RU/s × 730 hours × $0.00012 = ~$35
Multi-region replication: 2x cost = ~$70/month
```

---

## Infrastructure-as-Code (Terraform/Bicep)

### Current (v4.0): Manual Azure portal + GitHub Actions

**Problems**:
- ❌ Configuration drift (what's deployed ≠ what's documented)
- ❌ Disaster recovery (re-create manually = error-prone)
- ❌ No version history for infra
- ❌ Environment parity hard to maintain

---

### Future (v4.1): Terraform for all resources

**Terraform Structure** (v4.1):

```
terraform/
├─ main.tf              # Main resources (Container Apps, databases, etc.)
├─ variables.tf         # Input variables (region, environment, etc.)
├─ outputs.tf           # Outputs (endpoint URLs, connection strings)
├─ backend.tf           # Remote state in Azure Storage
├─ environments/
│  ├─ dev.tfvars
│  ├─ staging.tfvars
│  └─ prod.tfvars
└─ modules/
   ├─ networking/
   ├─ database/
   ├─ container_apps/
   └─ monitoring/
```

**Key Resources (terraform/main.tf)**:

```hcl
# Provider
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  backend "azurerm" {
    resource_group_name  = "rg-terraform"
    storage_account_name = "tfstate"
    container_name       = "state"
    key                  = "geoumkm.tfstate"
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
}

# Container Apps Environment
resource "azurerm_container_app_environment" "env" {
  name                = "cae-geoumkm-${var.environment}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

# Container App (API)
resource "azurerm_container_app" "api" {
  name                = "ca-geoumkm-api-${var.environment}"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name = azurerm_resource_group.rg.name
  
  template {
    container {
      name  = "geoumkm-api"
      image = "${var.container_registry_url}/geoumkm-api:${var.image_tag}"
      cpu   = 0.5
      memory = "1Gi"
      env {
        name  = "DATABASE_URL"
        value = azurerm_postgresql_server.db.connection_string
      }
    }
  }
}

# PostgreSQL Database
resource "azurerm_postgresql_server" "db" {
  name                = "prod-postgres-${var.environment}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku_name            = "B_Gen5_2"  # Burstable, 2 vCore
  # ... more configuration
}

# Output
output "api_endpoint" {
  value = azurerm_container_app.api.ingress[0].fqdn
}
```

**Deployment (GitHub Actions)**:

```yaml
name: Deploy with Terraform

on:
  push:
    branches:
      - main
    paths:
      - 'terraform/**'

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.6.0
      
      - name: Terraform Init
        run: terraform init
        env:
          ARM_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
          ARM_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
          ARM_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
          ARM_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Terraform Plan
        run: terraform plan -var-file="environments/prod.tfvars"
      
      - name: Terraform Apply
        run: terraform apply -auto-approve -var-file="environments/prod.tfvars"
```

**Benefits**:
- ✅ Infrastructure as code (version control)
- ✅ Reproducible deployments
- ✅ Easy environment parity (dev, staging, prod)
- ✅ Disaster recovery (re-create from code)
- ✅ Cost tracking (terraform cost estimates)

---

## Cost Optimization

### v4.0 Current Costs (~$420-650/month)

| Component | Cost | Notes |
|-----------|------|-------|
| Azure Functions | $19 | 10M invocations |
| PostgreSQL | $300 | Single region, B-series |
| Redis Cache | $100 | Basic tier |
| Storage | $50 | Blob + Application Insights |
| Bandwidth | $20 | Egress charges |
| **Total** | **$489** | Minimal production setup |

### v4.1 Planned Costs (~$1,100-1,500/month)

| Component | Cost | Notes |
|-----------|------|-------|
| Container Apps | $150 | 2 min replicas, sustained load |
| PostgreSQL Primary | $300 | Single region |
| PostgreSQL Replica | $300 | Multi-region read-only |
| Cosmos DB | $70 | Chat history + RAG cache |
| Redis Cache | $150 | Standard tier, larger capacity |
| API Gateway | $150 | Standard tier |
| Traffic Manager | $50 | Failover routing |
| Storage | $100 | Increased from v4.0 |
| Monitoring | $100 | Enhanced Application Insights |
| Bandwidth | $100 | Multi-region egress |
| **Total** | **$1,370** | Enterprise-grade resilience |

### Cost Optimization Strategies

1. **Reserved Capacity** (save 20-30%):
```bash
# 1-year reserved instance for PostgreSQL
az costmanagement reservations list --resource-type Microsoft.DBForPostgreSQL/servers
```

2. **Auto-shutdown for dev/staging**:
```bash
# Stop Container Apps during off-hours
az containerapp stop --name ca-geoumkm-api-dev --resource-group rg-geoumkm
```

3. **Spot VMs for batch jobs**:
- Spot VMs 70% cheaper, good for non-critical workloads

4. **CDN for frontend** (future):
- Azure CDN caches static assets, reduces egress costs

---

## Upgrade Path: v4.0 → v4.1

### Timeline

```
June 2026 (v4.0):        Production on Azure Functions
  ✅ Deployed & stable
  ✅ URL consistency achieved
  ✅ Chat/RAG feature working
  
Q3 2026 (v4.1 prep):     Plan Container Apps migration
  □ Set up Terraform for IaC
  □ Design multi-region strategy
  □ Test Managed Identity integration
  
Q3 2026 (v4.1 beta):     Parallel deployment
  □ Deploy to Container Apps (same region)
  □ Blue-green switch (gradually route traffic)
  □ Functions still running (safety fallback)
  
Q4 2026 (v4.1 GA):       Full migration
  □ All traffic to Container Apps
  □ Decommission Functions
  □ Deploy read replicas
  □ Activate API Gateway
  
2027:                     Global expansion
  □ Multi-region active-active (if needed)
  □ Cosmos DB for global cache
  □ AKS if complexity warrants
```

### Migration Steps (v4.1 beta)

1. **Deploy Container Apps parallel**:
```bash
# New Container Apps instance (same image as Functions)
az containerapp create \
  --name ca-geoumkm-api-beta \
  --resource-group rg-geoumkm \
  --environment cae-geoumkm \
  --image acrgeoumkm.azurecr.io/geoumkm-api:latest
```

2. **Configure Traffic Manager for blue-green**:
```bash
# 90% to Functions, 10% to Container Apps (test)
# Gradually shift: 80/20 → 50/50 → 10/90 → 0/100
```

3. **Monitor for 1 week**:
- Same error rates?
- Similar latency?
- No data loss?
- Cost as expected?

4. **Full cutover**:
```bash
# All traffic to Container Apps
# Delete Azure Functions (keep backup 1 week)
```

---

## Decision Matrix: v4.0 vs v4.1

| Need | v4.0 | v4.1 | Priority |
|------|------|------|----------|
| Production now | ✅ | N/A | DONE |
| Streaming (Chat) | ⚠️ (works, suboptimal) | ✅ | HIGH |
| Scaling >10k req/min | ❌ | ✅ | MEDIUM (future) |
| Multi-region DR | ❌ | ✅ | MEDIUM |
| Zero-Trust security (Managed ID) | ❌ | ✅ | MEDIUM |
| Cost predictability | ⚠️ (per-invocation) | ✅ (vCore-hour) | LOW |

**Conclusion**: v4.0 production-ready NOW. v4.1 recommended for Q3 2026 (6 months).

---

## Summary: Architecture Evolution

```
v4.0 (2026 Q2)                    v4.1 (2026 Q3)                  v5.0 (2027)
├─ Azure Functions                ├─ Container Apps               ├─ AKS (if needed)
├─ Single region                  ├─ Multi-region                 ├─ True global
├─ Key Vault secrets              ├─ Managed Identity             ├─ Workload Identity
├─ Rate limit in code             ├─ API Gateway                  ├─ GraphQL API
├─ PostgreSQL only                ├─ PostgreSQL + Cosmos DB       ├─ Multi-cloud?
├─ Manual deployment              ├─ Terraform IaC                ├─ GitOps (Flux)
└─ ~$500/month                    └─ ~$1,300/month               └─ ~$3,000+/month
```

---

**Document Status:** Architecture Plan v4.0→v4.1  
**Created:** 2026-06-02  
**Owner:** Cloud Architecture Team  
**Next Review:** 2026-08-02 (for v4.1 readiness)

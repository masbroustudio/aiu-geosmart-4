# 07 — Azure Deployment & DevOps

**Version:** 4.0  
**Last Updated:** 2026-06-02  
**Status:** Production Documentation

## Purpose

This document provides complete instructions for deploying GeoUMKM Smart to Microsoft Azure, including infrastructure setup, CI/CD pipeline configuration, monitoring, and scaling strategies. It's intended for DevOps engineers and cloud architects.

---

## Executive Summary

GeoUMKM Smart is deployed on Azure with:
- **Compute**: Azure Functions (serverless API)
- **Frontend**: Azure Static Web Apps (React dashboard)
- **Database**: Azure Database for PostgreSQL
- **Cache**: Azure Cache for Redis
- **Storage**: Azure Blob Storage (models, reports)
- **CI/CD**: GitHub Actions
- **Monitoring**: Application Insights + Azure Monitor

**Estimated Monthly Cost**: $800-1500 (depending on usage)

---

## Azure Infrastructure Architecture

```mermaid
graph TB
    subgraph "Networking"
        VNET["Virtual Network"]
        NSG["Network Security Groups"]
    end

    subgraph "Compute"
        FUNC["Azure Functions\n(API - Consumption Plan)"]
        SAPP["Static Web Apps\n(React Frontend)"]
    end

    subgraph "Data & Storage"
        PG["Azure Database for PostgreSQL\n(B-series, 2-4 vCore)"]
        REDIS["Azure Cache for Redis\n(Basic/Standard Tier)"]
        BLOB["Blob Storage\n(Hot tier)"]
    end

    subgraph "Integration & Messaging"
        SB["Service Bus\n(Batch jobs)"]
        ADF["Data Factory\n(Pipeline orchestration)"]
    end

    subgraph "Monitoring & Security"
        AI["Application Insights"]
        KV["Key Vault\n(Secrets)"]
        MON["Azure Monitor"]
    end

    subgraph "CI/CD"
        GH["GitHub"]
        ACR["Container Registry\n(Docker images)"]
    end

    VNET --> NSG
    NSG --> FUNC
    NSG --> PG
    NSG --> REDIS

    FUNC --> PG
    FUNC --> REDIS
    FUNC --> BLOB
    FUNC --> KV
    FUNC --> AI

    SAPP --> FUNC
    SAPP --> AI

    GH -->|Trigger| ADF
    GH -->|Trigger| FUNC
    GH -->|Build & Push| ACR
    ACR -->|Pull| FUNC

    ADF -->|Execute| FUNC
    SB -->|Queue Jobs| FUNC

    PG --> MON
    FUNC --> MON
    REDIS --> MON
```

---

## Prerequisites

### Azure Subscription Requirements
- Active Azure subscription with admin access
- Service Principal for CI/CD
- Quota increase requests (if needed):
  - App Service Plan: 10+ instances
  - Database: 4-8 vCore limit
  - Storage: 100GB+ blob quota

### Local Development Requirements
```bash
# Install Azure CLI
az --version  # Should be 2.50+

# Install other tools
pip install azure-cli azure-functions-core-tools
npm install -g @azure/static-web-apps-cli

# Login to Azure
az login
```

---

## Deployment Topology

```
Production Deployment:

├── Resource Group: rg-geosmart-prod
│   ├── Functions App: fa-geosmart-api
│   │   ├── Function: credit-score
│   │   ├── Function: location-score
│   │   ├── Function: clusters
│   │   ├── Function: recommendations
│   │   └── Function: whatif
│   ├── App Service Plan: asp-geosmart-prod (Premium P1v2)
│   ├── Static Web App: swa-geosmart-dashboard
│   ├── PostgreSQL Server: pg-geosmart-prod
│   │   └── Database: geosmart_db
│   ├── Redis Cache: redis-geosmart-prod
│   ├── Storage Account: stgeosmart
│   │   ├── Container: models
│   │   ├── Container: reports
│   │   └── Container: backups
│   ├── Key Vault: kv-geosmart-prod
│   ├── Application Insights: ai-geosmart
│   └── Service Bus: sb-geosmart

└── Resource Group: rg-geosmart-staging
    └── (Mirror of production for testing)
```

---

## Step 1: Create Resource Group

```bash
# Define variables
RESOURCE_GROUP="rg-geosmart-prod"
LOCATION="Southeast Asia"  # For Indonesia/ASEAN
SUBSCRIPTION="production"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location "$LOCATION" \
  --subscription $SUBSCRIPTION

# Verify
az group show --name $RESOURCE_GROUP
```

---

## Step 2: Create PostgreSQL Database

```bash
# Variables
DB_SERVER="pg-geosmart-prod"
DB_NAME="geosmart_db"
DB_ADMIN_USER="pgadmin"
DB_SKU="B_Gen5_2"  # 2-core B-series (burstable)

# Create PostgreSQL server
az postgres server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER \
  --location "$LOCATION" \
  --sku-name $DB_SKU \
  --storage-size 51200 \
  --backup-retention 30 \
  --admin-user $DB_ADMIN_USER \
  --admin-password <SECURE_PASSWORD> \
  --version 13

# Create database
az postgres db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER \
  --name $DB_NAME \
  --charset UTF8

# Configure firewall to allow Azure services
az postgres server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Get connection string
CONNECTION_STRING=$(az postgres server show-connection-string \
  --server-name $DB_SERVER \
  --admin-user $DB_ADMIN_USER \
  --database $DB_NAME)

echo $CONNECTION_STRING
```

### Initialize Database Schema

```bash
# Connect and run schema
psql -h pg-geosmart-prod.postgres.database.azure.com \
     -U pgadmin@pg-geosmart-prod \
     -d geosmart_db \
     -f schema/init_schema.sql

# Create indexes
psql -h pg-geosmart-prod.postgres.database.azure.com \
     -U pgadmin@pg-geosmart-prod \
     -d geosmart_db \
     -f schema/create_indexes.sql
```

---

## Step 3: Create Redis Cache

```bash
# Variables
REDIS_NAME="redis-geosmart-prod"
REDIS_SKU="Standard"  # Standard for production
REDIS_CAPACITY="1"    # 1GB

# Create Redis cache
az redis create \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --location "$LOCATION" \
  --sku $REDIS_SKU \
  --vm-size c1 \
  --enable-non-ssl-port false \
  --minimum-tls-version 1.2

# Get connection details
REDIS_ENDPOINT=$(az redis show \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --query hostName -o tsv)

REDIS_KEY=$(az redis list-keys \
  --resource-group $RESOURCE_GROUP \
  --name $REDIS_NAME \
  --query primaryKey -o tsv)

echo "Redis Endpoint: $REDIS_ENDPOINT"
```

---

## Step 4: Create Blob Storage

```bash
# Variables
STORAGE_ACCOUNT="stgeosmart"
STORAGE_SKU="Standard_GRS"  # Geo-redundant

# Create storage account
az storage account create \
  --resource-group $RESOURCE_GROUP \
  --name $STORAGE_ACCOUNT \
  --location "$LOCATION" \
  --sku $STORAGE_SKU \
  --kind StorageV2 \
  --https-only true

# Create containers
for container in models reports backups logs; do
  az storage container create \
    --account-name $STORAGE_ACCOUNT \
    --name $container \
    --auth-mode login
done

# Set storage account key to environment variable
STORAGE_KEY=$(az storage account keys list \
  --account-name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query [0].value -o tsv)

echo "Storage Key: $STORAGE_KEY"
```

---

## Step 5: Create Key Vault

```bash
# Variables
KEY_VAULT="kv-geosmart-prod"

# Create Key Vault
az keyvault create \
  --resource-group $RESOURCE_GROUP \
  --name $KEY_VAULT \
  --location "$LOCATION" \
  --enable-soft-delete true \
  --soft-delete-retention-days 90

# Store secrets
az keyvault secret set \
  --vault-name $KEY_VAULT \
  --name "PgConnectionString" \
  --value "$CONNECTION_STRING"

az keyvault secret set \
  --vault-name $KEY_VAULT \
  --name "RedisConnectionString" \
  --value "redis-geosmart-prod.redis.cache.windows.net:6379,password=$REDIS_KEY,ssl=True"

az keyvault secret set \
  --vault-name $KEY_VAULT \
  --name "StorageAccountKey" \
  --value "$STORAGE_KEY"

az keyvault secret set \
  --vault-name $KEY_VAULT \
  --name "ApiKeyMasterSecret" \
  --value "sk_live_$(openssl rand -hex 32)"
```

---

## Step 6: Create Azure Functions

```bash
# Variables
FUNC_APP="fa-geosmart-api"
PLAN_NAME="asp-geosmart-prod"

# Create App Service Plan (Premium for production)
az appservice plan create \
  --resource-group $RESOURCE_GROUP \
  --name $PLAN_NAME \
  --location "$LOCATION" \
  --sku P1v2 \
  --is-linux

# Create Functions App
az functionapp create \
  --resource-group $RESOURCE_GROUP \
  --consumption-plan-location "$LOCATION" \
  --runtime python \
  --runtime-version 3.10 \
  --functions-version 4 \
  --name $FUNC_APP \
  --storage-account $STORAGE_ACCOUNT

# Grant Key Vault access
FUNC_IDENTITY=$(az functionapp identity show \
  --resource-group $RESOURCE_GROUP \
  --name $FUNC_APP \
  --query principalId -o tsv)

az keyvault set-policy \
  --name $KEY_VAULT \
  --object-id $FUNC_IDENTITY \
  --secret-permissions get list
```

### Deploy Functions Code

```bash
cd api/

# Configure local.settings.json
cat > local.settings.json << 'EOF'
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "PgConnectionString": "@Microsoft.KeyVault(SecretUri=...)",
    "RedisConnectionString": "@Microsoft.KeyVault(SecretUri=...)",
    "StorageAccountKey": "@Microsoft.KeyVault(SecretUri=...)"
  }
}
EOF

# Deploy to Azure
func azure functionapp publish $FUNC_APP --build remote
```

---

## Step 7: Create Static Web App

```bash
# Variables
STATIC_APP="swa-geosmart-dashboard"
GITHUB_REPO="owner/aiu-geosmart"
GITHUB_TOKEN="ghp_xxxx"

# Create Static Web App
az staticwebapp create \
  --resource-group $RESOURCE_GROUP \
  --name $STATIC_APP \
  --source https://github.com/$GITHUB_REPO \
  --location "$LOCATION" \
  --token $GITHUB_TOKEN

# Configure routing
cat > staticwebapp.config.json << 'EOF'
{
  "routes": [
    {
      "route": "/api/*",
      "methods": ["GET", "POST", "PUT", "DELETE"],
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "enabled": true,
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/...",
          "clientIdSettingName": "AZURE_CLIENT_ID",
          "clientSecretSettingName": "AZURE_CLIENT_SECRET"
        }
      }
    }
  }
}
EOF
```

---

## Step 8: Configure Application Insights

```bash
# Variables
APP_INSIGHTS="ai-geosmart"

# Create Application Insights
az monitor app-insights component create \
  --resource-group $RESOURCE_GROUP \
  --app $APP_INSIGHTS \
  --location "$LOCATION" \
  --application-type web

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --resource-group $RESOURCE_GROUP \
  --app $APP_INSIGHTS \
  --query instrumentationKey -o tsv)

# Add to Function App
az functionapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $FUNC_APP \
  --settings \
    "APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY" \
    "ApplicationInsightsAgent_EXTENSION_VERSION=~3"
```

### Configure Alerts

```bash
# Alert 1: High error rate
az monitor metrics alert create \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/{SUBSCRIPTION}/resourcegroups/$RESOURCE_GROUP/providers/microsoft.insights/components/$APP_INSIGHTS" \
  --name "HighErrorRate" \
  --condition "avg microsoft.insights/components/failedRequestsPercentage > 5" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action "email:ops-team@geosmart.com"

# Alert 2: Slow responses
az monitor metrics alert create \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/{SUBSCRIPTION}/resourcegroups/$RESOURCE_GROUP/providers/microsoft.insights/components/$APP_INSIGHTS" \
  --name "SlowResponses" \
  --condition "avg microsoft.insights/components/requestDurationMs > 2000" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action "email:ops-team@geosmart.com"
```

---

## Step 9: Configure CI/CD with GitHub Actions

### Create GitHub Secrets

```bash
# Store Azure credentials
az ad sp create-for-rbac --name "geosmart-cicd" \
  --role contributor \
  --scopes /subscriptions/{SUBSCRIPTION}/resourceGroups/$RESOURCE_GROUP

# Result: Add to GitHub Secrets
# AZURE_CLIENT_ID
# AZURE_CLIENT_SECRET
# AZURE_SUBSCRIPTION_ID
# AZURE_TENANT_ID
```

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy GeoUMKM Smart

on:
  push:
    branches: [main]
    paths:
      - 'api/**'
      - 'frontend/**'
      - '.github/workflows/deploy.yml'

env:
  RESOURCE_GROUP: rg-geosmart-prod
  FUNC_APP: fa-geosmart-api
  STATIC_APP: swa-geosmart-dashboard

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          cd api/
          pip install -r requirements.txt
      
      - name: Run tests
        run: |
          cd api/
          pytest tests/ -v --cov

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Deploy Azure Functions
        uses: Azure/functions-action@v1
        with:
          app-name: ${{ env.FUNC_APP }}
          package: './api'
          runtime: 'python'
          runtime-version: '3.10'
      
      - name: Run smoke tests
        run: |
          API_URL=$(az functionapp show \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --name ${{ env.FUNC_APP }} \
            --query defaultHostName -o tsv)
          
          curl -X POST https://$API_URL/api/v1/credit-score \
            -H "X-API-Key: test-key" \
            -H "Content-Type: application/json" \
            -d '{"umkm_id": "test-id"}' \
            --fail

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build React App
        run: |
          cd frontend/
          npm install
          npm run build
      
      - name: Deploy to Static Web App
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: 'upload'
          app_location: './frontend/build'
          api_location: ''
          output_location: '.'
```

---

## Step 10: Database Migrations

```bash
# Create migration tool setup
cat > migrations/alembic.ini << 'EOF'
[alembic]
sqlalchemy.url = postgresql://pgadmin:password@pg-geosmart-prod.postgres.database.azure.com:5432/geosmart_db
EOF

# Run migrations
alembic upgrade head

# Verify schema
psql -h pg-geosmart-prod.postgres.database.azure.com \
     -U pgadmin@pg-geosmart-prod \
     -d geosmart_db \
     -c "\dt"
```

---

## Scaling Configuration

### Horizontal Scaling

```bash
# Auto-scale Azure Functions
az monitor autoscale create \
  --resource-group $RESOURCE_GROUP \
  --resource-name-type Microsoft.Web/serverfarms \
  --resource-name $PLAN_NAME \
  --min-count 2 \
  --max-count 100 \
  --count 5

# Add scale-out rule (CPU > 70%)
az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name $PLAN_NAME-scale \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1

# Add scale-in rule (CPU < 30%)
az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name $PLAN_NAME-scale \
  --condition "Percentage CPU < 30 avg 5m" \
  --scale in 1
```

### Database Scaling

```bash
# Scale up database vCores (monthly maintenance window)
az postgres server update \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER \
  --sku-name B_Gen5_4  # Upgrade from 2 to 4 cores
```

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check service health
az monitor resource health show \
  --resource-group $RESOURCE_GROUP

# Check database connections
az postgres server logs-download \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER \
  --max-days 1
```

### Monthly Maintenance

```bash
# Database backup
az postgres server backup create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER \
  --backup-name backup-$(date +%Y%m%d)

# Clear old cache entries
redis-cli -h redis-geosmart-prod.redis.cache.windows.net \
          -a $REDIS_KEY \
          EVAL "return redis.call('DEL',unpack(redis.call('KEYS','CACHE:*')))" 0

# Update dependencies
pip list --outdated
```

---

## Disaster Recovery

### Backup Strategy

```yaml
Backup Schedule:
├── Automated Daily: PostgreSQL point-in-time recovery
├── Weekly: Full blob storage backup
├── Monthly: Export critical data
└── Event-Driven: Before major changes

Recovery Time Objective (RTO): 4 hours
Recovery Point Objective (RPO): 1 hour
```

### Failover Procedure

```bash
# 1. Restore from backup
az postgres server restore \
  --resource-group $RESOURCE_GROUP \
  --name pg-geosmart-restore \
  --source-server $DB_SERVER \
  --restore-point-in-time "2024-01-15 14:00:00"

# 2. Update connection strings
az keyvault secret set \
  --vault-name $KEY_VAULT \
  --name "PgConnectionString" \
  --value "New connection string"

# 3. Restart functions
az functionapp restart \
  --resource-group $RESOURCE_GROUP \
  --name $FUNC_APP

# 4. Verify health
curl https://fa-geosmart-api.azurewebsites.net/api/health
```

---

## Cost Optimization

### Current Configuration Costs

| Resource | SKU | Estimated Cost |
|----------|-----|---|
| App Service Plan | P1v2 (1 core) | $74/month |
| PostgreSQL | B Gen5 2-core | $130/month |
| Redis | Standard 1GB | $122/month |
| Blob Storage | 100GB | $80/month |
| Static Web App | Free tier | $0 |
| Application Insights | Pay-as-you-go | $50-200/month |
| **Total** | | **$456-656/month** |

### Cost Reduction Opportunities

```bash
# 1. Use Consumption Plan for Functions (if < 1M invocations/month)
# Could reduce: $74 → $0.20/million invocations

# 2. Use Basic PostgreSQL tier during off-hours
# Could reduce: $130 → $60/month

# 3. Archive old reports to cool storage tier
# Could reduce: $80 → $20/month

# 4. Implement caching (Redis) to reduce DB queries
# Could reduce: Database load by 40%
```

---

## Related Documentation

- **[Architecture](02-geosmart-architecture.md)**: Deployment topology
- **[Setup Local](08-setup-local.md)**: Local development setup
- **[Operations](09-faq-troubleshooting.md)**: Troubleshooting common issues

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial comprehensive Azure deployment guide |

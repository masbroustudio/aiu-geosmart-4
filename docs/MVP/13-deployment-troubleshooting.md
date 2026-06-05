# 13 — Deployment Guide: Security, Operations & Troubleshooting

**Version:** 4.0  
**Last Updated:** 2026-06-02  
**Status:** Production Operations Guide

---

## Table of Contents
1. [Entra ID B2C Setup (Authentication)](#entra-b2c)
2. [Managed Secrets & Key Vault](#secrets-management)
3. [Azure Monitor & Alerting](#monitoring)
4. [API Rate Limiting](#rate-limiting)
5. [Common Issues & Solutions](#troubleshooting)
6. [Data Compliance (GDPR, Indonesia)](#compliance)
7. [Disaster Recovery Checklist](#disaster-recovery)

---

## Entra ID B2C Setup (Authentication)

### Step 1: Create Azure AD B2C Tenant

```bash
az ad b2c create \
  --name geoumkm-smart \
  --resource-group rg-geoumkm \
  --data-residency EU  # Or AS for Asia-Pacific
```

### Step 2: Register Application

```bash
# Frontend app registration
az ad app create \
  --display-name "GeoUMKM Smart Web" \
  --public-client-redirect-uris "http://localhost:3000/auth/callback" \
  "https://app.geoumkm-smart.id/auth/callback"

# Backend app registration
az ad app create \
  --display-name "GeoUMKM Smart API" \
  --available-to-other-tenants false \
  --reply-urls "https://fa-geoumkm-api.azurewebsites.net/auth/callback"
```

### Step 3: Configure Sign-Up/Sign-In Policy

```bash
# Create user flow
az ad b2c user-flow create \
  --tenant-name geoumkm-smart \
  --user-flow-name "SignUpSignIn" \
  --user-flow-type "signUpOrSignIn" \
  --language-name "en-US"

# Add user attributes
az ad b2c user-attribute create \
  --tenant-name geoumkm-smart \
  --name "Organization" \
  --data-type "String" \
  --user-input-type "TextBox"

az ad b2c user-attribute create \
  --tenant-name geoumkm-smart \
  --name "UserRole" \
  --data-type "String" \
  --user-input-type "Dropdown" \
  --enum-values "bank,government,investor"
```

### Step 4: Test B2C Setup

```bash
# Get authorization endpoint
curl "https://geoumkm-smart.b2clogin.com/geoumkm-smart.onmicrosoft.com/oauth2/v2.0/authorize?client_id=<CLIENT_ID>&response_type=code&scope=openid%20profile&redirect_uri=https://localhost:3000/auth/callback"
```

---

## Managed Secrets & Key Vault

### Setup Managed Identity

```bash
# Enable Managed Identity on Function App
az functionapp identity assign \
  --name fa-geoumkm-api \
  --resource-group rg-geoumkm \
  --identities [system]

# Grant access to Key Vault
az keyvault set-policy \
  --name kv-geoumkm \
  --object-id $(az functionapp identity show --name fa-geoumkm-api --resource-group rg-geoumkm --query principalId -o tsv) \
  --secret-permissions get list
```

### Retrieve Secrets in Application

```python
# Instead of: os.getenv("DATABASE_PASSWORD")

from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

credential = DefaultAzureCredential()
client = SecretClient(
    vault_url="https://kv-geoumkm.vault.azure.net/",
    credential=credential
)

# Automatic token refresh, no password in environment
db_password = client.get_secret("postgres-password").value
```

### GitHub Actions Secrets Management

```yaml
# .github/workflows/deploy.yml

name: Deploy with Secrets

on:
  push:
    branches: [main]

env:
  AZURE_FUNCTIONAPP_NAME: fa-geoumkm-api

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Login with service principal
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      # Fetch secrets from Key Vault (not hardcoded!)
      - name: Get secrets from Key Vault
        id: kv
        run: |
          DB_PASS=$(az keyvault secret show --vault-name kv-geoumkm --name postgres-password --query value -o tsv)
          echo "::add-mask::$DB_PASS"
          echo "DB_PASSWORD=$DB_PASS" >> $GITHUB_OUTPUT
      
      # Deploy with secrets
      - name: Deploy to Azure Functions
        uses: azure/functions-action@v1
        with:
          app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
          package: '.'
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

---

## Azure Monitor & Alerting

### Configure Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app geoumkm-appinsights \
  --location southeastasia \
  --resource-group rg-geoumkm \
  --application-type web

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app geoumkm-appinsights \
  --resource-group rg-geoumkm \
  --query instrumentationKey -o tsv)

# Set environment variable
az functionapp config appsettings set \
  --name fa-geoumkm-api \
  --resource-group rg-geoumkm \
  --settings "APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY"
```

### Setup Custom Alerts

```bash
# Alert: API response time > 2 seconds
az monitor metrics alert create \
  --name "HighResponseTime" \
  --resource-group rg-geoumkm \
  --scopes /subscriptions/{subscriptionId}/resourceGroups/rg-geoumkm/providers/Microsoft.Web/sites/fa-geoumkm-api \
  --condition "avg ResponseTime > 2000" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action "/subscriptions/{subscriptionId}/resourceGroups/rg-geoumkm/providers/microsoft.insights/actionGroups/EmailActionGroup"

# Alert: Error rate > 5%
az monitor metrics alert create \
  --name "HighErrorRate" \
  --resource-group rg-geoumkm \
  --scopes /subscriptions/{subscriptionId}/resourceGroups/rg-geoumkm/providers/Microsoft.Web/sites/fa-geoumkm-api \
  --condition "total FailedServerRequests/PercentageSuccessfulRequests < 95" \
  --window-size 5m
```

### Log Analytics Queries

```kusto
// Query 1: Failed authentication attempts
traces
| where message contains "auth_failed"
| summarize Count=count() by user_id, timestamp
| order by Count desc
| limit 10

// Query 2: Rate limit hits
traces
| where message contains "rate_limit_exceeded"
| summarize Count=count() by user_role, timestamp
| order by timestamp desc

// Query 3: Slowest endpoints
requests
| where duration > 1000  // > 1 second
| summarize AvgDuration=avg(duration), Count=count() by name
| order by AvgDuration desc
```

---

## API Rate Limiting

### Per-Role Configuration

```python
# File: backend/middleware/rate_limiting.py

from slowapi import Limiter
from slowapi.util import get_remote_address
from app.auth import get_user_role

limiter = Limiter(key_func=get_remote_address)

# Custom key function based on role + API key
def get_rate_limit_key(request):
    # Priority: API Key > IP Address
    api_key = request.headers.get("X-API-Key")
    if api_key:
        return api_key  # Rate limit per API key
    return get_remote_address(request)  # Fallback to IP

RATE_LIMITS = {
    "bank": "100/minute",
    "government": "50/minute",
    "investor": "50/minute",
    "admin": "unlimited",
    "health_check": "1000/minute"
}

@app.post("/api/v1/credit-score")
@limiter.limit(lambda req: RATE_LIMITS[get_user_role(req)])
async def credit_score(request):
    return {"score": 0.75}
```

### Graceful Degradation

```python
# When rate limit hit, return 429 with helpful info

from fastapi import HTTPException

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": "100 requests per minute limit reached",
            "retry_after_seconds": 60,
            "limit_reset_at": (datetime.now() + timedelta(minutes=1)).isoformat()
        },
        headers={"Retry-After": "60"}
    )
```

---

## Common Issues & Solutions

### Issue 1: "Connection refused" to PostgreSQL

```
Error: psycopg2.OperationalError: could not connect to server

Solutions:
1. Check database is running: az postgres server show
2. Check firewall rules allow Function App IP
3. Verify connection string: postgresql://user:pass@host/db
4. Check SSL requirement (Azure forces SSL for production)
```

**Fix**:
```python
# Add sslmode to connection string
import psycopg2
conn = psycopg2.connect(
    host="prod-postgres.postgres.database.azure.com",
    database="geoumkm_prod",
    user="sqladmin",
    password=password,
    sslmode="require"  # Force SSL
)
```

### Issue 2: "Timeout calling Azure OpenAI"

```
Error: TimeoutError: Call to OpenAI API timed out

Solutions:
1. Check OpenAI quota (not exceeded)
2. Increase timeout: client.chat.completions.create(..., timeout=60)
3. Implement retry logic with exponential backoff
4. Check network connectivity from Function App to OpenAI endpoint
```

**Fix**:
```python
from tenacity import retry, wait_exponential, stop_after_attempt

@retry(
    wait=wait_exponential(multiplier=1, min=2, max=10),
    stop=stop_after_attempt(3)
)
async def call_openai_with_retry(prompt):
    return await client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[{"role": "user", "content": prompt}],
        timeout=60
    )
```

### Issue 3: "Azure AI Search index not found"

```
Error: ResourceNotFoundError: The search index was not found

Solutions:
1. Verify index exists: az search index list --resource-group rg-geoumkm
2. Check index name in environment variable
3. Re-run indexing script (scripts/index_rag_knowledge_base.py)
```

**Validation**:
```bash
# List all indexes
az search query-key list --resource-group rg-geoumkm --search-service-name search-geoumkm

# Check index documents
curl -X GET "https://search-geoumkm.search.windows.net/indexes/geoumkm_knowledge_base/docs?api-version=2024-05-01-preview" \
  -H "api-key: $(az search query-key list --resource-group rg-geoumkm --search-service-name search-geoumkm --query [0].key -o tsv)"
```

---

## Data Compliance (GDPR, Indonesia)

### GDPR Compliance

```python
# Right to be forgotten (deletion)

@app.delete("/api/v1/users/{user_id}")
async def delete_user_data(user_id: str):
    """
    Delete all personal data for GDPR compliance
    """
    try:
        # Delete from PostgreSQL
        query = "DELETE FROM users WHERE id = %s"
        conn.execute(query, (user_id,))
        conn.commit()
        
        # Delete from Azure Search (RAG history)
        search_client.delete_documents("user_id eq '{}'".format(user_id))
        
        # Delete from Cosmos DB (chat history, if using)
        db.chat_history.delete_many({"user_id": user_id})
        
        # Log deletion for compliance audit
        log_compliance_event("user_deletion", user_id, datetime.now())
        
        return {"status": "deleted", "user_id": user_id}
    
    except Exception as e:
        logger.error(f"GDPR deletion failed: {e}")
        return {"status": "error", "message": str(e)}, 500
```

### Indonesia Data Residency

```bash
# Ensure all data stays in Indonesia/Southeast Asia

# PostgreSQL in Southeast Asia
az postgres server create \
  --location "Southeast Asia" \
  --geo-redundant-backup Disabled  # Prevent replication outside region

# Redis in Southeast Asia
az redis create \
  --location "Southeast Asia" \
  --zones 1  # Single zone (within SE Asia)

# Storage account with geo-redundancy settings
az storage account create \
  --location "Southeast Asia" \
  --sku Standard_LRS  # Locally-redundant (not geo-redundant)
  # This keeps data within single region
```

### Data Encryption

```python
# Encryption at rest (automatic with Azure Storage)
# Encryption in transit (TLS 1.2+ enforced)

import ssl

# Verify TLS on all external calls
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = True
ssl_context.verify_mode = ssl.CERT_REQUIRED

# PostgreSQL connection with enforced TLS
import psycopg2
psycopg2.connect(
    sslmode="require",  # Force TLS
    sslcert="/path/to/cert.crt"
)
```

---

## Disaster Recovery Checklist

### Daily (Automated)

- [ ] Database backups (automatic, every 24 hours)
- [ ] Application logs aggregated to Azure Monitor
- [ ] API availability checks (health endpoint every 5 min)

### Weekly

- [ ] Review error logs and alert triggers
- [ ] Verify backup integrity (restore test)
- [ ] Check certificate expiration (TLS, API keys)

### Monthly

- [ ] Full disaster recovery drill (restore from backup)
- [ ] Review security logs for anomalies
- [ ] Capacity planning review (usage trends)

### Disaster Recovery Runbook

```
IF PRIMARY REGION DOWN:

1. (5 min) Detect: Health check fails 3x
   → Automatic failover to read replica (if multi-region configured)
   → OR manual failover: az postgres server failover

2. (10 min) Communication: Notify users via status page
   → https://status.geoumkm-smart.id

3. (15 min) Mitigation: Restore from latest backup
   → az postgres server restore --backup --restore-point-in-time (recovery_time)

4. (30 min) Validation: Run smoke tests
   → Test /api/v1/health endpoint
   → Test critical paths (credit-score, chat)

5. (1 hour) Resume operations: Monitor for issues

6. (next day) Post-mortem: Document root cause, update procedures
```

---

## Summary: Security & Operations Readiness

| Aspect | v4.0 Status | v4.1 (Future) |
|--------|------------|--------------|
| Authentication | B2C configured | MFA enforced |
| Secrets | Key Vault + Managed ID | Zero secrets in code |
| Monitoring | Application Insights | Custom dashboards |
| Rate Limiting | Per-role in code | API Gateway edge |
| DR | Single region | Multi-region failover |
| Compliance | GDPR, Indonesia aware | Fully automated compliance |
| Encryption | TLS + at-rest | Enhanced with HSM |

---

**Document Status:** Operations v4.0  
**Created:** 2026-06-02  
**Owner:** DevOps & Security Team

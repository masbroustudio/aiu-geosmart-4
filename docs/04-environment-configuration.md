# GeoUMKM Smart - Environment & URL Configuration

**Version:** 4.0  
**Last Updated:** 2026-06-02  
**Status:** Production Configuration  

---

## Environment Strategy

GeoUMKM Smart uses a 4-tier environment strategy:

### 1. Local Development (Developer Machines)
```
API Base: http://localhost:8000/api
Frontend: http://localhost:3000
Database: localhost:5432 (PostgreSQL)
Redis Cache: localhost:6379
API Docs: http://localhost:8000/docs
```

**Use Cases:**
- Feature development
- Debugging
- Local testing

**Setup:** See 08-geosmart-setup-local.md

---

### 2. Development Environment (Shared Azure Dev Subscription)
```
API Base: https://dev-api.azurewebsites.net/api
Frontend: https://dev-app.azurestaticapps.azure.com
Database: dev-postgres-geoumkm.database.azure.com
Redis Cache: dev-redis-geoumkm.redis.cache.windows.net
```

**Use Cases:**
- Pull request validation (automated via CI/CD)
- Integration testing
- Feature branch testing

**Deployment:** GitHub Actions trigger on PR creation

---

### 3. Staging Environment (Pre-Production Azure RG)
```
API Base: https://staging-api.azurewebsites.net/api
Frontend: https://staging-app.azurestaticapps.azure.com
Database: staging-postgres-geoumkm.database.azure.com
Redis Cache: staging-redis-geoumkm.redis.cache.windows.net
```

**Use Cases:**
- Release candidate validation
- Performance testing (real-world scale)
- User acceptance testing (UAT)
- Security scanning

**Deployment:** GitHub Actions trigger on merge to `staging` branch

---

### 4. Production Environment (Primary Azure RG)
```
API Base: https://fa-geoumkm-api.azurewebsites.net/api
Frontend: https://app.geoumkm-smart.id (custom domain)
Database: prod-postgres-geoumkm.database.azure.com
Redis Cache: prod-redis-geoumkm.redis.cache.windows.net
CDN: https://cdn.geoumkm-smart.id (optional, future)
```

**Use Cases:**
- Live user traffic
- Real UMKM data
- Mission-critical API access

**Deployment:** GitHub Actions trigger on release tag (v4.0.1, etc.)

**Note**: Azure Functions default URL (`fa-geoumkm-api.azurewebsites.net`) used for v4.0  
**Upgrade Path**: Custom domain + API Gateway in v4.1 (Container Apps migration)

---

## Environment Variables

### .env.example (Template for all environments)

```bash
# Application
APP_ENV=production              # Options: local, dev, staging, production
APP_VERSION=4.0
DEBUG=false

# API Configuration
API_BASE_URL=https://fa-geoumkm-api.azurewebsites.net/api  # Overridden per environment
API_PORT=8000
API_WORKERS=4

# Frontend Configuration
REACT_APP_API_URL=https://fa-geoumkm-api.azurewebsites.net/api  # Overridden per environment
REACT_APP_VERSION=4.0

# Database (PostgreSQL)
POSTGRES_HOST=prod-postgres-geoumkm.database.azure.com
POSTGRES_PORT=5432
POSTGRES_DB=geoumkm_prod
POSTGRES_USER=sqladmin
POSTGRES_PASSWORD=<CHANGE_ME>  # Store in Key Vault, never hardcode

# Redis Cache
REDIS_HOST=prod-redis-geoumkm.redis.cache.windows.net
REDIS_PORT=6379
REDIS_PASSWORD=<CHANGE_ME>  # Store in Key Vault
REDIS_SSL=true

# Azure OpenAI (for Chat feature)
OPENAI_API_KEY=<CHANGE_ME>  # Store in Key Vault
OPENAI_API_VERSION=2024-02-15
OPENAI_DEPLOYMENT_NAME=gpt-4-turbo
OPENAI_ENDPOINT=https://oai-geoumkm.openai.azure.com/

# Azure AI Search (for RAG knowledge base)
AI_SEARCH_ENDPOINT=https://search-geoumkm.search.windows.net
AI_SEARCH_API_KEY=<CHANGE_ME>  # Store in Key Vault
AI_SEARCH_INDEX_NAME=geoumkm_knowledge_base

# Azure Key Vault
KEY_VAULT_URL=https://kv-geoumkm.vault.azure.net/

# Authentication
ENTRA_ID_TENANT_ID=<CHANGE_ME>  # Azure AD tenant
ENTRA_ID_CLIENT_ID=<CHANGE_ME>  # App registration client ID
ENTRA_ID_CLIENT_SECRET=<CHANGE_ME>  # Store in Key Vault
ENTRA_ID_ISSUER_URL=https://login.microsoftonline.com/<TENANT_ID>/v2.0

# B2C Authentication (optional)
B2C_TENANT_NAME=geousmkm
B2C_CLIENT_ID=<CHANGE_ME>
B2C_CLIENT_SECRET=<CHANGE_ME>  # Store in Key Vault
B2C_SIGN_UP_SIGN_IN_POLICY=B2C_1_susi

# Logging & Monitoring
APPINSIGHTS_INSTRUMENTATIONKEY=<CHANGE_ME>  # Application Insights
LOG_LEVEL=INFO  # Options: DEBUG, INFO, WARNING, ERROR
SENTRY_DSN=<OPTIONAL>  # Error tracking

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60

# CORS
CORS_ORIGINS=https://app.geoumkm-smart.id,https://staging-app.azurestaticapps.azure.com
```

---

## Per-Environment Configuration

### Local Development (.env.local)
```bash
APP_ENV=local
DEBUG=true
API_BASE_URL=http://localhost:8000/api
REACT_APP_API_URL=http://localhost:8000/api
POSTGRES_HOST=localhost
POSTGRES_PASSWORD=dev_password_123
REDIS_HOST=localhost
REDIS_PASSWORD=  # No password locally
REDIS_SSL=false
LOG_LEVEL=DEBUG
RATE_LIMIT_ENABLED=false  # Disable for faster dev
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Development (.env.dev)
```bash
APP_ENV=dev
DEBUG=false
API_BASE_URL=https://dev-api.azurewebsites.net/api
REACT_APP_API_URL=https://dev-api.azurewebsites.net/api
POSTGRES_HOST=dev-postgres-geoumkm.database.azure.com
REDIS_HOST=dev-redis-geoumkm.redis.cache.windows.net
REDIS_SSL=true
LOG_LEVEL=INFO
RATE_LIMIT_ENABLED=false  # Permissive for testing
CORS_ORIGINS=https://dev-app.azurestaticapps.azure.com
```

### Staging (.env.staging)
```bash
APP_ENV=staging
DEBUG=false
API_BASE_URL=https://staging-api.azurewebsites.net/api
REACT_APP_API_URL=https://staging-api.azurewebsites.net/api
POSTGRES_HOST=staging-postgres-geoumkm.database.azure.com
REDIS_HOST=staging-redis-geoumkm.redis.cache.windows.net
REDIS_SSL=true
LOG_LEVEL=INFO
RATE_LIMIT_ENABLED=true
CORS_ORIGINS=https://staging-app.azurestaticapps.azure.com
```

### Production (.env.prod)
```bash
APP_ENV=production
DEBUG=false
API_BASE_URL=https://fa-geoumkm-api.azurewebsites.net/api
REACT_APP_API_URL=https://fa-geoumkm-api.azurewebsites.net/api
POSTGRES_HOST=prod-postgres-geoumkm.database.azure.com
REDIS_HOST=prod-redis-geoumkm.redis.cache.windows.net
REDIS_SSL=true
LOG_LEVEL=WARNING  # Minimal logging in prod
RATE_LIMIT_ENABLED=true
CORS_ORIGINS=https://app.geoumkm-smart.id
```

---

## API Endpoints Reference (All Environments)

All endpoints follow the same path structure: `/api/v1/{resource}`

### Health Check
```
GET /api/v1/health
Response: { "status": "ok", "version": "4.0", "timestamp": "2026-06-02T10:00:00Z" }
```

### Credit Scoring
```
POST /api/v1/credit-score
Request: { "umkm_id": "U123", "features": {...} }
Response: { "credit_score": 0.75, "probability_of_default": 0.18, "risk_level": "medium" }
```

### Location Scoring
```
POST /api/v1/location-score
Request: { "latitude": -6.2, "longitude": 107.0 }
Response: { "location_score": 0.82, "opportunity_level": "high" }
```

### Clustering
```
POST /api/v1/clusters
Request: { "umkm_ids": ["U123", "U124"] }
Response: { "clusters": [{"id": "C1", "members": 5, "profile": {...}}] }
```

### Recommendations
```
POST /api/v1/recommendations
Request: { "umkm_id": "U123", "user_type": "bank" }
Response: { "recommendations": [{...}], "explanation": "..." }
```

### What-If Scenario
```
POST /api/v1/whatif
Request: { "umkm_id": "U123", "feature_changes": {"feature_1": 100} }
Response: { "original_score": 0.75, "simulated_score": 0.82, "impact": 0.07 }
```

### Chat (v4.0 New Feature)
```
POST /api/v1/chat
Request: { "query": "Why is this UMKM high risk?", "umkm_id": "U123" }
Response: { 
  "answer": "UMKM_123 has high credit risk because...",
  "confidence": 0.92,
  "sources": ["feature_importance", "cluster_profile"]
}

POST /api/v1/chat/stream
Request: { "query": "...", "umkm_id": "..." }
Response: Server-Sent Events stream with answer chunks
```

### Batch Scoring
```
POST /api/v1/batch/credit-scores
Request: { "umkm_ids": ["U123", "U124", ...], "webhook_url": "https://myapp.com/callback" }
Response: { "batch_id": "B123", "status": "processing", "eta_seconds": 300 }

Webhook callback after completion:
POST https://myapp.com/callback
{ "batch_id": "B123", "status": "completed", "results_url": "https://fa-geoumkm-api.../batch_abc123/results" }
```

### Models Info
```
GET /api/v1/models/info
Response: {
  "models": [
    {"name": "credit_risk_xgboost", "version": "4.0.1", "deployed": true},
    {"name": "location_scoring", "version": "4.0.0", "deployed": true},
    {"name": "clustering_kmeans", "version": "4.0.0", "deployed": true},
    {"name": "recommendations_cf", "version": "4.0.0", "deployed": true}
  ]
}
```

### Audit Log
```
GET /api/v1/audit-log?start_date=2026-06-01&end_date=2026-06-02&user_id=user_123
Response: {
  "entries": [
    {"timestamp": "...", "user_id": "...", "action": "credit_score_requested", "status": "success"}
  ],
  "total": 150,
  "page": 1,
  "page_size": 50
}
```

---

## Rate Limiting Per Role

| Role | Requests/Min | Requests/Hour | Limit Type |
|------|-------------|--------------|-----------|
| bank | 100 | 5,000 | Per API key |
| government | 50 | 2,500 | Per API key |
| investor | 50 | 2,500 | Per API key |
| admin | Unlimited | Unlimited | - |
| health_check | 1,000 | 60,000 | Global |

**Response Headers** (when rate limit applies):
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1686400060 (Unix timestamp)
Retry-After: 60 (seconds)
```

**429 Too Many Requests Response**:
```json
{
  "error": "rate_limit_exceeded",
  "message": "100 requests per minute limit reached",
  "retry_after_seconds": 60
}
```

---

## Environment Configuration Management

### Setting Environment Variables

#### Local (Development)
```bash
# Create .env.local in project root
cp .env.example .env.local
# Edit .env.local with local values
```

#### Azure (Dev/Staging/Prod)
```bash
# Use Azure Key Vault for secrets
az keyvault secret set --vault-name kv-geoumkm --name "POSTGRES-PASSWORD" --value "<password>"
az keyvault secret set --vault-name kv-geoumkm --name "OPENAI-API-KEY" --value "<key>"

# Function App retrieving from Key Vault at runtime:
# POSTGRES_PASSWORD = @Microsoft.KeyVault(SecretUri=https://kv-geoumkm.vault.azure.net/secrets/POSTGRES-PASSWORD/)
```

#### GitHub Actions (CI/CD)
```yaml
# Store in GitHub repository secrets (Settings > Secrets > Actions)
AZURE_CREDENTIALS     # Service principal JSON
AZURE_KEY_VAULT_URL   # Key Vault URL
AZURE_SUBSCRIPTION_ID # Subscription ID

# At runtime, workflow fetches environment-specific values
```

---

## Migration Path: v4.0 → v4.1 (Container Apps + Custom Domain)

**v4.0 (Current)**:
- Azure Functions default URL: `https://fa-geoumkm-api.azurewebsites.net/api`
- Single region
- Simple scale-up

**v4.1 (Planned Q3 2026)**:
- Custom domain: `https://api.geoumkm-smart.id/api` (via API Gateway)
- Container Apps (better scaling for >10k req/min)
- Managed Identity (no more hardcoded secrets)
- Multi-region ready (Traffic Manager)

**Migration Steps**:
1. Deploy Container Apps version alongside Functions (blue-green)
2. Switch API Gateway to route to Container Apps
3. Decommission Functions
4. Migrate database read replicas to second region

---

## Summary

| Tier | URL | Purpose | Deployment |
|------|-----|---------|-----------|
| Local | http://localhost:8000/api | Development | Manual (npm/python) |
| Dev | https://dev-api.azurewebsites.net/api | Testing | GitHub PR trigger |
| Staging | https://staging-api.azurewebsites.net/api | UAT + Perf Test | GitHub staging branch |
| Prod | https://fa-geoumkm-api.azurewebsites.net/api | Live users | GitHub release tag |

**Next**: See 05-geosmart-api-specification.md for full API documentation.

---

**Document Status:** Production v4.0  
**Created:** 2026-06-02  
**Owner:** DevOps & Backend Team

# GeoUMKM Smart V4.0 - Remediation Checklist

**Purpose:** Quick reference checklist for implementing fixes identified in the code-documentation audit.

**Status:** 📋 Ready for implementation  
**Total Tasks:** 21 fixes across 4 tiers  
**Estimated Time:** 3-4 weeks (400-500 hours)

---

## TIER 1 - CRITICAL SECURITY (Week 1)

### Must complete before external deployment

- [ ] **Create Auth Middleware** (Day 1-2, 8-10 hours)
  - [ ] File: `api/src/shared/auth-middleware.ts`
  - [ ] Validate `X-API-Key` header
  - [ ] Check `X-User-Role` (bank/government/investor/admin)
  - [ ] Lookup API key in database
  - [ ] Return 401 if invalid
  - [ ] Generate unique request ID
  - [ ] Test with sample API keys

- [ ] **Create Rate Limiting Middleware** (Day 2-3, 8-10 hours)
  - [ ] File: `api/src/shared/rate-limit-middleware.ts`
  - [ ] Define limits: bank=100/min, gov=50/min, investor=50/min, admin=unlimited
  - [ ] Track request count per API key
  - [ ] Return 429 if exceeded
  - [ ] Set `X-RateLimit-*` response headers
  - [ ] Store counters in database or memory cache
  - [ ] Add rate limit reset logic

- [ ] **Create Response Wrapper** (Day 3-4, 8-10 hours)
  - [ ] File: `api/src/shared/response-wrapper.ts`
  - [ ] Define error codes: INVALID_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, RATE_LIMITED, INTERNAL_ERROR, SERVICE_UNAVAILABLE
  - [ ] Build success response: `{ status, data, metadata }`
  - [ ] Build error response: `{ status, error: { code, message, details }, metadata }`
  - [ ] Add metadata: `request_id`, `timestamp`, `api_version`, `execution_time_ms`
  - [ ] Create TypeScript types for all response formats
  - [ ] Add unit tests for wrapper

- [ ] **Create Health Check Endpoint** (Day 4-5, 6-8 hours)
  - [ ] File: `api/src/functions/health.ts`
  - [ ] Check database connectivity
  - [ ] Check Azure OpenAI availability
  - [ ] Check blob storage access
  - [ ] Check AI Search connectivity
  - [ ] Return component-by-component status
  - [ ] Route: `GET /api/health`
  - [ ] Response includes timestamp and overall health

- [ ] **Apply Middleware to All Endpoints** (Day 5, 4-6 hours)
  - [ ] Update `chat.ts` to use auth + rate limit + response wrapper
  - [ ] Update `cluster.ts` to use middleware
  - [ ] Update `credit.ts` to use middleware
  - [ ] Update `kecamatan.ts` to use middleware
  - [ ] Update `overview.ts` to use middleware
  - [ ] Update `policy.ts` to use middleware
  - [ ] Update `recommend.ts` to use middleware
  - [ ] Update `score.ts` to use middleware
  - [ ] Update `whatif.ts` to use middleware
  - [ ] Verify all use auth level "function" (not "anonymous")

**Week 1 Total: 40-50 hours**

---

## TIER 2 - HIGH PRIORITY FEATURES (Week 2)

### Core API completeness

- [ ] **Fix HTTP Verbs & Routes** (Day 6-7, 10-12 hours)
  - [ ] Fix `credit.ts`: `GET /api/credit` → `POST /api/v1/credit-score`
  - [ ] Fix `score.ts`: `GET /api/score` → Check if needed or merge with credit-score
  - [ ] Fix `cluster.ts`: `GET /api/cluster` → `POST /api/v1/clusters`
  - [ ] Fix `recommend.ts`: `GET /api/recommend` → `POST /api/v1/recommendations`
  - [ ] Fix `policy.ts`: `GET /api/policy` → `POST /api/v1/policy-simulation`
  - [ ] Update all routes to use `/v1/` prefix
  - [ ] Update request/response schemas in function handlers
  - [ ] Test with Postman/curl

- [ ] **Implement Location Scoring API** (Day 7-8, 8-10 hours)
  - [ ] File: `api/src/functions/location-score.ts`
  - [ ] Endpoint: `POST /api/v1/location-score`
  - [ ] Input: `{ kecamatan_id or coordinates, filters }`
  - [ ] Output: `{ location_score, opportunity_rank, confidence }`
  - [ ] Use location scoring model from ML pipeline
  - [ ] Include SHAP explanations
  - [ ] Access control: government + investor only

- [ ] **Implement Batch Scoring Endpoint** (Day 8-9, 10-12 hours)
  - [ ] File: `api/src/functions/batch-credit-scores.ts`
  - [ ] Endpoint: `POST /api/v1/batch/credit-scores`
  - [ ] Input: `{ umkms: [ {umkm_id, ...}, ...], async: true/false }`
  - [ ] Output: `{ job_id, status, estimated_completion }`
  - [ ] Async processing with queue (Azure Service Bus or similar)
  - [ ] Add status check endpoint: `GET /api/v1/batch/{job_id}`
  - [ ] Webhook callback for completion notification
  - [ ] Access control: bank + admin only

- [ ] **Implement Audit Logging Middleware** (Day 9-10, 8-10 hours)
  - [ ] File: `api/src/shared/audit-logger.ts`
  - [ ] Log all requests: `{ timestamp, request_id, api_key, role, endpoint, method, status, execution_time }`
  - [ ] Store in database table or Application Insights
  - [ ] Endpoint: `GET /api/v1/audit-log` (admin only)
  - [ ] Query parameters: filters by date, user, endpoint, status
  - [ ] Return audit entries with pagination
  - [ ] Retention policy: 90 days minimum

**Week 2 Total: 40-50 hours**

---

## TIER 3 - ROBUSTNESS (Week 3)

### Error handling and validation

- [ ] **Add Input Validation** (Day 11-12, 8-10 hours)
  - [ ] Install Zod or Joi schema validation library
  - [ ] Create schemas for each endpoint:
    - [ ] credit-score: `{ umkm_id, include_confidence, include_explanation }`
    - [ ] location-score: `{ kecamatan_id or coordinates }`
    - [ ] clusters: `{ sector, min_size, filters }`
    - [ ] recommendations: `{ umkm_id, limit }`
    - [ ] what-if: `{ base_scenario, policy_change }`
  - [ ] Validate in each function before processing
  - [ ] Return INVALID_REQUEST error for bad inputs
  - [ ] Add validation tests

- [ ] **Add SHAP Explanations to API** (Day 12-13, 8-10 hours)
  - [ ] Modify credit-score response to include `feature_importance`
  - [ ] Format: `[ { feature: "revenue_trend", value: 0.35, impact: "positive" }, ... ]`
  - [ ] Limit to top 10 features
  - [ ] Include feature descriptions
  - [ ] Update response schema in API spec
  - [ ] Test with real model outputs

- [ ] **Implement Chat Streaming Endpoint** (Day 13-14, 8-10 hours)
  - [ ] File: `api/src/functions/chat-stream.ts`
  - [ ] Endpoint: `POST /api/v1/chat/stream`
  - [ ] Implement Server-Sent Events (SSE) for streaming
  - [ ] Stream chat responses word-by-word
  - [ ] Include metadata in stream (chunk count, total time)
  - [ ] Error handling for stream interruption
  - [ ] Test with browser and curl

- [ ] **Create Error Code System** (Day 14-15, 6-8 hours)
  - [ ] File: `api/src/shared/error-codes.ts`
  - [ ] Define all error codes as constants
  - [ ] Map HTTP status codes to error codes
  - [ ] Create error code documentation in API spec
  - [ ] Example: `INVALID_REQUEST` → 400, `UNAUTHORIZED` → 401
  - [ ] Update all functions to use error codes
  - [ ] Add error code to API documentation

**Week 3 Total: 30-40 hours**

---

## TIER 4 - FRONTEND & POLISH (Week 4)

### UI completion and integration

- [ ] **Integrate Frontend with Auth** (Day 16-17, 10-12 hours)
  - [ ] Update login page to call authentication API
  - [ ] Store API key securely (secure localStorage or HttpOnly cookie)
  - [ ] Add API key validation after login
  - [ ] Update `fetch` wrapper to include `X-API-Key` and `X-User-Role` headers
  - [ ] Handle 401/403/429 responses with appropriate UX
  - [ ] Add logout functionality
  - [ ] Implement session timeout (30 min inactivity)

- [ ] **Create Settings Page** (Day 17-18, 8-10 hours)
  - [ ] File: `frontend/app/(dashboard)/settings/page.tsx`
  - [ ] Sections:
    - [ ] User profile (name, organization, role)
    - [ ] API key management (view, regenerate, revoke)
    - [ ] Preferences (notifications, data retention, exports)
    - [ ] Security (change password, 2FA, audit log access)
  - [ ] Add routing in dashboard layout
  - [ ] Styling consistent with dashboard

- [ ] **Create Reports Page** (Day 18-19, 8-10 hours)
  - [ ] File: `frontend/app/(dashboard)/reports/page.tsx`
  - [ ] Features:
    - [ ] Custom report builder (drag-and-drop sections)
    - [ ] Report templates (executive summary, risk analysis, etc.)
    - [ ] Date range picker
    - [ ] Export formats: PDF, Excel, CSV
    - [ ] Scheduled reports (email delivery)
  - [ ] Integration with PDF export library (jsPDF)
  - [ ] Styling consistent with dashboard

- [ ] **Generate Missing Model Artifacts** (Day 19-20, 6-8 hours)
  - [ ] From Notebook 05: Generate `clustering_model.joblib`
  - [ ] From Notebook 06: Generate `recommendation_engine.joblib`
  - [ ] Test model loading in API
  - [ ] Version models in model registry
  - [ ] Document model performance metrics

- [ ] **Update API Specification** (Day 20-21, 8-10 hours)
  - [ ] File: `docs/05-geosmart-api-specification.md`
  - [ ] Update all endpoint definitions (POST /v1/...)
  - [ ] Add authentication section with code examples
  - [ ] Add rate limiting table by role
  - [ ] Document error codes with examples
  - [ ] Add response metadata to all examples
  - [ ] Document batch endpoints and webhooks
  - [ ] Update rate limit headers section
  - [ ] Add RBAC access control table

**Week 4 Total: 40-50 hours**

---

## POST-IMPLEMENTATION TASKS

### Verification and deployment

- [ ] **Security Assessment** (2-3 days)
  - [ ] Penetration testing on auth middleware
  - [ ] Rate limit bypass testing
  - [ ] API key rotation testing
  - [ ] SQL injection testing on all endpoints
  - [ ] CORS/CSRF validation
  - [ ] Documentation of security controls

- [ ] **Load Testing** (1-2 days)
  - [ ] Test 1000+ requests/second capacity
  - [ ] Verify rate limiting under load
  - [ ] Check database connection pool sizing
  - [ ] Monitor memory usage
  - [ ] Test concurrent batch jobs
  - [ ] Document capacity limits

- [ ] **Integration Testing** (2-3 days)
  - [ ] Test frontend → API → ML model pipeline
  - [ ] Test auth flow end-to-end
  - [ ] Test batch job processing
  - [ ] Test audit logging
  - [ ] Test error scenarios
  - [ ] Test cross-role access control

- [ ] **Documentation Review** (1-2 days)
  - [ ] Verify API spec matches implementation
  - [ ] Add code examples for each endpoint
  - [ ] Document authentication flow with diagrams
  - [ ] Create developer quickstart guide
  - [ ] Document rate limit behavior
  - [ ] Add troubleshooting section

- [ ] **Deployment Preparation** (1-2 days)
  - [ ] Create database schema for API keys
  - [ ] Setup Application Insights for logging
  - [ ] Configure rate limit thresholds
  - [ ] Setup monitoring/alerting
  - [ ] Create runbook for incidents
  - [ ] Plan blue-green deployment

---

## DATABASE SETUP REQUIRED

Before implementing fixes, ensure these tables exist:

```sql
-- API Keys Table (for authentication)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  organization_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  last_used_at TIMESTAMP
);

-- Request Log (for audit trail)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  request_id VARCHAR(255),
  api_key_id UUID,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INT,
  execution_time_ms INT,
  created_at TIMESTAMP
);

-- Rate Limit Counters (in-memory or Redis, refreshed per minute)
-- Structure: key = "api_key:timestamp", value = request_count

-- Batch Jobs (for async processing)
CREATE TABLE batch_jobs (
  id UUID PRIMARY KEY,
  api_key_id UUID,
  endpoint VARCHAR(255),
  input_count INT,
  status VARCHAR(50),
  created_at TIMESTAMP,
  completed_at TIMESTAMP,
  webhook_url VARCHAR(500)
);
```

---

## TESTING CHECKLIST

### Unit Tests (Create test files for each middleware/function)

```typescript
// tests/auth-middleware.test.ts
- [ ] Valid API key with bank role
- [ ] Valid API key with government role
- [ ] Invalid API key returns 401
- [ ] Missing API key returns 401
- [ ] Revoked API key returns 401

// tests/rate-limit-middleware.test.ts
- [ ] Request within limit succeeds
- [ ] Request at limit succeeds
- [ ] Request over limit returns 429
- [ ] Counters reset each minute
- [ ] Different roles have different limits

// tests/response-wrapper.test.ts
- [ ] Success response includes metadata
- [ ] Error response includes code
- [ ] Request ID is unique
- [ ] Timestamp is ISO format
- [ ] API version is included

// tests/endpoints.test.ts
- [ ] POST /api/v1/credit-score works
- [ ] POST /api/v1/location-score works
- [ ] POST /api/v1/clusters works
- [ ] GET /api/health works
- [ ] Invalid input returns INVALID_REQUEST
```

### Integration Tests

- [ ] End-to-end auth flow (login → store key → make request → verify auth)
- [ ] Rate limit enforcement under load
- [ ] Batch job processing with webhook
- [ ] Error handling and error codes
- [ ] SHAP explanations in responses
- [ ] Frontend dashboard with authenticated requests

---

## SUCCESS CRITERIA

✅ **Security**
- All endpoints require valid X-API-Key header
- Roles (bank/gov/investor) are enforced
- Rate limits are enforced per role
- All requests are logged to audit trail

✅ **API Compliance**
- All routes use /v1/ prefix
- Correct HTTP verbs (POST for mutations, GET for queries)
- All responses include metadata (request_id, timestamp, api_version)
- All errors return specific error codes

✅ **Performance**
- API handles 1000+ requests/second
- Health check responds in < 100ms
- Credit score responses in < 500ms
- Batch jobs complete within SLA

✅ **Quality**
- 90%+ unit test coverage
- Zero critical security issues
- Zero data validation failures
- 99.9% uptime SLA

---

## HANDOFF CRITERIA

Document is ready for handoff to implementation team when:

- [ ] All stakeholders have reviewed audit report
- [ ] Budget approved for 3-4 week timeline
- [ ] Team assigned (backend lead, security engineer, QA)
- [ ] Database schema created
- [ ] Dev/staging environments ready
- [ ] Monitoring/alerting configured
- [ ] Security review scheduled for end of Week 1

---

## QUICK REFERENCE: Files to Create

```
api/src/shared/
├── auth-middleware.ts          (Priority 1)
├── rate-limit-middleware.ts    (Priority 1)
├── response-wrapper.ts         (Priority 1)
├── audit-logger.ts             (Priority 2)
└── error-codes.ts              (Priority 3)

api/src/functions/
├── health.ts                   (Priority 1, new)
├── location-score.ts           (Priority 2, new)
├── batch-credit-scores.ts      (Priority 2, new)
├── chat-stream.ts              (Priority 3, new)
└── [update existing]           (modify all)

frontend/app/(dashboard)/
├── settings/page.tsx           (Priority 4, new)
└── reports/page.tsx            (Priority 4, new)

docs/
└── 05-geosmart-api-specification.md  (Update)
```

---

**Total Estimated Effort:** 400-500 hours  
**Recommended Team Size:** 2-3 engineers  
**Timeline:** 3-4 weeks  
**Cost:** ~$30-50K (depending on rates)

---

*Last Updated: 2026-06-02*  
*Reference: 19-code-documentation-consistency-audit.md*

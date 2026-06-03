# 20 — Remediation & Enhancement Roadmap

> **Document Purpose:** Comprehensive roadmap for fixing code-documentation gaps and enhancing GeoUMKM Smart V4.0 without time-based phases. Organized by technical tier, dependencies, and deliverables.

**Version:** 4.0  
**Last Updated:** 2026-06-02  
**Status:** Planning & Prioritization  
**Approach:** Task-based (tier-organized, dependency-aware, parallelizable)

---

## Executive Summary

This document provides a **tier-based improvement roadmap** for GeoUMKM Smart V4.0, organized by technical implementation blocks rather than time phases. Each tier contains:

- **Deliverables**: What gets built/fixed
- **Dependencies**: What must be done first
- **Effort Estimate**: Engineering hours required
- **Success Criteria**: How to validate completion
- **Technical Requirements**: Architecture and implementation details

**Key Principle:** Tasks can be executed in parallel within tiers, but tiers should be completed sequentially for dependency management.

---

## TIER 1 - SECURITY FOUNDATION (Critical)

### Tier 1 must be completed before any external API access is granted.

#### 1.1 API Authentication Middleware

**Deliverable:** Secure API key validation system

**What to build:**
- `api/src/shared/auth-middleware.ts` - Validate X-API-Key header
- `api/src/shared/auth-types.ts` - TypeScript types for auth context
- API Key database schema (PostgreSQL or similar)
- API key management functions (generate, validate, revoke, list)

**Technical Requirements:**
```typescript
// Request must include:
X-API-Key: sk_live_abc123xyz789...
X-User-Role: bank | government | investor | admin

// Middleware returns:
AuthContext {
  apiKey: string
  role: "bank" | "government" | "investor" | "admin"
  organizationId: string
  requestId: string
}

// Returns 401 if:
- Header missing
- Key invalid/revoked
- Key expired
```

**Database Schema:**
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  organization_id UUID NOT NULL,
  organization_name VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  created_by VARCHAR(255),
  revoked_at TIMESTAMP,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  last_used_ip VARCHAR(45),
  rate_limit_override INT,
  metadata JSONB
);

CREATE INDEX idx_api_keys_key ON api_keys(key);
CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
```

**Success Criteria:**
- [ ] All API calls require valid X-API-Key
- [ ] Revoked keys return 401
- [ ] Expired keys return 401
- [ ] Request ID generated for each call
- [ ] Auth context propagated to all functions
- [ ] Unit tests for all validation scenarios
- [ ] Can generate/revoke keys programmatically

**Effort:** 30-40 hours  
**Dependencies:** None (independent)  
**Files:** 3 new (middleware, types, migrations)

---

#### 1.2 Rate Limiting Middleware

**Deliverable:** Per-role rate limiting with quota enforcement

**What to build:**
- `api/src/shared/rate-limit-middleware.ts` - Enforce request quotas
- `api/src/shared/rate-limit-store.ts` - Store request counts
- Rate limit configuration (Redis or in-memory cache)
- Rate limit response headers

**Technical Requirements:**
```typescript
// Rate limit by role:
bank:       100 requests/minute
government: 50 requests/minute
investor:   50 requests/minute
admin:      unlimited

// Response includes:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705430400 (unix timestamp)

// Returns 429 (Too Many Requests) when exceeded
```

**Implementation Options:**
1. **In-Memory (dev/staging):** Simple JS Map with sliding window
2. **Redis (production):** Distributed rate limiting with INCR/EXPIRE
3. **Azure Table Storage (hybrid):** Persistent counters with TTL

**Success Criteria:**
- [ ] Requests within limit succeed (200)
- [ ] Requests at limit succeed (200)
- [ ] Requests over limit fail (429)
- [ ] Counters reset every minute
- [ ] Different roles have correct limits
- [ ] Rate limit headers set correctly
- [ ] Load testing: handles 1000+ req/sec without degradation

**Effort:** 25-35 hours  
**Dependencies:** 1.1 (needs auth context)  
**Files:** 2 new (middleware, store)

---

#### 1.3 Response Format & Metadata Wrapper

**Deliverable:** Standardized API response format

**What to build:**
- `api/src/shared/response-wrapper.ts` - Response formatting
- `api/src/shared/error-codes.ts` - Error code definitions
- Update all functions to use wrapper
- Response type definitions

**Technical Requirements:**
```typescript
// Success response:
{
  status: "success",
  data: { /* model output */ },
  metadata: {
    request_id: "req_abc123xyz",
    timestamp: "2026-06-02T13:00:00Z",
    api_version: "v1.0",
    execution_time_ms: 245
  }
}

// Error response:
{
  status: "error",
  error: {
    code: "INVALID_REQUEST" | "UNAUTHORIZED" | "RATE_LIMITED" | "INTERNAL_ERROR",
    message: "Human readable message",
    details: { /* additional context */ }
  },
  metadata: { /* same as success */ }
}

// Error codes:
INVALID_REQUEST (400)      - Bad input format/validation
UNAUTHORIZED (401)         - Missing/invalid API key
FORBIDDEN (403)           - Insufficient permissions for role
NOT_FOUND (404)           - Resource not found
RATE_LIMITED (429)        - Quota exceeded
INTERNAL_ERROR (500)      - Server error
SERVICE_UNAVAILABLE (503) - Dependency down
```

**Success Criteria:**
- [ ] All responses include metadata
- [ ] request_id is unique per request
- [ ] timestamp in ISO format
- [ ] execution_time_ms accurate
- [ ] Error codes consistent across all endpoints
- [ ] Error messages helpful and non-leaking
- [ ] Status field always present
- [ ] Type-safe response builders

**Effort:** 20-25 hours  
**Dependencies:** None (can be done in parallel)  
**Files:** 2 new (wrapper, error codes)

---

#### 1.4 Health Check Endpoint

**Deliverable:** System health monitoring endpoint

**What to build:**
- `api/src/functions/health.ts` - Health check function
- Dependency health checks (DB, OpenAI, blob storage, AI Search)
- Health status constants

**Technical Requirements:**
```typescript
// GET /api/health (no auth required for monitoring)
{
  status: "healthy" | "degraded" | "unhealthy",
  timestamp: "2026-06-02T13:00:00Z",
  uptime_seconds: 86400,
  checks: {
    api: { status: "healthy", response_time_ms: 5 },
    database: { status: "healthy", response_time_ms: 15 },
    openai: { status: "healthy", response_time_ms: 200 },
    blob_storage: { status: "healthy", response_time_ms: 50 },
    ai_search: { status: "healthy", response_time_ms: 100 }
  },
  version: "4.0.0"
}

// HTTP Status Codes:
200 - All healthy
200 - Degraded (some dependencies down but API functional)
503 - Unhealthy (API cannot function)
```

**Success Criteria:**
- [ ] Endpoint responds in < 100ms
- [ ] Detects database unavailability
- [ ] Detects OpenAI unavailability
- [ ] Detects blob storage unavailability
- [ ] Detects AI Search unavailability
- [ ] Returns correct HTTP status
- [ ] Works with monitoring tools (Prometheus, DataDog, etc.)
- [ ] Includes version information

**Effort:** 15-20 hours  
**Dependencies:** None (independent)  
**Files:** 1 new (health.ts)

---

#### 1.5 Apply Security Middleware to All Functions

**Deliverable:** All endpoints secured with auth + rate limiting + wrapper

**What to update:**
- Apply auth middleware to all existing functions
- Apply rate limiting to all functions
- Apply response wrapper to all functions
- Update all error responses to use error codes
- Change `authLevel: "anonymous"` to `authLevel: "function"`

**Functions to Update:**
1. `chat.ts` - POST /api/chat
2. `cluster.ts` - GET /api/cluster
3. `credit.ts` - GET /api/credit
4. `kecamatan.ts` - GET /api/kecamatan
5. `overview.ts` - GET /api/overview
6. `policy.ts` - GET /api/policy
7. `recommend.ts` - GET /api/recommend
8. `score.ts` - GET /api/score
9. `whatif.ts` - POST /api/whatif

**Pattern for Each Function:**
```typescript
async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  
  try {
    // 1. Authenticate
    const auth = await validateAuth(request);
    if (!auth) {
      const [error, status] = buildErrorResponse("UNAUTHORIZED", "Invalid API key", "", 401);
      return { status, jsonBody: error };
    }
    
    // 2. Check rate limit
    const rateLimit = checkRateLimit(auth.apiKey, auth.role);
    if (!rateLimit.allowed) {
      const [error, status] = buildErrorResponse("RATE_LIMITED", "Quota exceeded", auth.requestId, 429);
      return { 
        status, 
        jsonBody: error,
        headers: {
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimit.resetAt.toString()
        }
      };
    }
    
    // 3. Validate input
    const validated = validateInput(request);
    if (!validated.ok) {
      const [error, status] = buildErrorResponse("INVALID_REQUEST", validated.error, auth.requestId, 400);
      return { status, jsonBody: error };
    }
    
    // 4. Process request
    const result = await processLogic(validated.data);
    
    // 5. Return success
    const response = buildSuccessResponse(result, auth.requestId, Date.now() - startTime);
    return { 
      status: 200, 
      jsonBody: response,
      headers: {
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-RateLimit-Reset": rateLimit.resetAt.toString()
      }
    };
  } catch (error) {
    context.error("Error in handler:", error);
    const [errorResponse, status] = buildErrorResponse("INTERNAL_ERROR", "Server error", "", 500);
    return { status, jsonBody: errorResponse };
  }
}

app.http("endpoint_name", {
  methods: ["GET", "POST"],
  authLevel: "function",  // Changed from "anonymous"
  route: "endpoint_name",
  handler,
});
```

**Success Criteria:**
- [ ] All 9 functions require valid API key
- [ ] Rate limiting enforced on all
- [ ] All responses use standard format
- [ ] All errors use error codes
- [ ] authLevel changed to "function"
- [ ] No breaking changes to existing clients (maintain compatibility)
- [ ] Integration tests pass for all endpoints

**Effort:** 25-30 hours (15-20 min per function)  
**Dependencies:** 1.1, 1.2, 1.3, 1.4  
**Files:** 0 new (update existing)

---

### Tier 1 Completion Checklist

- [ ] 1.1 Auth middleware complete + tested
- [ ] 1.2 Rate limiting complete + tested
- [ ] 1.3 Response wrapper complete + tested
- [ ] 1.4 Health endpoint complete + tested
- [ ] 1.5 All functions updated and secured
- [ ] Security assessment completed
- [ ] No 401/403 false positives
- [ ] No false rate limit rejections
- [ ] Health endpoint responsive

**Tier 1 Total Effort:** 115-150 hours  
**Tier 1 Critical for:** External deployment, bank integrations

---

## TIER 2 - API COMPLETENESS

### Tier 2 implements missing endpoints and fixes existing ones.

#### 2.1 Fix HTTP Verbs & Route Versioning

**Deliverable:** Standardized routes with correct HTTP verbs

**What to fix:**
- All routes should follow REST conventions
- All routes should use `/api/v1/` prefix
- POST for mutations/scoring
- GET for retrieval/status
- DELETE for removal

**Route Changes:**
```
Current                    → Target
GET /api/credit           → POST /api/v1/credit-score
GET /api/score            → Merge with credit-score or deprecate
GET /api/cluster          → POST /api/v1/clusters (retrieval)
POST /api/whatif          → POST /api/v1/what-if (already correct)
GET /api/recommend        → GET /api/v1/recommendations (or POST)
GET /api/policy           → POST /api/v1/policy-simulation
POST /api/chat            → POST /api/v1/chat
GET /api/kecamatan        → GET /api/v1/kecamatan (correct verb)
GET /api/overview         → GET /api/v1/overview (new prefix)
(missing)                 → GET /api/v1/health
```

**Schema Updates:**
```typescript
// Credit Score Request
POST /api/v1/credit-score
{
  umkm_id: string (required)
  include_confidence?: boolean
  include_distribution?: boolean
  include_explanation?: boolean
}

// Response
{
  status: "success",
  data: {
    umkm_id: string,
    score: number (0-100),
    risk_classification: "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC",
    confidence: number (0-1),
    probability_distribution: Record<string, number>,
    feature_importance: Array<{feature: string, value: number, impact: "positive" | "negative"}>
  },
  metadata: {...}
}
```

**Success Criteria:**
- [ ] All routes use /api/v1/ prefix
- [ ] HTTP verbs follow REST conventions
- [ ] Request/response schemas match documentation
- [ ] Backward compatibility (redirect old routes if needed)
- [ ] All tests pass
- [ ] API documentation updated

**Effort:** 20-25 hours  
**Dependencies:** 1.1, 1.2, 1.3 (must be secure first)  
**Files:** 0 new (refactor existing)

---

#### 2.2 Location Scoring Endpoint

**Deliverable:** Expose location scoring model via API

**What to build:**
- `api/src/functions/location-score.ts` - Location opportunity scoring
- Integration with location scoring model from ML pipeline
- Support for kecamatan_id or coordinates input

**Technical Requirements:**
```typescript
// POST /api/v1/location-score
{
  kecamatan_id?: string | number,
  coordinates?: { latitude: number, longitude: number },
  sector?: string[],
  filters?: { min_population?: number, max_poverty_rate?: number }
}

// Response
{
  status: "success",
  data: {
    kecamatan_id: number,
    kecamatan_name: string,
    coordinates: { latitude: number, longitude: number },
    opportunity_score: number (0-100),
    opportunity_rank: number,
    confidence: number (0-1),
    market_size_estimate: number,
    sector_scores: Record<string, number>,
    feature_importance: Array<{feature: string, value: number}>
  },
  metadata: {...}
}
```

**Access Control:**
- bank: Can access (for geographic portfolio analysis)
- government: Can access (for policy targeting)
- investor: Can access (for opportunity discovery)
- admin: Full access

**Success Criteria:**
- [ ] Loads location scoring model successfully
- [ ] Returns consistent scores for same input
- [ ] Includes SHAP feature importance
- [ ] Access control enforced by role
- [ ] Response time < 500ms
- [ ] Handles invalid kecamatan_id gracefully
- [ ] Integrated with government customer use case

**Effort:** 20-25 hours  
**Dependencies:** 1.1, 1.2, 1.3, 2.1 (routing fixed)  
**Files:** 1 new (location-score.ts)

---

#### 2.3 Batch Credit Scoring Endpoint

**Deliverable:** Bulk scoring for multiple UMKMs

**What to build:**
- `api/src/functions/batch-credit-scores.ts` - Async batch processing
- Queue management (Azure Service Bus or similar)
- Job tracking and status endpoint
- Webhook callback support

**Technical Requirements:**
```typescript
// POST /api/v1/batch/credit-scores
{
  umkms: Array<{
    umkm_id: string,
    include_explanation?: boolean
  }>,
  async: boolean (default: true),
  callback_url?: string,
  batch_name?: string
}

// Immediate Response (if async: true)
{
  status: "success",
  data: {
    job_id: "batch_abc123xyz",
    status: "queued",
    estimated_completion_seconds: 300,
    input_count: 1000
  }
}

// Check Status: GET /api/v1/batch/credit-scores/{job_id}
{
  status: "success",
  data: {
    job_id: string,
    status: "queued" | "processing" | "completed" | "failed",
    progress: { completed: number, total: number, percent: number },
    estimated_completion_seconds: number,
    results_url?: string
  }
}

// Webhook Payload (if callback_url provided)
{
  event: "batch_completed",
  job_id: string,
  status: "completed" | "failed",
  results_url: string,
  input_count: number,
  completed_count: number,
  failed_count: number,
  timestamp: string
}
```

**Database Schema:**
```sql
CREATE TABLE batch_jobs (
  id UUID PRIMARY KEY,
  api_key_id UUID NOT NULL,
  batch_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'queued',
  input_count INT,
  completed_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  input_data JSONB,
  results_url VARCHAR(500),
  callback_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  estimated_completion_at TIMESTAMP
);

CREATE TABLE batch_results (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES batch_jobs(id),
  umkm_id VARCHAR(255),
  credit_score DECIMAL(5,2),
  risk_classification VARCHAR(10),
  error_message VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Success Criteria:**
- [ ] Processes 1000+ UMKMs without timeout
- [ ] Returns job_id immediately for async requests
- [ ] Provides progress tracking
- [ ] Supports webhook callbacks
- [ ] Stores results for retrieval
- [ ] Handles failures gracefully
- [ ] Rate limit applies to batch input (not per-UMKM)

**Effort:** 30-40 hours  
**Dependencies:** 1.1, 1.2, 1.3, 2.1 (routing)  
**Files:** 1 new (batch-credit-scores.ts)

---

#### 2.4 Audit Logging Middleware

**Deliverable:** Request tracking for compliance & analytics

**What to build:**
- `api/src/shared/audit-logger.ts` - Log all API calls
- Audit log database table
- Audit log query endpoint
- Log retention policy

**Technical Requirements:**
```typescript
// Audit log entry (stored for every request):
{
  id: UUID,
  request_id: string,
  timestamp: timestamp,
  api_key_id: UUID,
  role: string,
  organization_id: UUID,
  endpoint: string,
  method: string,
  status_code: number,
  execution_time_ms: number,
  input_size_bytes: number,
  output_size_bytes: number,
  error_code?: string,
  user_agent?: string,
  ip_address: string
}

// Query: GET /api/v1/audit-log (admin only)
{
  from_date: ISO date,
  to_date: ISO date,
  api_key_id?: UUID,
  endpoint?: string,
  status_code?: number,
  limit: number (default: 100, max: 1000)
}

// Response
{
  status: "success",
  data: {
    entries: Array<AuditLogEntry>,
    total_count: number,
    page: number,
    page_size: number
  }
}
```

**Database Schema:**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  request_id VARCHAR(255) UNIQUE,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  api_key_id UUID NOT NULL,
  role VARCHAR(50),
  organization_id UUID,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INT,
  execution_time_ms INT,
  input_size_bytes INT,
  output_size_bytes INT,
  error_code VARCHAR(50),
  user_agent VARCHAR(500),
  ip_address VARCHAR(45)
);

CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_api_key ON audit_log(api_key_id);
CREATE INDEX idx_audit_log_endpoint ON audit_log(endpoint);

-- Retention policy: 90 days (configurable)
-- Strategy: Move old logs to archive table or delete
```

**Success Criteria:**
- [ ] Every API call logged with metadata
- [ ] request_id matches response metadata
- [ ] Timestamp accurate
- [ ] Audit log queryable by date/user/endpoint
- [ ] Query endpoint includes pagination
- [ ] Retention policy enforced (90+ days)
- [ ] Performance: Logging doesn't impact API latency (< 5ms overhead)
- [ ] Secure: Only admin can query full logs

**Effort:** 25-30 hours  
**Dependencies:** 1.1, 1.2, 1.3  
**Files:** 1 new (audit-logger.ts)

---

### Tier 2 Completion Checklist

- [ ] 2.1 HTTP verbs and routing fixed
- [ ] 2.2 Location scoring endpoint working
- [ ] 2.3 Batch scoring endpoint working
- [ ] 2.4 Audit logging functional
- [ ] All endpoints tested end-to-end
- [ ] Bank customer can call batch scoring
- [ ] Government customer can call location scoring
- [ ] Audit logs are queryable

**Tier 2 Total Effort:** 115-150 hours  
**Tier 2 Critical for:** Full API feature parity with documentation

---

## TIER 3 - ROBUSTNESS & ERROR HANDLING

### Tier 3 improves code quality, validation, and error handling.

#### 3.1 Input Validation Framework

**Deliverable:** Schema validation for all endpoints

**What to build:**
- Install validation library (Zod or Joi)
- Create schemas for each endpoint
- Validation middleware
- Error messages for validation failures

**Technical Requirements:**
```typescript
// Example: Credit Score Schema
import { z } from 'zod';

const CreditScoreRequestSchema = z.object({
  umkm_id: z.string().uuid("Invalid UMKM ID"),
  include_confidence: z.boolean().optional().default(false),
  include_distribution: z.boolean().optional().default(false),
  include_explanation: z.boolean().optional().default(false)
});

// Middleware usage
async function handler(request: HttpRequest, ...): Promise<HttpResponseInit> {
  const body = await request.json();
  const validation = CreditScoreRequestSchema.safeParse(body);
  
  if (!validation.success) {
    const [error, status] = buildErrorResponse(
      "INVALID_REQUEST",
      "Validation failed",
      auth.requestId,
      400,
      { errors: validation.error.errors }
    );
    return { status, jsonBody: error };
  }
  
  const input = validation.data;
  // ... process
}
```

**Schemas to Create:**
1. CreditScoreRequest / CreditScoreResponse
2. LocationScoreRequest / LocationScoreResponse
3. ClusterRequest / ClusterResponse
4. RecommendationRequest / RecommendationResponse
5. WhatIfRequest / WhatIfResponse
6. ChatRequest / ChatResponse
7. BatchScoringRequest / BatchScoringResponse
8. BatchStatusRequest / BatchStatusResponse

**Success Criteria:**
- [ ] All endpoints validate input before processing
- [ ] Invalid input returns INVALID_REQUEST (400) with details
- [ ] Error messages indicate which fields are invalid
- [ ] Type-safe request/response objects
- [ ] Validation runs before database/model queries
- [ ] Performance: Validation < 5ms per request

**Effort:** 20-25 hours  
**Dependencies:** None (independent)  
**Files:** 1 new (validation schema file)

---

#### 3.2 SHAP Explanations in API

**Deliverable:** Feature importance in scoring responses

**What to build:**
- Extract SHAP values from trained models
- Include feature importance in credit-score responses
- Format feature explanations for API consumers
- Validate explanations in test data

**Technical Requirements:**
```typescript
// Feature importance format
{
  feature: string,
  value: number (-1 to 1, where negative = reduces score),
  impact: "negative" | "positive",
  description: string,
  baseline: number (the base model value)
}

// Example response with explanations
{
  status: "success",
  data: {
    umkm_id: "123e4567-e89b-12d3-a456-426614174000",
    credit_score: 78.5,
    risk_classification: "AA",
    confidence: 0.92,
    feature_importance: [
      {
        feature: "revenue_trend",
        value: 0.35,
        impact: "positive",
        description: "Strong revenue growth"
      },
      {
        feature: "debt_to_income",
        value: -0.18,
        impact: "negative",
        description: "High debt relative to income"
      },
      {
        feature: "location_opportunity",
        value: 0.22,
        impact: "positive",
        description: "Good geographic market"
      },
      // ... top 10 features
    ]
  }
}
```

**Implementation:**
1. Load trained models with SHAP values
2. For each prediction, compute feature importance
3. Limit to top 10 features for API response
4. Add feature descriptions from data dictionary
5. Validate explanations sum to expected score change

**Success Criteria:**
- [ ] Credit score response includes top 10 features
- [ ] Feature importance values match model output
- [ ] Descriptions are accurate and customer-friendly
- [ ] Explanations help customers understand scores
- [ ] Performance: Explanation generation < 200ms
- [ ] Works with batch scoring

**Effort:** 15-20 hours  
**Dependencies:** 1.1, 1.2, 1.3  
**Files:** 1 new (shap-extractor.ts)

---

#### 3.3 Chat Streaming Endpoint

**Deliverable:** Real-time chat responses via Server-Sent Events

**What to build:**
- `api/src/functions/chat-stream.ts` - SSE streaming
- Message streaming logic
- Error handling for interrupted streams
- Performance optimization

**Technical Requirements:**
```typescript
// POST /api/v1/chat/stream
{
  message: string,
  context?: {
    umkm_id?: string,
    previous_messages?: Array<{role: "user" | "assistant", content: string}>
  },
  streaming: true
}

// Server-Sent Events Response (Content-Type: text/event-stream)
data: {"type": "chunk", "content": "The UMKM in West Java..."}

data: {"type": "chunk", "content": " has strong potential..."}

data: {"type": "metadata", "tokens": 45, "total_time_ms": 2300}

data: {"type": "done"}
```

**Implementation Options:**
1. Azure OpenAI Streaming API
2. Azure Cognitive Services
3. Local LLM with streaming

**Success Criteria:**
- [ ] Streaming response starts within 500ms
- [ ] Chunks arrive within 1 second of generation
- [ ] Connection handles interruption gracefully
- [ ] Client receives complete metadata
- [ ] Performance: 50+ tokens/second throughput
- [ ] Works with knowledge base context

**Effort:** 20-25 hours  
**Dependencies:** 1.1, 1.2, 1.3, 2.1 (routing)  
**Files:** 1 new (chat-stream.ts)

---

#### 3.4 Error Code & Logging System

**Deliverable:** Structured error codes and logging throughout

**What to build:**
- Comprehensive error code definitions
- Structured logging with context
- Error translation layer (internal → external)
- Logging configuration

**Technical Requirements:**
```typescript
// Error codes (internal use):
{
  "DB_CONNECTION_FAILED": "Database connection timeout",
  "MODEL_LOAD_FAILED": "ML model failed to load",
  "AZURE_OPENAI_ERROR": "OpenAI service error",
  "BLOB_STORAGE_ERROR": "Blob storage unavailable",
  "INVALID_UMKM_ID": "UMKM not found in database",
  "RATE_LIMIT_EXCEEDED": "API quota exceeded",
  "API_KEY_REVOKED": "API key has been revoked",
  "INSUFFICIENT_PERMISSIONS": "Role cannot access this endpoint"
}

// External error codes (API response):
{
  "INVALID_REQUEST": "400 - Bad request format",
  "UNAUTHORIZED": "401 - Missing/invalid API key",
  "FORBIDDEN": "403 - Insufficient permissions",
  "NOT_FOUND": "404 - Resource not found",
  "RATE_LIMITED": "429 - API quota exceeded",
  "INTERNAL_ERROR": "500 - Server error",
  "SERVICE_UNAVAILABLE": "503 - Service temporarily down"
}

// Structured logging:
{
  timestamp: "2026-06-02T13:00:00.123Z",
  request_id: "req_abc123",
  level: "error",
  logger: "api.credit",
  message: "Failed to load credit risk model",
  error: {
    code: "MODEL_LOAD_FAILED",
    message: "Model file not found: /models/credit_risk_model.joblib",
    stack_trace: "..."
  },
  context: {
    endpoint: "/v1/credit-score",
    api_key_id: "sk_abc123",
    organization: "BankA"
  }
}
```

**Success Criteria:**
- [ ] All errors have codes
- [ ] Error messages don't leak internal details
- [ ] Logging includes request context
- [ ] Errors are searchable in logs
- [ ] Stack traces only in development
- [ ] Performance: Logging < 2ms overhead

**Effort:** 15-20 hours  
**Dependencies:** 1.1, 1.2, 1.3  
**Files:** 2 new (error-codes.ts, logger.ts)

---

### Tier 3 Completion Checklist

- [ ] 3.1 Input validation on all endpoints
- [ ] 3.2 SHAP explanations in credit-score response
- [ ] 3.3 Chat streaming working
- [ ] 3.4 Error codes and logging implemented
- [ ] All endpoints return specific error codes
- [ ] Invalid inputs caught and reported
- [ ] Logs are structured and searchable
- [ ] Production logging configured

**Tier 3 Total Effort:** 70-90 hours  
**Tier 3 Critical for:** Production reliability and debugging

---

## TIER 4 - FRONTEND & PRODUCT COMPLETENESS

### Tier 4 completes the frontend and closes the loop with API.

#### 4.1 Frontend Authentication Integration

**Deliverable:** Login flow integrated with API

**What to build:**
- Update login page to call authentication API
- API key management & storage
- Session management
- API client configuration
- Authentication state management

**Technical Requirements:**
```typescript
// Login flow:
1. User enters organization credentials
2. Frontend calls: POST /api/auth/login
   { organization_id, password }
3. Backend returns: { api_key, role, organization_name }
4. Frontend stores securely: HttpOnly cookie or secure localStorage
5. Subsequent requests include: X-API-Key header

// Logout flow:
1. User clicks logout
2. Clear API key from storage
3. Clear session state
4. Redirect to login

// API Client setup:
const apiClient = axios.create({
  baseURL: 'https://api.geoukmksmart.com/api/v1',
  headers: {
    'X-API-Key': getStoredApiKey(),
    'X-User-Role': getUserRole(),
    'Content-Type': 'application/json'
  }
});

// Handle 401 globally (key revoked or expired)
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      clearAuth();
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);
```

**Components to Create:**
- `components/AuthProvider.tsx` - Auth state management (React Context)
- `lib/apiClient.ts` - Axios client with auth headers
- `hooks/useAuth.ts` - Auth hook for components
- Update `app/(auth)/login/page.tsx` - Functional login
- Update `app/(auth)/register/page.tsx` - Functional registration
- Error boundary for auth errors

**Success Criteria:**
- [ ] Login works with API authentication
- [ ] API key stored securely
- [ ] Subsequent requests include API key
- [ ] Logout clears auth state
- [ ] 401 responses handled (re-login prompt)
- [ ] Users can see their organization/role
- [ ] Session persists on page reload
- [ ] No API key exposed in logs/console

**Effort:** 25-30 hours  
**Dependencies:** 1.1, 2.1  
**Files:** 4 new/update (AuthProvider, apiClient, hook, pages)

---

#### 4.2 User Settings Page

**Deliverable:** User preferences and API key management

**What to build:**
- `frontend/app/(dashboard)/settings/page.tsx` - Settings interface
- API key display/regeneration
- Organization details
- Preferences (notifications, exports, etc.)
- Security settings

**Technical Requirements:**
```typescript
// Settings Sections:
1. Profile
   - Organization name
   - Organization ID
   - User role
   - Email

2. API Management
   - Current API key (masked)
   - Regenerate key button
   - Key creation date, last used date, last used IP
   - Revoke key button
   - View all API keys (for admins)

3. Preferences
   - Email notifications (on/off)
   - Data export format (CSV, Excel, JSON)
   - Auto-logout timeout (15, 30, 60 minutes)
   - Timezone

4. Security
   - Change password
   - Enable 2FA (if supported)
   - View login history
   - Active sessions
   - Revoke sessions

5. Billing (for admins)
   - Current plan
   - Usage statistics
   - Upcoming invoices
   - Payment methods
```

**API Endpoints Needed:**
- GET /api/v1/user/profile
- GET /api/v1/user/settings
- PUT /api/v1/user/settings
- POST /api/v1/user/api-keys (generate new)
- DELETE /api/v1/user/api-keys/{key_id} (revoke)
- GET /api/v1/user/api-keys (list all)
- GET /api/v1/user/login-history
- POST /api/v1/user/change-password

**Success Criteria:**
- [ ] Users can view their profile
- [ ] Users can generate new API keys
- [ ] Users can revoke old keys
- [ ] Settings are persisted
- [ ] Changes take effect immediately
- [ ] Styling matches dashboard theme
- [ ] Mobile responsive

**Effort:** 20-25 hours  
**Dependencies:** 4.1 (auth integration)  
**Files:** 1 new (settings/page.tsx)

---

#### 4.3 Reports & Export Page

**Deliverable:** Custom report generation and export

**What to build:**
- `frontend/app/(dashboard)/reports/page.tsx` - Report builder
- Custom report templates
- Date range selection
- Format selection (PDF, Excel, CSV)
- Scheduled exports via email

**Technical Requirements:**
```typescript
// Report Sections (drag-and-drop):
1. Executive Summary
   - Key metrics (total UMKMs scored, avg score, etc.)
   - Portfolio overview

2. Risk Distribution
   - Score distribution chart
   - Risk category breakdown

3. Geographic Analysis
   - Top opportunities by region
   - Regional comparison

4. Sector Analysis
   - Best/worst performing sectors
   - Sector recommendations

5. Compliance
   - Audit trail
   - Access logs

// Export Formats:
1. PDF (via jsPDF)
   - Formatted report with charts
   - Page breaks, headers/footers
   - Logo and branding

2. Excel (via xlsx)
   - Data in sheets
   - Charts embedded
   - Formulas for calculations

3. CSV
   - Raw data export
   - Flat structure

// Scheduled Reports:
- Frequency: Daily, Weekly, Monthly
- Recipients: Email list
- Format: PDF or Excel
- Time: Scheduled send time
```

**API Endpoints Needed:**
- POST /api/v1/reports/generate (create on-demand)
- GET /api/v1/reports/{report_id} (retrieve)
- GET /api/v1/reports/scheduled (list schedules)
- POST /api/v1/reports/schedule (create schedule)
- DELETE /api/v1/reports/schedule/{id} (delete schedule)

**Success Criteria:**
- [ ] Users can select report sections
- [ ] PDF export includes visualizations
- [ ] Excel export includes data + charts
- [ ] CSV export for data analysis
- [ ] Scheduled reports sent on time
- [ ] Reports include branding/logo
- [ ] Mobile-friendly report builder
- [ ] Export performance < 10 seconds for 10K records

**Effort:** 25-30 hours  
**Dependencies:** 4.1 (auth)  
**Files:** 2 new (reports/page.tsx, report generator)

---

#### 4.4 Model Artifacts Generation & Testing

**Deliverable:** Generate & test missing ML models

**What to build:**
- Generate clustering model from notebook 05
- Generate recommendation engine from notebook 06
- Model testing framework
- Model performance validation

**Technical Requirements:**
```python
# From Notebook 05: Generate clustering model
# K-Means clustering for market segmentation

import joblib
from sklearn.cluster import KMeans, DBSCAN

# Train clustering model
kmeans = KMeans(n_clusters=5, random_state=42)
cluster_assignments = kmeans.fit_predict(X_features)

# Save model
joblib.dump(kmeans, 'models/clustering_model.joblib')

# From Notebook 06: Generate recommendation engine
# Rule-based recommendation system

def recommendation_engine(umkm_profile):
    # Inputs: location_score, credit_score, sector, region
    # Outputs: [recommended_policies, recommended_interventions]
    # Logic: Score-based thresholds + rule engine
    pass

joblib.dump(recommendation_engine, 'models/recommendation_engine.joblib')
```

**Success Criteria:**
- [ ] clustering_model.joblib exists and loads
- [ ] recommendation_engine.joblib exists and loads
- [ ] Models tested on validation data
- [ ] Performance metrics documented
- [ ] Models versioned in model registry
- [ ] Loading time < 500ms per model

**Effort:** 15-20 hours  
**Dependencies:** ML pipeline (notebooks)  
**Files:** 0 new (artifacts generated from notebooks)

---

#### 4.5 API Documentation Update

**Deliverable:** Update API spec to match implementation

**What to update:**
- Update `05-geosmart-api-specification.md`
- Document all endpoints (v1 with correct verbs)
- Add authentication section with examples
- Add rate limiting details
- Add error codes reference
- Add response metadata documentation
- Code examples for each endpoint

**Content Updates:**
```markdown
# Updates needed in 05-geosmart-api-specification.md:

## 1. Update base URLs to use /v1/
- Old: /api/credit-score
- New: /api/v1/credit-score

## 2. Add authentication section
- X-API-Key header format
- X-User-Role values
- 401 error examples
- API key generation process

## 3. Add rate limiting section
- Per-role limits table
- Rate limit headers
- 429 response example

## 4. Add error codes section
- All error codes and meanings
- HTTP status code mapping
- Error response format

## 5. Add response metadata section
- request_id format
- timestamp format
- api_version
- execution_time_ms

## 6. Update each endpoint
- Correct HTTP verb
- Correct route with /v1/
- Complete request/response schemas
- Authentication requirements
- Rate limit implications
- Example request/response

## 7. Add new endpoints
- POST /api/v1/location-score
- POST /api/v1/batch/credit-scores
- GET /api/v1/batch/{job_id}
- GET /api/v1/audit-log
- GET /api/v1/health
- POST /api/v1/chat/stream

## 8. Add code examples
- curl examples for each endpoint
- Python client example
- TypeScript client example
```

**Success Criteria:**
- [ ] All endpoints documented with /v1/ prefix
- [ ] Request/response schemas match implementation
- [ ] Authentication requirements clear
- [ ] Rate limiting explained
- [ ] Error codes fully documented
- [ ] Code examples provided
- [ ] Examples tested and working

**Effort:** 15-20 hours  
**Dependencies:** All other tiers  
**Files:** 1 update (05-geosmart-api-specification.md)

---

### Tier 4 Completion Checklist

- [ ] 4.1 Frontend auth integrated with API
- [ ] 4.2 Settings page functional
- [ ] 4.3 Reports page functional
- [ ] 4.4 Model artifacts generated
- [ ] 4.5 API documentation updated
- [ ] End-to-end login flow working
- [ ] Users can export reports
- [ ] API documentation matches implementation

**Tier 4 Total Effort:** 120-150 hours  
**Tier 4 Critical for:** User-facing product readiness

---

## TIER 5 - VALIDATION & OPTIMIZATION (Optional)

### Tier 5 is optional but recommended for production excellence.

#### 5.1 Load Testing & Performance

**What to accomplish:**
- Load testing with 1000+ concurrent users
- Performance profiling (identify bottlenecks)
- Database optimization (indexes, query tuning)
- Caching strategy (Redis for hot data)
- CDN for static assets

**Success Criteria:**
- [ ] API handles 1000+ req/sec
- [ ] P95 latency < 500ms
- [ ] No memory leaks under sustained load
- [ ] Database queries < 100ms
- [ ] Cache hit rate > 80%

**Effort:** 30-40 hours

---

#### 5.2 Security Hardening

**What to accomplish:**
- Penetration testing
- OWASP Top 10 review
- API rate limit bypass testing
- SQL injection testing
- XSS/CSRF testing
- Data encryption (in transit + at rest)

**Success Criteria:**
- [ ] No critical vulnerabilities found
- [ ] All data encrypted in transit (TLS 1.3)
- [ ] Sensitive data encrypted at rest
- [ ] Input validation prevents injection
- [ ] Error messages don't leak info

**Effort:** 25-35 hours

---

#### 5.3 Monitoring & Alerting

**What to accomplish:**
- Application Insights configuration
- Custom metrics (API latency, error rate, etc.)
- Dashboards (operational view)
- Alerts for production issues
- Health check monitoring

**Success Criteria:**
- [ ] All errors logged and visible
- [ ] API latency tracked and alerted
- [ ] Database health monitored
- [ ] Rate limit health tracked
- [ ] On-call rotation setup

**Effort:** 20-25 hours

---

#### 5.4 Disaster Recovery & Backup

**What to accomplish:**
- Database backup strategy (daily, weekly)
- Model artifact backups
- API key rotation procedure
- Incident response runbook
- RTO/RPO targets documented

**Success Criteria:**
- [ ] Backups automated and tested
- [ ] Recovery time < 1 hour
- [ ] Recovery point < 1 day
- [ ] Incident response documented
- [ ] Team trained on procedures

**Effort:** 15-20 hours

---

## EXECUTION MODEL

### Independence & Parallelization

Tasks can be parallelized **within tiers**, but **between tiers they have dependencies**:

```
TIER 1: Security Foundation (MUST COMPLETE FIRST)
  ├─ 1.1 Auth middleware (prerequisite for everything)
  ├─ 1.2 Rate limiting (can parallel with 1.1)
  ├─ 1.3 Response wrapper (can parallel with 1.1-1.2)
  ├─ 1.4 Health endpoint (can parallel with 1.1-1.3)
  └─ 1.5 Apply to all (requires 1.1-1.4)
  
TIER 2: API Completeness (AFTER TIER 1)
  ├─ 2.1 Fix routes (prereq for 2.2-2.4)
  ├─ 2.2 Location endpoint (can parallel with 2.3-2.4)
  ├─ 2.3 Batch endpoint (can parallel with 2.2, 2.4)
  └─ 2.4 Audit logging (can parallel with 2.2-2.3)
  
TIER 3: Robustness (AFTER TIER 1-2)
  ├─ 3.1 Input validation (independent)
  ├─ 3.2 SHAP explanations (independent)
  ├─ 3.3 Chat streaming (prereq: 2.1)
  └─ 3.4 Error codes (independent)
  
TIER 4: Frontend (AFTER TIER 1-2)
  ├─ 4.1 Frontend auth (prereq: 1.1)
  ├─ 4.2 Settings page (prereq: 4.1)
  ├─ 4.3 Reports page (prereq: 4.1)
  ├─ 4.4 Model artifacts (independent)
  └─ 4.5 Documentation (last - summarizes all)
  
TIER 5: Optimization (AFTER TIER 1-4, optional)
  ├─ 5.1 Load testing
  ├─ 5.2 Security hardening
  ├─ 5.3 Monitoring
  └─ 5.4 Disaster recovery
```

### Team Allocation Suggestions

**Option A: Serial (1-2 engineers)**
- Complete Tier 1 fully (80 hours)
- Then Tier 2 (115 hours)
- Then Tier 3 (70 hours)
- Simultaneously: Tier 4 with product team (120 hours)
- Total: 8-12 weeks sequentially, but parallelizable from Week 5 onward

**Option B: Parallel (3-4 engineers)**
- Team A: Tier 1 (80 hours) + Tier 2 API (115 hours)
- Team B: Tier 3 robustness (70 hours) + Tier 4 frontend (120 hours) in parallel after Week 2
- Result: Tier 1-2 complete in weeks 1-2, Tier 3-4 in weeks 3-4 (8-10 weeks total)

**Option C: Full Parallel (6+ engineers)**
- Team 1: Tier 1 (1-2 engineers, 2 weeks)
- Team 2: Tier 2 API (2 engineers, 3 weeks, starts after Tier 1)
- Team 3: Tier 3 robustness (1-2 engineers, 2 weeks, starts after Tier 1)
- Team 4: Tier 4 frontend (2 engineers, 3-4 weeks, starts after Tier 1)
- Result: All tiers complete in 4-5 weeks
- Tier 5 (optional): 1-2 weeks after

---

## DEPENDENCY MAP

```
Tier 1 (Auth, Validation, Health)
│
├─────────────────────────────────────────────┐
│                                             │
Tier 2 (Endpoints)                      Tier 4 (Frontend)
│ (1.1, 1.2, 1.3)                       │ (1.1)
│                                        │
├─── 2.1 Routes ───────┐                ├─ 4.1 Auth Integration
│                      │                │
├─── 2.2 Location ─────┼────────────────┤
│                      │                │
├─── 2.3 Batch ────────┼────────────────┤
│                      │                │
└─── 2.4 Audit ────────┘                └─ 4.2 Settings
                                        │
          Tier 3 (Robustness)          ├─ 4.3 Reports
          │ (1.1, 1.2, 1.3)            │
          │                            ├─ 4.4 Models
          ├─ 3.1 Validation            │
          │                            └─ 4.5 Documentation
          ├─ 3.2 SHAP
          │
          ├─ 3.3 Chat Streaming (needs 2.1)
          │
          └─ 3.4 Error Codes


          Tier 5 (Optimization, optional)
          (after Tier 1-4)
```

---

## SUCCESS CRITERIA ACROSS ALL TIERS

### Production Readiness Checklist

**Security:**
- [x] All endpoints require valid API key
- [x] RBAC enforced by role
- [x] Rate limiting protects against DDoS
- [x] Audit trail logged for compliance
- [x] No sensitive data in error messages

**API Completeness:**
- [x] All routes use /api/v1/ prefix
- [x] HTTP verbs follow REST conventions
- [x] All responses include metadata
- [x] All errors use error codes
- [x] Missing endpoints implemented

**Robustness:**
- [x] Input validation on all endpoints
- [x] Error codes consistent
- [x] Logging structured and searchable
- [x] SHAP explanations included
- [x] Chat streaming functional

**Frontend:**
- [x] Login integrated with API
- [x] Settings page functional
- [x] Reports/export available
- [x] Auth state managed correctly
- [x] No API key exposed

**Documentation:**
- [x] API spec updated and accurate
- [x] All endpoints documented
- [x] Code examples provided
- [x] Error codes explained
- [x] Authentication flow documented

**Performance:**
- [x] API handles 1000+ req/sec
- [x] Response times < 500ms (scoring)
- [x] Logging overhead < 5ms
- [x] Health check < 100ms
- [x] Model loading < 500ms

**Monitoring:**
- [x] Health check endpoint working
- [x] Audit logs queryable
- [x] Error rates visible
- [x] Performance metrics tracked
- [x] Alerts configured

---

## DOCUMENTATION & HANDOFF

### Deliverables After Each Tier

**After Tier 1:**
- Security architecture document
- API key management guide
- Rate limiting configuration
- Internal testing results

**After Tier 2:**
- API endpoint reference
- Route documentation
- Batch processing guide
- Audit log schema

**After Tier 3:**
- Input validation reference
- Error code catalog
- SHAP explanation guide
- Logging architecture

**After Tier 4:**
- User guides (login, settings, reports)
- API client library documentation
- Frontend architecture
- Product release notes

**After Tier 5 (Optional):**
- Performance benchmarks
- Security assessment report
- Disaster recovery plan
- Operational runbook

---

## NEXT STEPS

1. **Review this roadmap** with engineering team
2. **Assign responsibility** for each tier
3. **Set up tracking** in SQL todos (tasks already created)
4. **Start Tier 1** immediately (no blockers)
5. **Schedule weekly reviews** of progress
6. **Adjust priorities** based on business needs

---

**Document Status:** Planning & Prioritization Complete  
**Last Updated:** 2026-06-02  
**Next Review:** After Tier 1 completion


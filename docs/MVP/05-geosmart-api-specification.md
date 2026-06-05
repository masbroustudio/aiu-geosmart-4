# GeoUMKM Smart - REST API Specification

**Version:** 4.0 
**Last Updated:** 2026  
**Status:** Production Documentation

## Purpose

This document provides complete REST API documentation for GeoUMKM Smart, including all endpoints, request/response schemas, authentication, rate limiting, and error handling. It's intended for frontend developers, mobile app developers, and external integrators.

---

## Executive Summary

The GeoUMKM Smart API exposes 10+ endpoints through Azure Functions (v4.0) / Container Apps (v4.1+):
- **Credit Score**: Predict UMKM credit risk
- **Location Score**: Assess geographic opportunities  
- **Clusters**: Retrieve UMKM market segments
- **Recommendations**: Get personalized credit/policy/investment suggestions
- **What-If**: Scenario analysis for credit decisions
- **Chat**: Natural language explanations (v4.0 NEW)
- **Batch Scoring**: Bulk processing of UMKMs
- **Models Info**: Model registry and versions
- **Audit Log**: Track all API calls and changes
- **Health Check**: System status

**Version**: v1  
**Authentication**: API Key + Role-Based Access Control  
**Rate Limit**: 100 requests/minute per API key (per role)

---

## Base URLs by Environment

| Environment | Base URL | Purpose |
|-------------|----------|---------|
| **Local** | `http://localhost:8000/api` | Local development |
| **Development** | `https://dev-api.azurewebsites.net/api` | Feature testing (auto-deployed on PR) |
| **Staging** | `https://staging-api.azurewebsites.net/api` | Pre-production UAT & perf testing |
| **Production** | `https://fa-geoumkm-api.azurewebsites.net/api` | Live API (v4.0) |

**Note**: v4.0 uses default Azure Functions hostname. v4.1 will upgrade to custom domain via API Gateway + Container Apps.

See `04-environment-configuration.md` for full environment setup guide.

---

## Authentication

### API Key Authentication

All requests require an `X-API-Key` header:

```
GET /api/v1/credit-score/12345
X-API-Key: sk_live_abc123xyz789...
X-User-Role: bank
```

**API Key Registration**:
1. Contact GeoUMKM Smart admin
2. Specify Organization (bank, government, investor)
3. Receive API key via secure channel
4. Add key to request headers

### Role-Based Access Control (RBAC)

| Role | Permissions | Rate Limit |
|------|-------------|-----------|
| bank | Credit scores, cluster analysis | 100 req/min |
| government | Location scores, cluster analysis, recommendations | 50 req/min |
| investor | Opportunity analysis, recommendations, what-if | 50 req/min |
| admin | All endpoints + analytics | Unlimited |

---

## Global Response Format

### Success Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "umkm_id": "550e8400-e29b-41d4-a716-446655440000",
    "score": 75.5,
    "confidence": 0.92
  },
  "metadata": {
    "request_id": "req_abc123xyz",
    "timestamp": "2024-01-15T14:30:00Z",
    "api_version": "v1.0"
  }
}
```

### Error Response (400/401/403/429/500)

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_UMKM_ID",
    "message": "UMKM ID not found in database",
    "details": {
      "umkm_id": "invalid-id-format"
    }
  },
  "metadata": {
    "request_id": "req_xyz789abc",
    "timestamp": "2024-01-15T14:30:00Z"
  }
}
```

---

## Complete API Endpoint Reference

| # | Endpoint | Method | Purpose | Rate Limit | Status |
|---|----------|--------|---------|-----------|--------|
| 1 | `/v1/health` | GET | System health check | 1000/min | ✅ v4.0 |
| 2 | `/v1/credit-score` | POST | Predict UMKM credit risk | 100/min | ✅ v4.0 |
| 3 | `/v1/location-score` | POST | Geographic opportunity score | 100/min | ✅ v4.0 |
| 4 | `/v1/clusters` | POST | Retrieve market segments | 100/min | ✅ v4.0 |
| 5 | `/v1/recommendations` | POST | Get personalized suggestions | 100/min | ✅ v4.0 |
| 6 | `/v1/whatif` | POST | Scenario analysis | 100/min | ✅ v4.0 |
| 7 | `/v1/chat` | POST | Natural language Q&A (NEW) | 50/min | ✅ v4.0 |
| 8 | `/v1/chat/stream` | POST | Streaming chat responses (NEW) | 50/min | ✅ v4.0 |
| 9 | `/v1/batch/credit-scores` | POST | Bulk scoring (async) | 10/min | ✅ v4.0 |
| 10 | `/v1/models/info` | GET | Model registry + versions | 100/min | ✅ v4.0 |
| 11 | `/v1/audit-log` | GET | API call audit trail | 50/min | ✅ v4.0 |

**Legend**: 
- Rate limits are per role/API key
- All endpoints require `X-API-Key` header
- See `04-environment-configuration.md` for full rate limiting strategy
- v4.0 = Current production version
- See individual endpoint sections below for request/response schemas

---

## Endpoint: GET /v1/health

**Purpose**: System health check (diagnostic endpoint)

**Access**: Public (no API key required)

**Rate Limit**: 1000 requests/minute (permissive for monitoring)

**Request**:

```bash
# Local development
curl -X GET http://localhost:8000/api/v1/health

# Production
curl -X GET https://fa-geoumkm-api.azurewebsites.net/api/v1/health \
  -H "X-API-Key: sk_live_abc123"  # Optional for authenticated check
```

**Response** (200 OK):

```json
{
  "status": "ok",
  "version": "4.0",
  "timestamp": "2026-06-02T10:30:00Z",
  "uptime_seconds": 3600,
  "dependencies": {
    "database": "healthy",
    "cache": "healthy",
    "openai": "healthy",
    "ai_search": "healthy"
  }
}
```

**Response** (503 Service Unavailable - when unhealthy):

```json
{
  "status": "degraded",
  "version": "4.0",
  "timestamp": "2026-06-02T10:30:00Z",
  "dependencies": {
    "database": "unhealthy",
    "cache": "healthy",
    "openai": "healthy",
    "ai_search": "unhealthy"
  }
}
```

---

## Endpoint: POST /v1/credit-score

**Purpose**: Get credit risk score for UMKM

**Access**: bank, government, investor

**Request**:

```bash
curl -X POST https://fa-geoumkm-api.azurewebsites.net/api/v1/credit-score \
  -H "X-API-Key: sk_live_abc123" \
  -H "X-User-Role: bank" \
  -H "Content-Type: application/json" \
  -d '{
    "umkm_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Request Schema**:

```typescript
interface CreditScoreRequest {
  umkm_id: string;              // UUID of UMKM
  include_confidence?: boolean; // Default: true
  include_distribution?: boolean; // Default: true - includes prob_very_low, etc.
  include_explanation?: boolean; // Default: false - SHAP explanations (slower)
}
```

**Response Schema**:

```typescript
interface CreditScoreResponse {
  umkm_id: string;
  overall_credit_score: number;        // 0-100
  risk_classification: RiskBucket;     // very_low|low|medium|high|very_high
  probability_default: number;         // 0-1
  score_confidence: number;            // 0-100
  
  // When include_distribution=true
  probability_distribution?: {
    very_low: number;                  // 0-1
    low: number;
    medium: number;
    high: number;
    very_high: number;
  };
  
  // When include_explanation=true (adds 500ms latency)
  explanation?: {
    top_contributing_features: Array<{
      feature_name: string;
      contribution: number;            // SHAP value
      current_value: any;
      impact: 'positive' | 'negative';
    }>;
    feature_analysis: string;          // Human-readable summary
  };
  
  model_version: string;               // e.g., "xgb_v1.2"
  score_validity_until: string;        // ISO 8601 date
}
```

**Response Examples**:

```json
{
  "status": "success",
  "data": {
    "umkm_id": "550e8400-e29b-41d4-a716-446655440000",
    "overall_credit_score": 72,
    "risk_classification": "medium",
    "probability_default": 0.142,
    "score_confidence": 0.89,
    "probability_distribution": {
      "very_low": 0.15,
      "low": 0.32,
      "medium": 0.35,
      "high": 0.15,
      "very_high": 0.03
    },
    "model_version": "xgb_v1.2",
    "score_validity_until": "2024-12-31"
  },
  "metadata": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T14:30:00Z",
    "api_version": "v1.0"
  }
}
```

**Error Codes**:

| Code | HTTP | Cause |
|------|------|-------|
| INVALID_UMKM_ID | 400 | UMKM ID format invalid or not found |
| UNAUTHORIZED | 401 | Invalid API key or expired |
| FORBIDDEN | 403 | User role lacks permission |
| RATE_LIMITED | 429 | Exceeded rate limit |
| INTERNAL_ERROR | 500 | Server processing error |

---

## Endpoint: POST /v1/location-score

**Purpose**: Get location opportunity score for kecamatan (sub-district)

**Access**: government, investor, bank

**Request**:

```bash
curl -X POST https://fa-geoumkm-api.azurewebsites.net/api/v1/location-score \
  -H "X-API-Key: sk_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "kecamatan_id": 3201011,
    "include_ranking": true
  }'
```

**Request Schema**:

```typescript
interface LocationScoreRequest {
  kecamatan_id: number;              // BPS kecamatan code or ID
  include_ranking?: boolean;         // Default: false
  include_sub_scores?: boolean;      // Default: false - infrastructure, economic, etc.
  include_map_data?: boolean;        // Default: false - GeoJSON boundaries
}
```

**Response Schema**:

```typescript
interface LocationScoreResponse {
  kecamatan_id: number;
  nama_kecamatan: string;
  
  // Overall Score
  location_opportunity_score: number;     // 0-100
  
  // Sub-Scores
  economic_vibrancy: number;              // 0-100
  infrastructure_quality: number;         // 0-100
  business_ecosystem_strength: number;    // 0-100
  market_accessibility: number;           // 0-100
  
  // Ranking
  ranking?: {
    national_rank: number;                // 1-8000+
    provincial_rank: number;
    district_rank: number;
    percentile: number;                   // 0-100
  };
  
  // Supporting Data
  statistics?: {
    total_umkm_count: number;
    avg_credit_score: number;
    business_sectors: Array<{
      sektor: string;
      count: number;
      avg_employees: number;
    }>;
  };
  
  // GeoJSON
  map_data?: {
    type: 'Feature';
    geometry: GeoJSON.Geometry;
    properties: Record<string, any>;
  };
  
  model_version: string;
}
```

**Response Example**:

```json
{
  "status": "success",
  "data": {
    "kecamatan_id": 3201011,
    "nama_kecamatan": "Senen, Jakarta Pusat",
    "location_opportunity_score": 88,
    "economic_vibrancy": 92,
    "infrastructure_quality": 85,
    "business_ecosystem_strength": 87,
    "market_accessibility": 89,
    "ranking": {
      "national_rank": 42,
      "provincial_rank": 3,
      "percentile": 94
    },
    "statistics": {
      "total_umkm_count": 3421,
      "avg_credit_score": 74.5,
      "business_sectors": [
        {"sektor": "retail", "count": 1230, "avg_employees": 2.3},
        {"sektor": "food_beverage", "count": 890, "avg_employees": 1.8}
      ]
    }
  },
  "metadata": {}
}
```

---

## Endpoint: POST /v1/clusters

**Purpose**: Retrieve UMKM cluster membership and characteristics

**Access**: All roles

**Request**:

```bash
curl -X POST https://fa-geoumkm-api.azurewebsites.net/api/v1/clusters \
  -H "X-API-Key: sk_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "umkm_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Request Schema**:

```typescript
interface ClustersRequest {
  umkm_id: string;                    // Single UMKM cluster
  cluster_id?: number;                // Or retrieve all UMKM in cluster
  include_profile?: boolean;          // Default: true
  include_similar_umkm?: boolean;     // Default: false - similar UMKM
  limit?: number;                     // Max results (default: 10)
}
```

**Response Schema**:

```typescript
interface ClustersResponse {
  umkm_id: string;
  
  kmeans_cluster: number;             // Cluster 0-7
  dbscan_cluster: number;             // Cluster 0-7 or -1 (noise)
  is_noise_point: boolean;
  
  cluster_cohesion_score: number;     // 0-100: closeness to center
  distance_to_center: number;         // Euclidean distance
  
  cluster_profile: {
    cluster_name: string;             // e.g., "High-Growth Formal"
    characteristics: {
      typical_employees: string;      // "3-5"
      typical_revenue_growth: string; // "15-30%"
      formality_rate: number;         // %
      digital_adoption: number;       // %
    };
    size: number;                     // Total UMKM in cluster
    size_percent: number;             // % of total
  };
  
  similar_umkm?: Array<{
    umkm_id: string;
    nama: string;
    similarity_score: number;         // 0-100
    distance_km: number;
  }>;
  
  model_version: string;
}
```

---

## Endpoint: POST /v1/recommendations

**Purpose**: Get personalized credit/policy/investment recommendations

**Access**: All roles

**Request**:

```bash
curl -X POST https://fa-geoumkm-api.azurewebsites.net/api/v1/recommendations \
  -H "X-API-Key: sk_live_abc123" \
  -H "X-User-Role: bank" \
  -H "Content-Type: application/json" \
  -d '{
    "umkm_id": "550e8400-e29b-41d4-a716-446655440000",
    "recommendation_type": "credit_product",
    "top_n": 3
  }'
```

**Request Schema**:

```typescript
interface RecommendationsRequest {
  umkm_id: string;
  recommendation_type: 'credit_product' | 'policy_program' | 'investment' | 'all';
  top_n?: number;                    // Default: 3
  min_confidence?: number;           // Filter by confidence (0-100)
}
```

**Response Schema**:

```typescript
interface RecommendationsResponse {
  umkm_id: string;
  
  recommendations: Array<{
    recommendation_id: string;
    type: string;                    // credit_product, policy_program, etc.
    title: string;                   // e.g., "Micro Credit Facility 100M"
    description: string;
    confidence_score: number;        // 0-100
    priority: 1 | 2 | 3;
    
    reasoning: {
      key_factors: string[];        // List of contributing factors
      rationale: string;            // Why recommended
      expected_impact: string;
    };
    
    details: {
      max_loan_amount?: number;
      interest_rate?: number;
      tenor_months?: number;
      collateral_requirement?: string;
      program_url?: string;
    };
  }>;
  
  model_version: string;
}
```

**Response Example**:

```json
{
  "status": "success",
  "data": {
    "umkm_id": "550e8400-e29b-41d4-a716-446655440000",
    "recommendations": [
      {
        "recommendation_id": "rec_001",
        "type": "credit_product",
        "title": "SME Credit Facility - Rp 500 Million",
        "confidence_score": 94,
        "priority": 1,
        "reasoning": {
          "key_factors": [
            "Growing revenue trend (24% YoY)",
            "Formal business registration",
            "Digital payment adoption 80%"
          ],
          "rationale": "Strong fundamentals with growth trajectory",
          "expected_impact": "Scale operations by 30-40%"
        },
        "details": {
          "max_loan_amount": 500000000,
          "interest_rate": 0.11,
          "tenor_months": 24,
          "collateral_requirement": "Land deed or equipment"
        }
      }
    ]
  }
}
```

---

## Endpoint: POST /v1/whatif

**Purpose**: Scenario analysis for credit decisions (what-if simulator)

**Access**: bank

**Request**:

```bash
curl -X POST https://fa-geoumkm-api.azurewebsites.net/api/v1/whatif \
  -H "X-API-Key: sk_live_abc123" \
  -H "X-User-Role: bank" \
  -H "Content-Type: application/json" \
  -d '{
    "umkm_id": "550e8400-e29b-41d4-a716-446655440000",
    "scenario": {
      "revenue_growth_change": 0.05,
      "employee_count_change": 2,
      "digital_adoption_change": 0.1
    }
  }'
```

**Request Schema**:

```typescript
interface WhatIfRequest {
  umkm_id: string;
  scenario: {
    revenue_growth_change?: number;    // Absolute change (e.g., +0.05 = +5%)
    revenue_volatility_change?: number;
    operating_margin_change?: number;
    employee_count_change?: number;
    digital_adoption_change?: number;
    formal_registration?: boolean;
    // ... other feature adjustments
  };
  include_sensitivity?: boolean;      // Sensitivity analysis
}
```

**Response Schema**:

```typescript
interface WhatIfResponse {
  umkm_id: string;
  
  current_scenario: {
    credit_score: number;
    risk_classification: string;
    probability_default: number;
  };
  
  proposed_scenario: {
    credit_score: number;
    risk_classification: string;
    probability_default: number;
    change_from_current: {
      score_delta: number;            // e.g., +5.2
      pd_delta: number;               // e.g., -0.032
    };
  };
  
  impact_analysis: {
    recommendation_change: string;    // e.g., "High → Medium"
    decision_impact: string;          // Approval likelihood
    key_drivers: string[];            // Most influential changes
  };
  
  sensitivity?: {
    feature: string;
    elasticity: number;               // % score change per 1% feature change
  }[];
}
```

---

## Batch Endpoints

### POST /v1/batch/credit-scores

Process multiple UMKMs in a single request:

```bash
curl -X POST https://fa-geoumkm-api.azurewebsites.net/api/v1/batch/credit-scores \
  -H "X-API-Key: sk_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "umkm_ids": [
      "550e8400-e29b-41d4-a716-446655440000",
      "660e8400-e29b-41d4-a716-446655440001"
    ]
  }'
```

**Response**: Array of credit score responses

**Rate Limit**: 10 requests/min (higher batch sizes count as single request)

---

## Webhook Events

### Scoring Completion Webhook

When batch scoring completes, webhook POST to registered URL:

```json
{
  "event_type": "batch_scoring_completed",
  "batch_id": "batch_abc123",
  "timestamp": "2024-01-15T14:30:00Z",
  "status": "success",
  "results_url": "https://geosmart-api.../batch_abc123/results"
}
```

---

## Rate Limiting

### Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705334400
```

### Retry Logic

```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def create_session_with_retry():
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('https://', adapter)
    return session

session = create_session_with_retry()
response = session.post(
    'https://geosmart-api.../credit-score',
    headers={'X-API-Key': 'sk_live_abc123'},
    json={'umkm_id': '550e8400...'}
)
```

---

## Error Codes Reference

| Code | HTTP | Description | Retry |
|------|------|-------------|-------|
| INVALID_REQUEST | 400 | Malformed JSON or missing fields | No |
| INVALID_UMKM_ID | 400 | UMKM not found | No |
| UNAUTHORIZED | 401 | Invalid API key | No |
| FORBIDDEN | 403 | Insufficient permissions | No |
| NOT_FOUND | 404 | Resource not found | No |
| RATE_LIMITED | 429 | Rate limit exceeded | Yes (wait) |
| INTERNAL_ERROR | 500 | Server error | Yes (backoff) |
| SERVICE_UNAVAILABLE | 503 | Temporarily unavailable | Yes (backoff) |
| GATEWAY_TIMEOUT | 504 | Request timeout | Yes (backoff) |

---

## SDK Examples

### Python

```python
import geosmart_sdk

client = geosmart_sdk.GeoSmartClient(api_key='sk_live_abc123', role='bank')

# Credit score
score = client.get_credit_score(umkm_id='550e8400-...')
print(f"Score: {score.overall_credit_score}, Risk: {score.risk_classification}")

# Batch processing
results = client.batch_credit_scores(umkm_ids=['550e8400-...', '660e8400-...'])

# What-if analysis
whatif = client.whatif(
    umkm_id='550e8400-...',
    revenue_growth_change=0.05,
    employee_count_change=2
)
```

### JavaScript/TypeScript

```typescript
import { GeoSmartClient } from 'geosmart-sdk';

const client = new GeoSmartClient({
  apiKey: 'sk_live_abc123',
  role: 'bank'
});

// Credit score
const score = await client.getCreditScore({
  umkm_id: '550e8400-...',
  includeExplanation: true
});

// Recommendations
const recommendations = await client.getRecommendations({
  umkm_id: '550e8400-...',
  type: 'credit_product',
  topN: 3
});
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026 | Initial comprehensive API specification |


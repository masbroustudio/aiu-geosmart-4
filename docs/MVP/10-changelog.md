# 10 — Changelog & Version History

**Version:** 4.0  
**Last Updated:** 2026-06-02  
**Status:** Production Documentation  

---

## Overview

This document tracks all version changes for GeoUMKM Smart, from v3.0 (current with synthetic data) through v4.0 (production with LLM/RAG) and future roadmap versions. It serves as a migration guide for users upgrading between versions.

---

## Version 4.0 (June 2026) - Current Production Release

### New Features

#### 1. Azure OpenAI Chat Integration
**What**: Intelligent conversational AI for credit scoring insights  
**Why**: Users can ask natural language questions like "Why is this UMKM high risk?" instead of reading raw scores  
**How**: 
- `/api/v1/chat` endpoint
- RAG (Retrieval-Augmented Generation) knowledge base
- Powered by GPT-4 or GPT-4-Turbo
- Role-based responses (bank, government, investor perspectives)

**Documentation**: See 01-architecture.md Section 6, 05-api-specification.md Chat Endpoint

#### 2. RAG Knowledge Base
**What**: Indexed documentation of models, features, and insights for LLM retrieval  
**Components**:
- Feature importance (34 engineered features with SHAP explanations)
- Model performance metrics
- Cluster profiles (5-8 business segments)
- Policy frameworks (government context)

**Storage**: Azure AI Search (indexed for fast retrieval)

#### 3. Entra ID B2C Authentication (v4.0)
**What**: Enterprise-grade authentication replacing simple API keys  
**Benefits**:
- Single sign-on (SSO) across all users
- Multi-factor authentication (MFA) support
- Role-based access control (RBAC) at identity level
- Audit trail for compliance

**Backward Compatibility**: v3.0 API keys still work; Entra ID B2C is optional

#### 4. Enhanced API with `/chat` Endpoint
**New Endpoints**: 
- `POST /api/v1/chat` - Ask questions about UMKM scores
- `POST /api/v1/chat/stream` - Streaming responses for long-form answers

**Response Format**:
```json
{
  "query": "Why is UMKM_123 high credit risk?",
  "answer": "UMKM_123 has high credit risk (PD: 0.18) due to...",
  "confidence": 0.92,
  "sources": ["feature_importance", "cluster_profile_3"]
}
```

#### 5. v4.0 ML Pipeline Enhancement (Notebook 07)
**What**: New preprocessing stage for LLM/RAG integration  
**Output**: Knowledge base documents indexed to Azure AI Search  
**Benefits**: Chat queries return context-aware answers backed by model logic

#### 6. Updated Documentation Structure
**Before (v3.0)**: 
- Scattered docs with version mismatch (v3.0, v1.0 references)
- 5+ duplicate files
- Weak cross-references

**After (v4.0)**:
- Clean 00-10 numbering scheme (no duplicates)
- Unified v4.0 baseline across all docs
- Strong cross-references ("Related Docs" sections)
- 2 new docs: 08-testing-strategy.md, 10-changelog.md

### Breaking Changes

**None!** v4.0 is fully backward compatible with v3.0.
- Existing v3.0 API clients work unchanged
- Existing models (XGBoost, clustering) unchanged
- Database schema extended (not modified)

### Migration Path: v3.0 → v4.0

#### For Banks
```
Step 1: No action required
  • API keys continue to work
  • Credit scores unchanged
  
Step 2 (Optional): Enable Entra ID B2C
  • Contact admin for Azure AD setup
  • Migrate users to SSO
  • Decommission API keys after 6-month grace period
  
Step 3 (Optional): Adopt Chat Feature
  • Direct users to new `/chat` endpoint
  • Example: "Ask questions about your scores"
```

#### For Data Scientists
```
Step 1: Update ML pipeline environment
  • No changes to notebooks 01-06
  • Add Notebook 07 for LLM prep
  
Step 2: Index models for RAG
  • Run Notebook 07: LLM/RAG Preparation
  • Models uploaded to Azure AI Search
  
Step 3: Test knowledge base
  • Query Chat API with test questions
  • Verify SHAP explanations appear in responses
```

#### For DevOps
```
Step 1: Upgrade infrastructure
  • Deploy new Azure OpenAI service
  • Deploy Azure AI Search service
  • Update Azure Functions (Python 3.10+)
  
Step 2: Update deployment
  • New environment variables:
    OPENAI_API_KEY
    OPENAI_DEPLOYMENT_NAME
    AI_SEARCH_ENDPOINT
    AI_SEARCH_API_KEY
  
Step 3: Run smoke tests
  • Verify Chat endpoint responds
  • Verify credit score endpoints unchanged
```

### Performance Improvements
- API response time: <500ms (same)
- Chat response time: 2-5 seconds (new feature)
- Model inference: <100ms (same)

### Database Schema Changes
```sql
-- New table: llm_queries (audit trail for Chat API)
CREATE TABLE llm_queries (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  confidence FLOAT,
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Existing tables unchanged (backward compatible)
```

---

## Version 3.0 (January 2026) - Previous Release

### Features
- 4 ML models (credit risk, location scoring, clustering, recommendations)
- 34 engineered features
- REST API (5 primary endpoints)
- React dashboard
- Azure Functions deployment
- PostgreSQL database
- Synthetic UMKM data (10k records)

### Deployment
- Azure infrastructure
- GitHub Actions CI/CD
- Static Web Apps frontend
- Application Insights monitoring

### Known Limitations
- Synthetic data only (real integration Q2 2026)
- Simple API key authentication
- No chat/RAG features
- Limited documentation cross-references

---

## Future Roadmap

### Version 4.1 (Q3 2026)
- [ ] Real UMKM data integration (bank partnerships)
- [ ] Advanced analytics dashboard
- [ ] Batch scoring API (1000s of UMKMs)
- [ ] Geospatial heatmap visualization

### Version 4.2 (Q4 2026)
- [ ] Mobile app (iOS/Android)
- [ ] Offline credit scoring (for remote branches)
- [ ] Multi-language support (English + Indonesian)
- [ ] Government reporting module

### Version 5.0 (2027 Roadmap)
- [ ] Blockchain verification (optional)
- [ ] Real-time data streaming (from bank systems)
- [ ] Micro-service architecture (scale independent components)
- [ ] International expansion (Southeast Asia)

---

## Version Control Best Practices

### Tagging
All releases tagged as: `v4.0`, `v4.0.1`, `v4.0.2` (semantic versioning)

### Documentation Updates
- Major version: Update all docs
- Minor version: Update affected sections
- Patch: Update only bug fixes/clarifications

### Deployment Strategy
- Blue-green deployment (two identical production environments)
- Canary releases (1% of traffic to v4.0 before full rollout)
- Rollback plan (maintain v3.0 until v4.0 stable)

---

## Support Matrix

| Version | Status | End of Life | Support Level |
|---------|--------|------------|---|
| v3.0 | Maintained | 2026-12-31 | Security fixes only |
| v4.0 | Current | 2027-12-31 | Full support |
| v4.1+ | Future | TBD | Roadmap planned |

### Getting Help
- **v3.0 issues**: File GitHub issue with `[v3.0]` tag
- **v4.0 issues**: File GitHub issue with `[v4.0]` tag
- **Migration help**: Email devops@geoumkm-smart.com

---

## Summary: Why v4.0?

**Problem**: Users struggle to interpret raw model scores (PD: 0.18 = "high risk" but why?)

**Solution**: Azure OpenAI Chat + RAG knowledge base provides:
- ✅ Natural language explanations
- ✅ Feature importance context (SHAP values)
- ✅ Similar cases from history
- ✅ Actionable recommendations

**Result**: Better decisions for banks, government, investors

---

**Document Status**: Production v4.0  
**Last Updated**: 2026-06-02  
**Owner**: Product & Release Management

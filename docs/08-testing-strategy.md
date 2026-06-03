# 08 — Testing Strategy & Quality Assurance

**Version:** 4.0  
**Last Updated:** 2026-06-02  
**Status:** Production Documentation  

---

## Purpose

This document outlines the comprehensive testing strategy for GeoUMKM Smart across all environments (local, staging, production). It covers unit testing, integration testing, end-to-end testing, performance testing, and continuous integration/deployment practices.

---

## Executive Summary

GeoUMKM Smart testing follows a **pyramid approach**:
- 🟢 **Unit Tests** (70%): Fast, focused tests of individual components
- 🟡 **Integration Tests** (20%): Test component interactions
- 🔴 **E2E Tests** (10%): Full user workflows

**Quality Gates**:
- Unit test coverage: ≥80%
- All tests must pass before merge
- Performance: API response <1 second, 99.9% availability
- Security: Annual penetration testing

---

## 1. Unit Testing

### Python Backend (API & ML Pipeline)

**Framework**: pytest  
**Coverage Target**: ≥85%  
**Execution Time**: <5 seconds

#### Test Structure
```
tests/
├── unit/
│   ├── api/
│   │   ├── test_credit_score_endpoint.py
│   │   ├── test_auth.py
│   │   └── test_rate_limiting.py
│   ├── models/
│   │   ├── test_xgboost_credit_risk.py
│   │   ├── test_clustering.py
│   │   └── test_recommendations.py
│   └── pipeline/
│       ├── test_feature_engineering.py
│       ├── test_data_validation.py
│       └── test_model_registry.py
├── fixtures/
│   ├── sample_data.py
│   └── mock_models.py
└── conftest.py
```

#### Example Tests
```python
# test_credit_score_endpoint.py
import pytest
from app.api import credit_score_endpoint

@pytest.fixture
def sample_umkm_data():
    return {
        "umkm_id": "test_123",
        "kecamatan": "Bandung Wetan",
        "sektor": "retail",
        "features": {...}
    }

def test_credit_score_returns_valid_pd(sample_umkm_data):
    """Test that credit score endpoint returns valid PD (0-1)"""
    response = credit_score_endpoint(sample_umkm_data)
    assert 0 <= response['pd_estimate'] <= 1
    assert response['risk_bucket'] in ['very_low', 'low', 'medium', 'high', 'very_high']

def test_credit_score_requires_auth(sample_umkm_data):
    """Test that endpoint requires authentication"""
    response = credit_score_endpoint(sample_umkm_data, auth_token=None)
    assert response.status_code == 401

@pytest.mark.performance
def test_credit_score_under_100ms(sample_umkm_data):
    """Test that endpoint responds in <100ms"""
    import time
    start = time.time()
    response = credit_score_endpoint(sample_umkm_data)
    elapsed = (time.time() - start) * 1000
    assert elapsed < 100, f"Response too slow: {elapsed}ms"
```

### React Frontend

**Framework**: Jest + React Testing Library  
**Coverage Target**: ≥80%  
**Execution Time**: <10 seconds

```typescript
// components/__tests__/ScoreCard.test.tsx
import { render, screen } from '@testing-library/react';
import ScoreCard from '../ScoreCard';

describe('ScoreCard', () => {
  it('displays credit score', () => {
    const score = { pd: 0.15, risk_bucket: 'medium' };
    render(<ScoreCard score={score} />);
    expect(screen.getByText(/Medium Risk/i)).toBeInTheDocument();
  });

  it('shows warning for high risk', () => {
    const score = { pd: 0.35, risk_bucket: 'high' };
    render(<ScoreCard score={score} />);
    expect(screen.getByRole('img', { name: /warning/i })).toBeInTheDocument();
  });
});
```

---

## 2. Integration Testing

### API Integration Tests

**Framework**: pytest + requests  
**Coverage**: API endpoints + database  
**Execution Time**: 30-60 seconds

```python
# tests/integration/test_api_credit_score.py
@pytest.mark.integration
def test_credit_score_with_database(db_session):
    """Test credit score endpoint with real database"""
    # Setup: Insert test UMKM into DB
    test_umkm = UMKM(
        id="test_123",
        kecamatan_id=1,
        employees=5,
        revenue_growth=0.15
    )
    db_session.add(test_umkm)
    db_session.commit()
    
    # Action: Call API
    response = client.post('/api/v1/credit-score', json={
        'umkm_id': 'test_123'
    })
    
    # Assert: Verify response
    assert response.status_code == 200
    data = response.json()
    assert data['umkm_id'] == 'test_123'
    assert 'pd_estimate' in data
```

### ML Pipeline Integration

```python
# tests/integration/test_ml_pipeline.py
@pytest.mark.integration
def test_full_pipeline_execution(sample_data_path):
    """Test entire ML pipeline from data import to model registry"""
    from notebooks import nb01_import, nb02_eda, nb03_features, nb04_select
    from notebooks import nb05_train, nb06_cluster, nb07_validate, nb08_registry
    
    # Execute pipeline sequentially
    data = nb01_import.run(sample_data_path)
    cleaned_data = nb02_eda.run(data)
    features = nb03_features.run(cleaned_data)
    selected_features = nb04_select.run(features)
    models = nb05_train.run(selected_features)
    clusters = nb06_cluster.run(selected_features)
    validation = nb07_validate.run(models)
    registry = nb08_registry.run(models, validation)
    
    # Assertions
    assert models['credit_risk'].test_auc > 0.85
    assert clusters is not None
    assert len(registry) == 4  # 4 models registered
```

---

## 3. End-to-End (E2E) Testing

### User Workflows

**Framework**: Playwright + pytest  
**Coverage**: Full user journeys  
**Environments**: Local, Staging, Production  
**Execution Time**: 2-5 minutes

```python
# tests/e2e/test_bank_credit_scoring.py
@pytest.mark.e2e
async def test_bank_user_score_umkm():
    """Test complete bank user journey: login → search → view score"""
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Step 1: Navigate to dashboard
        await page.goto('https://app.geoumkm-smart.com')
        
        # Step 2: Login as bank user
        await page.fill('[data-testid="email"]', 'bank@example.com')
        await page.fill('[data-testid="password"]', 'securepass')
        await page.click('[data-testid="login-btn"]')
        await page.wait_for_load_state('networkidle')
        
        # Step 3: Search UMKM
        await page.fill('[data-testid="search-box"]', 'UMKM_12345')
        await page.click('[data-testid="search-btn"]')
        await page.wait_for_selector('[data-testid="score-card"]')
        
        # Step 4: Verify score displayed
        score_text = await page.text_content('[data-testid="risk-level"]')
        assert 'High Risk' in score_text or 'Low Risk' in score_text
        
        await browser.close()
```

### Staging Environment E2E
- Run against staging Azure infrastructure
- Test with staging data
- Verify with actual API

---

## 4. Performance Testing

### Load Testing

**Tool**: Locust  
**Target**: 100 concurrent users, <1 second response time

```python
# tests/performance/locustfile.py
from locust import HttpUser, task, between

class CreditScoringUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Authenticate once per user
        self.client.headers.update({
            "Authorization": f"Bearer {get_test_token()}"
        })
    
    @task(3)
    def score_credit(self):
        """Score a random UMKM"""
        umkm_id = self.get_random_umkm()
        self.client.post('/api/v1/credit-score', json={
            'umkm_id': umkm_id
        })
    
    @task(1)
    def search_location(self):
        """Score a location"""
        self.client.get('/api/v1/location-score?kecamatan=Bandung')
    
    def get_random_umkm(self):
        return f"umkm_{random.randint(1, 100000)}"

# Run with:
# locust -f locustfile.py --host=https://api.geoumkm-smart.com --users=100
```

### Response Time SLAs
- 99th percentile: <1 second
- 95th percentile: <500ms
- 50th percentile: <200ms

---

## 5. Security Testing

### Security Checklist
- [ ] SQL injection tests (all inputs validated)
- [ ] XSS prevention (all outputs escaped)
- [ ] Authentication bypass attempts
- [ ] RBAC enforcement (bank can't access government data)
- [ ] API key validation
- [ ] Rate limiting enforcement
- [ ] CORS configuration
- [ ] Secrets not in logs/errors

### Example
```python
@pytest.mark.security
def test_sql_injection_protection():
    """Verify SQL injection is blocked"""
    injection_payload = "' OR '1'='1"
    response = client.post('/api/v1/search', json={
        'query': injection_payload
    })
    assert response.status_code == 400
    assert 'Invalid input' in response.json()['message']
```

---

## 6. CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - run: pip install -r requirements-test.txt
      - run: pytest tests/unit --cov=app --cov-report=xml
      - uses: codecov/codecov-action@v2

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v2
      - run: pip install -r requirements-test.txt
      - run: pytest tests/integration

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci && npm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: pip install pytest-playwright locust
      - run: pytest tests/e2e --environment=staging
```

### Test Gates
- ✅ All unit tests pass (100%)
- ✅ Integration tests pass
- ✅ Code coverage ≥85%
- ✅ No security vulnerabilities (SAST)
- ✅ All lint checks pass

---

## 7. Testing by Environment

| Environment | Unit | Integration | E2E | Load | Security |
|-------------|------|-------------|-----|------|----------|
| **Local** | ✅ Daily | ✅ Before PR | - | - | ✅ Quarterly |
| **Staging** | ✅ On merge | ✅ On merge | ✅ On release | ✅ Weekly | ✅ Monthly |
| **Production** | ✅ Pre-deploy | ✅ Pre-deploy | - | ✅ Daily | ✅ Continuous |

---

## 8. Test Metrics & Reporting

### Coverage Dashboard
- Unit test coverage: Target ≥85%
- Integration test coverage: Target ≥70%
- E2E scenario coverage: Target ≥60%

### Weekly Report
- Test execution time
- Pass/fail rates
- New bugs found
- Performance trends

---

## Quick Start: Running Tests Locally

```bash
# All tests
pytest

# Unit tests only (fast, <5 seconds)
pytest tests/unit -v

# Integration tests (60 seconds)
pytest tests/integration -v

# E2E tests (5 minutes)
pytest tests/e2e -v --environment=local

# With coverage
pytest --cov=app --cov-report=html

# Specific test
pytest tests/unit/api/test_credit_score.py::test_credit_score_under_100ms -v
```

---

**Document Status**: Production v4.0  
**Last Updated**: 2026-06-02  
**Owner**: QA & Development Team

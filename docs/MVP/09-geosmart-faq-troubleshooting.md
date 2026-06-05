# GeoUMKM Smart - FAQ & Troubleshooting

**Version:** 4.0
**Last Updated:** 2026 
**Status:** Production Documentation

## Purpose

This document provides quick answers to frequently asked questions and solutions to common problems encountered when working with GeoUMKM Smart. It covers development, deployment, operations, and business questions.

---

## Table of Contents

1. [General Questions](#general-questions)
2. [Development Setup Issues](#development-setup-issues)
3. [Notebook Execution Problems](#notebook-execution-problems)
4. [Model Training & Validation](#model-training--validation)
5. [API Issues](#api-issues)
6. [Dashboard & Frontend](#dashboard--frontend)
7. [Database Problems](#database-problems)
8. [Deployment Issues](#deployment-issues)
9. [Performance & Optimization](#performance--optimization)
10. [Business & Data Questions](#business--data-questions)

---

## General Questions

### Q: What is GeoUMKM Smart?

**A:** GeoUMKM Smart is an AI-powered credit risk and opportunity scoring system for Indonesian MSMEs (Micro, Small, and Medium Enterprises). It combines:
- Geospatial data (location, infrastructure)
- Economic indicators (revenue, profitability)
- Business characteristics (employees, formal registration)
- ML models to predict credit risk, identify opportunities, and segment markets

**Use cases:**
- Banks: Credit decision support
- Government: Policy-making and resource allocation
- Investors: Opportunity identification

---

### Q: Who should use this system?

**A:** Three primary user groups:
1. **Banks**: Loan officers, risk managers, credit analysts
2. **Government**: Ministry officials, policy makers, development agencies (OJK, BI)
3. **Investors**: Portfolio managers, business development officers

Each has role-based access to different features via the API and dashboard.

---

### Q: What models does the system use?

**A:** Four complementary ML models:

| Model | Purpose | Output |
|-------|---------|--------|
| Location Scoring | Geographic opportunity assessment | 0-100 score |
| Credit Risk | UMKM default probability | 5 risk buckets + PD |
| Clustering | Business market segmentation | 5-8 clusters |
| Recommendations | Personalized suggestions | Top 3-5 recs |

See **[Models Guide](06-geosmart-models-guide.md)** for details.

---

### Q: What languages are supported?

**A:** 
- **Backend**: Python 3.10+
- **Frontend**: JavaScript/TypeScript (React)
- **Database**: SQL (PostgreSQL)
- **Infrastructure**: YAML (Azure config)
- **Documentation**: English (with Indonesian context)

Future versions may support Indonesian language UI.

---

### Q: How frequently should models be retrained?

**A:** 
- **Monthly**: Refresh predictions and scores
- **Quarterly**: Full model retraining with new data
- **Event-driven**: After policy changes or market disruptions

Monitor model performance metrics via Application Insights dashboard.

---

## Development Setup Issues

### Q: I'm getting "ModuleNotFoundError" when running the API

**A:** The virtual environment isn't activated or dependencies aren't installed.

**Solution:**
```bash
# 1. Activate Conda environment
conda activate geosmart

# 2. Verify you're in correct environment
which python  # Should show geosmart path

# 3. Reinstall dependencies
cd api/
pip install -r requirements.txt --force-reinstall

# 4. Verify installation
python -c "import fastapi; import xgboost; print('OK')"
```

---

### Q: Database connection failing with "connection refused"

**A:** PostgreSQL isn't running or connection string is incorrect.

**Diagnosis:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS
docker ps | grep postgres  # Docker

# Check connection string
cat .env | grep DATABASE_URL

# Test connection directly
psql -h localhost -U geosmart -d geosmart_dev -c "SELECT 1"
```

**Solution:**
```bash
# Start PostgreSQL if not running
docker-compose up -d postgres-geosmart
# OR
brew services start postgresql

# Verify connection works
psql -h localhost -U geosmart -d geosmart_dev -c "SELECT COUNT(*) FROM umkm;"
```

---

### Q: "Address already in use" error for port 8000

**A:** Another process is already using port 8000.

**Solution:**
```bash
# Find process using port
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use different port
uvicorn main:app --reload --port 8001

# Update .env if needed
REACT_APP_API_URL=http://localhost:8001/api
```

---

### Q: npm install failing with permission errors

**A:** Node modules permissions issue.

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still failing, check permissions
sudo chown -R $USER:$USER ~/.npm
```

---

### Q: "Redis connection refused"

**A:** Redis service isn't running.

**Solution:**
```bash
# Using Docker
docker-compose up -d redis-geosmart

# OR using Homebrew (macOS)
brew services start redis

# Verify Redis is accessible
redis-cli ping  # Should respond with PONG
```

---

## Notebook Execution Problems

### Q: Notebook 01-data-import fails with "FileNotFoundError"

**A:** Input data files not found or incorrect path configuration.

**Diagnosis:**
```bash
# Check data directory structure
ls -la data/

# Verify file exists
ls -la data/raw/umkm_data.csv

# Check path in notebook
# Cell 1: Check DATA_PATH variable
```

**Solution:**
```bash
# 1. Download/prepare raw data files
wget https://source.com/umkm_data.csv -O data/raw/umkm_data.csv

# 2. Or generate sample data
python scripts/generate_sample_data.py

# 3. Update DATA_PATH in notebook if needed
DATA_PATH = "./data"  # Should match file location
```

---

### Q: Notebook 03-feature-engineering hangs or runs out of memory

**A:** Dataset too large or memory inefficient processing.

**Solutions:**
```bash
# 1. Use sample data for development
# In notebook:
df = df.head(10000)  # Process subset

# 2. Use chunked processing
chunks = [df[i:i+10000] for i in range(0, len(df), 10000)]
for chunk in chunks:
    process_chunk(chunk)

# 3. Increase system memory
# Docker: Update docker-compose.yml
# Increase `mem_limit` for jupyter service

# 4. Profile memory usage
%memit df.groupby('sektor').size()

# 5. Use Dask for parallel processing
import dask.dataframe as dd
ddf = dd.read_csv('data.csv')
result = ddf.groupby('sektor').mean().compute()
```

---

### Q: Notebook 05-model-training produces poor performance (low AUC)

**A:** Feature selection issue, class imbalance, or inadequate training.

**Diagnosis:**
```python
# Check feature importance
feature_importance = model.feature_importances_
low_importance_features = feature_importance < 0.01
print(f"Features with low importance: {low_importance_features.sum()}")

# Check class distribution
print(y_train.value_counts(normalize=True))

# Evaluate on validation set
from sklearn.metrics import roc_auc_score
val_auc = roc_auc_score(y_val, model.predict_proba(X_val)[:, 1])
print(f"Validation AUC: {val_auc}")
```

**Solutions:**
```python
# 1. Address class imbalance
from sklearn.utils import class_weight
class_weights = class_weight.compute_class_weight(
    'balanced',
    classes=np.unique(y_train),
    y=y_train
)
model = XGBClassifier(scale_pos_weight=class_weights[1]/class_weights[0])

# 2. Improve feature selection
from sklearn.feature_selection import SelectKBest, f_classif
selector = SelectKBest(f_classif, k=20)
X_selected = selector.fit_transform(X_train, y_train)

# 3. Tune hyperparameters
from sklearn.model_selection import GridSearchCV
param_grid = {'max_depth': [4, 5, 6], 'learning_rate': [0.05, 0.1]}
grid = GridSearchCV(XGBClassifier(), param_grid)
grid.fit(X_train, y_train)
print(f"Best params: {grid.best_params_}")

# 4. Increase training data
# Ensure sufficient labeled default examples
print(f"Training set size: {len(y_train)}")
# Should be >50k for robust models
```

---

### Q: Notebook 06-clustering produces unexpected clusters

**A:** Feature scaling issue or suboptimal k value.

**Diagnosis:**
```python
# Visualize silhouette scores
from sklearn.metrics import silhouette_samples
silhouette_vals = silhouette_samples(X_scaled, kmeans_labels)
print(f"Mean Silhouette Score: {silhouette_vals.mean()}")

# Check cluster sizes
print(pd.Series(kmeans_labels).value_counts().sort_index())
```

**Solutions:**
```python
# 1. Ensure proper scaling
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 2. Find optimal k
from sklearn.metrics import silhouette_score
scores = []
for k in range(2, 11):
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    scores.append(silhouette_score(X_scaled, kmeans.fit_predict(X_scaled)))
optimal_k = scores.index(max(scores)) + 2
print(f"Optimal k: {optimal_k}")

# 3. Use hybrid K-Means + DBSCAN
from sklearn.cluster import DBSCAN
dbscan = DBSCAN(eps=0.5, min_samples=5)
dbscan_labels = dbscan.fit_predict(X_scaled)
```

---

## Model Training & Validation

### Q: Model validation shows very high training accuracy but lower test accuracy

**A:** Classic overfitting problem.

**Solution:**
```python
# 1. Increase regularization
model = XGBClassifier(
    gamma=2,                # Increase L2 regularization
    min_child_weight=2,
    subsample=0.7,          # Reduce row sampling
    colsample_bytree=0.7    # Reduce column sampling
)

# 2. Reduce model complexity
max_depth=4  # Instead of 8
n_estimators=100  # Instead of 500

# 3. Increase training data
# Add more labeled examples
print(f"Current training set: {len(y_train)}")
# Target: >100k samples for UMKM

# 4. Cross-validation
from sklearn.model_selection import cross_val_score
cv_scores = cross_val_score(model, X_train, y_train, cv=5)
print(f"Cross-val scores: {cv_scores}")
print(f"Mean: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
```

---

### Q: How do I interpret SHAP values?

**A:** SHAP (SHapley Additive exPlanations) shows feature contribution to predictions.

**Example:**
```python
import shap

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

# Force plot for single prediction
shap.force_plot(explainer.expected_value, shap_values[0], X_test.iloc[0])

# Output:
# Base value (average prediction): 0.15
# +0.08 ← Feature X increased prediction (red)
# -0.03 ← Feature Y decreased prediction (blue)
# Final prediction: 0.20
```

**Interpretation:**
- Red features: Increase score/risk
- Blue features: Decrease score/risk
- Magnitude: Strength of contribution

---

### Q: How to perform backtesting?

**A:** Validate model against historical data.

```python
# Backtesting framework
for year in [2021, 2022, 2023]:
    # Get data from specific year
    train_data = data[data['year'] < year]
    test_data = data[data['year'] == year]
    
    # Train model
    model = XGBClassifier()
    model.fit(X_train, y_train)
    
    # Evaluate on historical year
    predictions = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, predictions)
    print(f"Year {year} AUC: {auc:.3f}")

# Expected: Consistent AUC across years (±0.05)
# If degrading: Model drift detected → Retrain
```

---

## API Issues

### Q: API returns 401 "Unauthorized" error

**A:** API key is invalid, expired, or not included.

**Diagnosis:**
```bash
# Check API key format
echo $API_KEY  # Should start with "sk_live_" or "sk_test_"

# Verify header is included
curl -i -X POST http://localhost:8000/api/v1/credit-score \
  -H "X-API-Key: $API_KEY"

# Check if key exists in database
psql -h localhost -U geosmart -d geosmart_dev \
  -c "SELECT * FROM api_keys WHERE key='sk_live_xxx';"
```

**Solution:**
```bash
# 1. Generate new API key
python scripts/generate_api_key.py --role bank --name "Test Bank"

# 2. Add to headers
curl -X POST http://localhost:8000/api/v1/credit-score \
  -H "X-API-Key: sk_live_abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{"umkm_id": "..."}'

# 3. Verify in Azure Key Vault (production)
az keyvault secret show --vault-name kv-geosmart-prod --name ApiKeyTest
```

---

### Q: API response is slow (>2000ms)

**A:** Model loading or database query is bottleneck.

**Diagnosis:**
```python
# Check response time in logs
# Application Insights → Performance

# Profile specific endpoint
import time
start = time.time()
result = model_xgb.predict_proba(features)
print(f"Model inference: {(time.time() - start)*1000:.0f}ms")

# Check database query time
# PostgreSQL logs → slow_query_log
```

**Solutions:**
```python
# 1. Cache model in memory (not reload each request)
# In app startup:
global MODEL
MODEL = joblib.load('model.pkl')

# 2. Cache frequently accessed data
# Use Redis for hot data
import redis
r = redis.Redis()
cached_score = r.get(f"score:{umkm_id}")
if cached_score:
    return json.loads(cached_score)

# 3. Optimize database queries
# Add indexes:
CREATE INDEX idx_features_umkm ON features(umkm_id);
CREATE INDEX idx_scores_date ON credit_scores(scored_at);

# 4. Use connection pooling
# In API config:
database.pool_size = 20
database.max_overflow = 10
```

---

### Q: API returns 429 "Rate Limited"

**A:** Too many requests in short time.

**Solution:**
```bash
# Check rate limit headers
curl -i -X POST http://localhost:8000/api/v1/credit-score \
  -H "X-API-Key: sk_live_abc123"

# Response headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 45
# X-RateLimit-Reset: 1705334400

# Implement exponential backoff in client
import time
import random

max_retries = 3
for attempt in range(max_retries):
    try:
        response = requests.post(endpoint, headers=headers)
        if response.status_code == 429:
            wait_time = 2 ** attempt + random.random()  # Exponential backoff
            time.sleep(wait_time)
            continue
        return response
    except Exception as e:
        if attempt < max_retries - 1:
            time.sleep(2 ** attempt)
```

---

### Q: What-if (scenario analysis) endpoint not working

**A:** May be feature mismatch or invalid scenario parameters.

**Diagnosis:**
```python
# Verify request format
scenario = {
    "revenue_growth_change": 0.05,  # Absolute change
    "employee_count_change": 2,
    "digital_adoption_change": 0.1
}

# Check if feature names match training features
print(features.columns.tolist())

# Verify change values are reasonable
for feature, change in scenario.items():
    print(f"{feature}: {change}")
```

**Solution:**
```bash
# Correct request format
curl -X POST http://localhost:8000/api/v1/whatif \
  -H "X-API-Key: sk_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "umkm_id": "550e8400-...",
    "scenario": {
      "revenue_growth_change": 0.05,
      "employee_count_change": 2
    }
  }'
```

---

## Dashboard & Frontend

### Q: Dashboard won't load - blank page

**A:** Frontend build issue or API connection problem.

**Diagnosis:**
```bash
# 1. Check browser console for errors
# Open: DevTools → Console tab

# 2. Check network requests
# DevTools → Network tab
# Look for failed requests to /api/...

# 3. Verify API is running
curl http://localhost:8000/api/v1/health
# Should return: {"status":"healthy"}

# 4. Check frontend build
npm run build
# Should complete without errors
```

**Solutions:**
```bash
# 1. Rebuild frontend
cd frontend/
npm install
npm run build

# 2. Verify API URL in .env
REACT_APP_API_URL=http://localhost:8000/api

# 3. Restart services
docker-compose down
docker-compose up -d

# 4. Clear browser cache
# Chrome: Cmd+Shift+Delete
# Firefox: Cmd+Shift+Delete
# Safari: Develop → Empty Caches
```

---

### Q: Login not working - "Invalid credentials"

**A:** Test user doesn't exist or password mismatch.

**Solution:**
```bash
# Create test user
psql -h localhost -U geosmart -d geosmart_dev

INSERT INTO users (email, password_hash, role, organization)
VALUES (
  'test@bank.com',
  'bcrypt_hash_of_password123',  -- Use bcrypt for hashing
  'bank',
  'Test Bank'
);

# Or use admin script
python scripts/create_user.py \
  --email test@bank.com \
  --password password123 \
  --role bank

# Default test credentials
# Email: test@bank.com
# Password: password123
```

---

### Q: Map visualization not working

**A:** Leaflet/Mapbox API key missing or geospatial data unavailable.

**Solution:**
```bash
# 1. Add map API key
# In frontend/.env:
REACT_APP_MAPBOX_KEY=pk_test_xxx

# 2. Verify geospatial data exists
psql -h localhost -U geosmart -d geosmart_dev \
  -c "SELECT COUNT(*) FROM features WHERE latitude IS NOT NULL;"

# Should return >0

# 3. Check map component
# frontend/src/components/Map.tsx
// Verify API key usage
const token = process.env.REACT_APP_MAPBOX_KEY;
```

---

## Database Problems

### Q: Database running out of disk space

**A:** Logs, backups, or large tables consuming space.

**Diagnosis:**
```bash
# Check database size
psql -h localhost -U geosmart -d geosmart_dev -c "
  SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
  FROM pg_tables
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 10;
"

# Check disk usage
df -h /var/lib/postgresql/data  # Linux
du -sh /var/lib/postgresql/data  # macOS
```

**Solutions:**
```sql
-- 1. Archive old predictions (>1 year)
DELETE FROM credit_scores WHERE scored_at < CURRENT_DATE - INTERVAL '1 year';

-- 2. Vacuum and analyze
VACUUM ANALYZE;

-- 3. Clear old audit logs
DELETE FROM audit_logs WHERE timestamp < CURRENT_DATE - INTERVAL '1 year';

-- 4. Increase disk allocation (cloud)
-- Azure: Scale up storage in PostgreSQL settings
```

---

### Q: Slow database queries

**A:** Missing indexes or suboptimal query plans.

**Diagnosis:**
```sql
-- Enable query logging
SET log_statement = 'all';
SET log_min_duration_statement = 1000;  -- Log queries > 1 second

-- Analyze query plan
EXPLAIN ANALYZE SELECT * FROM features WHERE umkm_id = '...';

-- View slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

**Solutions:**
```sql
-- Create indexes on frequently queried columns
CREATE INDEX idx_features_umkm ON features(umkm_id);
CREATE INDEX idx_scores_date ON credit_scores(scored_at);
CREATE INDEX idx_umkm_sektor ON umkm(sektor_ekonomi);

-- Optimize frequently used queries
-- Instead of:
SELECT * FROM umkm WHERE sektor_ekonomi = 'retail';

-- Add indexes and use LIMIT:
SELECT id, nama, sektor_ekonomi FROM umkm 
WHERE sektor_ekonomi = 'retail' LIMIT 1000;

-- Use VACUUM to optimize
VACUUM ANALYZE;
```

---

## Deployment Issues

### Q: Azure Functions deployment fails

**A:** Authentication or code syntax issue.

**Diagnosis:**
```bash
# Check deployment logs
az functionapp deployment log show \
  --resource-group rg-geosmart-prod \
  --name fa-geosmart-api

# Check function status
az functionapp show \
  --resource-group rg-geosmart-prod \
  --name fa-geosmart-api \
  --query state
```

**Solutions:**
```bash
# 1. Verify authentication
az login
az account show

# 2. Test locally
func start  # Should run on localhost:7071

# 3. Check Python version compatibility
python --version  # Should be 3.10+

# 4. Deploy with verbose logging
func azure functionapp publish fa-geosmart-api --build remote -v

# 5. Check Application Insights logs
az monitor app-insights metrics show \
  --resource-group rg-geosmart-prod \
  --app ai-geosmart \
  --metric requests/failed
```

---

### Q: Static Web App deployment stuck

**A:** CI/CD pipeline issue or branch protection rules.

**Solution:**
```bash
# 1. Check GitHub Actions status
# In repo: Actions tab → Check recent runs

# 2. Verify branch permissions
# Settings → Branches → Branch protection rules
# Ensure "Require status checks" isn't blocking

# 3. Manually trigger deployment
git push origin main  # Force push if needed

# 4. Check Azure SWA deployment status
az staticwebapp show \
  --resource-group rg-geosmart-prod \
  --name swa-geosmart-dashboard \
  --query "repositoryUrl"
```

---

## Performance & Optimization

### Q: How to improve model inference speed?

**A:** Use model quantization, caching, and batch processing.

```python
# 1. Quantize model
import onnx
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

initial_type = [('float_input', FloatTensorType([None, 22]))]
onnx_model = convert_sklearn(model_xgb, initial_types=initial_type)
with open('model.onnx', 'wb') as f:
    f.write(onnx_model.SerializeToString())

# 2. Use batch inference
def batch_predict(features_list):
    X_batch = pd.concat(features_list, axis=0)
    predictions = model.predict_proba(X_batch)
    return predictions

# 3. Implement caching
from functools import lru_cache

@lru_cache(maxsize=10000)
def get_score(umkm_id):
    # Fetch and cache score
    pass

# 4. Async processing
async def predict_async(umkm_id):
    return await model.predict(umkm_id)
```

---

### Q: How to scale to 1M+ UMKM records?

**A:** Distributed computing and data partitioning.

```python
# 1. Use Dask for distributed processing
import dask.dataframe as dd

ddf = dd.read_parquet('features_*.parquet')
result = ddf.groupby('sektor').mean().compute()

# 2. Partition data by geography
for province in provinces:
    data_subset = data[data['provinsi'] == province]
    train_model(data_subset)

# 3. Stream processing
from kafka import KafkaConsumer

consumer = KafkaConsumer('umkm-events')
for message in consumer:
    umkm_data = json.loads(message.value)
    score = predict(umkm_data)
    # Stream results to sink

# 4. Database partitioning
CREATE TABLE credit_scores_2024 PARTITION OF credit_scores
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

---

## Business & Data Questions

### Q: How accurate are credit scores?

**A:** Model achieves ~87% AUC on test set. Context-dependent accuracy.

**Details:**
- **Precision**: 82% (of predicted defaults, 82% correct)
- **Recall**: 75% (captures 75% of actual defaults)
- **F1-Score**: 0.785

**Caveats:**
- Model trained on historical data
- May not capture novel default patterns
- Should supplement, not replace, human judgment
- Requires domain expert review for edge cases

---

### Q: How to interpret credit risk scores?

**A:** Scores map to 5 risk buckets:

```
Very Low (0.00-0.05 PD):  75-100 points  → Approve
Low (0.05-0.10 PD):      60-74 points   → Likely approve
Medium (0.10-0.20 PD):   40-59 points   → Conditional review
High (0.20-0.40 PD):     20-39 points   → Likely decline
Very High (>0.40 PD):    0-19 points    → Decline

PD = Probability of Default (0-1 scale)
```

---

### Q: How is location score calculated?

**A:** XGBoost regression on geographic and economic features.

**Key factors:**
- Business density (UMKM per km²)
- Road quality and accessibility
- Electricity reliability
- Digital payment adoption
- Infrastructure availability

**Top factor**: Business density (15.6% importance)

---

### Q: What data is required for accurate predictions?

**A:** Minimum data for credit scoring:

| Category | Required | Optional |
|----------|----------|----------|
| Financial | Revenue, expenses, debt | Detailed P&L |
| Business | Employee count, sector, age | Supplier diversity |
| Geographic | Latitude/longitude | Infrastructure data |
| Registration | Formal registration status | Tax compliance |

**Data quality requirement:** >90% completeness for critical fields

---

### Q: How to ensure data privacy?

**A:** Multiple security layers:

1. **At rest**: Encryption using AES-256
2. **In transit**: TLS 1.2+
3. **In database**: Role-based access control
4. **In logs**: PII masking
5. **Retention**: Data deleted per policy (3-10 years)

See **[Deployment](07-geosmart-deployment.md)** for security architecture.

---

### Q: Can the system handle real-time scoring?

**A:** Yes, API optimized for <1 second responses.

**Capability:**
- Single UMKM: ~500ms (model inference)
- Batch (100 UMKM): ~2 seconds
- Bulk (10k+): Use batch endpoints

**Requirements:**
- Sufficient API instances (auto-scaling configured)
- Database connection pooling
- Model caching in memory


---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026 | Initial comprehensive FAQ & troubleshooting |

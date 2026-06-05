# GeoUMKM Smart - Local Development Setup

**Version:** 4.0
**Last Updated:** 2026  
**Status:** Production Documentation

## Purpose

This document provides step-by-step instructions for setting up GeoUMKM Smart development environment on your local machine. It covers all prerequisites, installation steps, configuration, and troubleshooting.

---

## System Requirements

### Hardware
- **CPU**: Multi-core processor (4+ cores recommended)
- **RAM**: 16 GB minimum (32 GB recommended for full pipeline)
- **Disk Space**: 50 GB free (for datasets and models)
- **Network**: Stable internet connection

### Supported Operating Systems
- macOS 11.0+
- Ubuntu 20.04 LTS+
- Windows 10/11 with WSL 2

---

## Prerequisites Installation

### 1. Git & Version Control

```bash
# Verify Git installation
git --version  # Should be 2.30+

# If not installed:
# macOS: brew install git
# Ubuntu: sudo apt-get install git
# Windows: Download from https://git-scm.com/

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 2. Python & Conda

```bash
# Install Miniconda (lightweight alternative to Anaconda)
# Download from: https://docs.conda.io/projects/conda/en/latest/user-guide/install/

# Verify installation
python --version  # Should be 3.10+
conda --version

# Create virtual environment for project
conda create -n geosmart python=3.10
conda activate geosmart
```

### 3. Node.js & npm

```bash
# Install Node.js (includes npm)
# macOS: brew install node
# Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
# Windows: Download from https://nodejs.org/

# Verify installation
node --version  # Should be 18.0+
npm --version   # Should be 9.0+
```

### 4. Docker (Optional but recommended)

```bash
# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# Verify installation
docker --version

# Configure Docker daemon (if needed)
# macOS/Windows: Docker Desktop settings
# Linux: sudo usermod -aG docker $USER
```

### 5. PostgreSQL Client Tools

```bash
# macOS
brew install postgresql

# Ubuntu
sudo apt-get install postgresql-client

# Windows
# Download from: https://www.postgresql.org/download/windows/

# Verify
psql --version
```

---

## Clone & Setup Project

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/YOUR_ORG/aiu-geosmart.git
cd aiu-geosmart

# Verify structure
ls -la
# Should show: api/, frontend/, ml/, docs/
```

### 2. Setup Python Backend

```bash
# Activate virtual environment
conda activate geosmart

# Install dependencies
cd api/
pip install -r requirements.txt

# Verify installation
python -c "import fastapi; import xgboost; import pandas; print('All imports successful!')"
```

### 3. Setup Frontend

```bash
# Navigate to frontend directory
cd ../frontend/

# Install Node dependencies
npm install

# Verify installation
npm list react react-redux axios
```

### 4. Setup ML Pipeline Environment

```bash
# Python ML dependencies
cd ../ml/
pip install -r requirements.txt

# Install Jupyter
pip install jupyter jupyterlab

# Verify Jupyter
jupyter --version
```

---

## Environment Configuration

### 1. Create .env File

```bash
# Navigate to project root
cd /path/to/aiu-geosmart

# Create .env file from template
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your editor
```

### 2. .env Configuration

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/geosmart_dev
SQLALCHEMY_ECHO=true

# Redis
REDIS_URL=redis://localhost:6379/0

# Azure (optional - for local Azure emulation)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;
AZURE_BLOB_CONTAINER=models

# API
API_ENV=development
API_PORT=8000
LOG_LEVEL=DEBUG

# Frontend
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ENV=development

# ML Pipeline
DATA_PATH=./data
MODEL_PATH=./models
NOTEBOOK_PATH=./ml/notebooks

# Secrets (generate random values)
SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')
API_KEY_TEST=sk_test_abc123xyz789
```

---

## Database Setup

### 1. Start PostgreSQL

#### Using Docker (Recommended)

```bash
# Create network
docker network create geosmart-network

# Run PostgreSQL container
docker run --name postgres-geosmart \
  --network geosmart-network \
  -e POSTGRES_USER=geosmart \
  -e POSTGRES_PASSWORD=dev_password_123 \
  -e POSTGRES_DB=geosmart_dev \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  -d postgres:14

# Verify container is running
docker ps | grep postgres-geosmart

# Connect to database
psql -h localhost -U geosmart -d geosmart_dev
```

#### Using Local PostgreSQL Installation

```bash
# macOS with Homebrew
brew services start postgresql

# Ubuntu
sudo systemctl start postgresql

# Verify service is running
sudo systemctl status postgresql

# Create database and user
sudo -u postgres createdb geosmart_dev
sudo -u postgres createuser geosmart
sudo -u postgres psql -d geosmart_dev -c "ALTER USER geosmart WITH PASSWORD 'dev_password_123';"
```

### 2. Initialize Database Schema

```bash
# Navigate to project root
cd /path/to/aiu-geosmart

# Run migrations
python -m alembic upgrade head

# Verify tables created
psql -h localhost -U geosmart -d geosmart_dev -c "\dt"

# Expected output: 10 tables (umkm, features, credit_scores, etc.)
```

### 3. Load Sample Data

```bash
# Create sample data
python scripts/load_sample_data.py

# Verify data loaded
psql -h localhost -U geosmart -d geosmart_dev -c "SELECT COUNT(*) FROM umkm;"

# Expected: Should show some number of records
```

---

## Redis Setup

### Using Docker (Recommended)

```bash
# Run Redis container
docker run --name redis-geosmart \
  --network geosmart-network \
  -p 6379:6379 \
  -d redis:7-alpine

# Verify container
docker ps | grep redis-geosmart

# Test connection
redis-cli ping  # Should respond with PONG
```

### Using Local Redis Installation

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis-server

# Verify
redis-cli ping
```

---

## Backend API Setup

### 1. Start API Server

```bash
# Navigate to api directory
cd /path/to/aiu-geosmart/api

# Activate virtual environment
conda activate geosmart

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Expected output:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

### 2. Test API Endpoints

```bash
# In new terminal, test health endpoint
curl http://localhost:8000/api/v1/health

# Expected response:
# {"status":"healthy","timestamp":"2024-01-15T14:30:00Z"}

# Test credit score endpoint (with test data)
curl -X POST http://localhost:8000/api/v1/credit-score \
  -H "X-API-Key: sk_test_abc123" \
  -H "Content-Type: application/json" \
  -d '{"umkm_id": "test-id"}'

# Should return error (UMKM not found) or score if sample data loaded
```

### 3. API Documentation

```bash
# Swagger UI
open http://localhost:8000/docs

# ReDoc (alternative documentation)
open http://localhost:8000/redoc
```

---

## Frontend Dashboard Setup

### 1. Start Development Server

```bash
# Navigate to frontend directory
cd /path/to/aiu-geosmart/frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm start

# Expected output:
# webpack compiled successfully
# Compiled successfully!
# You can now view geosmart-dashboard in the browser.
# Local: http://localhost:3000
```

### 2. Access Dashboard

```bash
# Open browser
open http://localhost:3000

# Or navigate manually to: http://localhost:3000

# Expected: Dashboard loads with login page
```

### 3. Test Dashboard

```bash
# Login with test credentials
# Username: test@bank.com
# Password: password123

# Navigate through pages to verify functionality
# Dashboard → UMKM Search → Scoring → Analytics → Reports
```

---

## ML Pipeline Setup

### 1. Prepare Notebook Environment

```bash
# Navigate to ML directory
cd /path/to/aiu-geosmart/ml

# Activate virtual environment
conda activate geosmart

# Install Jupyter
pip install jupyter jupyterlab

# Start Jupyter Lab
jupyter lab

# Expected: Browser opens to http://localhost:8888
```

### 2. Running Notebooks

```bash
# In Jupyter Lab, open notebook: 01-data-import.ipynb

# Run notebook step-by-step:
# 1. Click on cell
# 2. Press Shift+Enter to execute
# 3. View output

# Or run all cells:
# Kernel → Restart Kernel and Run All Cells
```

### 3. Notebook Execution Order

```
1. 01-data-import.ipynb
   └─ Input: Raw CSV files
   └─ Output: raw_data.parquet

2. 02-eda-and-cleaning.ipynb
   └─ Input: raw_data.parquet
   └─ Output: clean_data.parquet, eda_report.html

3. 03-feature-engineering.ipynb
   └─ Input: clean_data.parquet
   └─ Output: features_engineered.parquet

4. 04-feature-selection.ipynb
   └─ Input: features_engineered.parquet
   └─ Output: features_selected.parquet

5. 05-model-training.ipynb
   └─ Input: features_selected.parquet
   └─ Output: model_xgb.pkl, model_metrics.json

6. 06-clustering.ipynb
   └─ Input: features_selected.parquet
   └─ Output: clusters.parquet

7. 07-validation.ipynb
   └─ Input: Models + test data
   └─ Output: validation_report.html

8. 08-model-registry.ipynb
   └─ Input: Validated models
   └─ Output: models/ directory (local)
```

---

## Running Tests

### 1. Backend Tests

```bash
# Navigate to api directory
cd /path/to/aiu-geosmart/api

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=app --cov-report=html

# View coverage report
open htmlcov/index.html
```

### 2. Frontend Tests

```bash
# Navigate to frontend directory
cd /path/to/aiu-geosmart/frontend

# Run tests in watch mode
npm test

# Run with coverage
npm test -- --coverage

# Build for production testing
npm run build
```

### 3. ML Pipeline Tests

```bash
# Navigate to ML directory
cd /path/to/aiu-geosmart/ml

# Run notebook tests
pytest tests/ -v

# Validate specific notebook
python -m nbval notebooks/01-data-import.ipynb
```

---

## Code Quality & Linting

### Backend Code Quality

```bash
# Navigate to api directory
cd /path/to/aiu-geosmart/api

# Run Black (code formatter)
black app/

# Run Flake8 (linter)
flake8 app/

# Run mypy (type checker)
mypy app/
```

### Frontend Code Quality

```bash
# Navigate to frontend directory
cd /path/to/aiu-geosmart/frontend

# Run ESLint
npm run lint

# Run Prettier (formatter)
npm run format

# Run type check
npm run type-check
```

---

## Docker Compose (Full Stack)

### Start Complete Stack

```bash
# Navigate to project root
cd /path/to/aiu-geosmart

# Start all services
docker-compose up -d

# View running containers
docker-compose ps

# Expected: 5 containers running
# - postgres-geosmart (PostgreSQL)
# - redis-geosmart (Redis)
# - api-geosmart (FastAPI)
# - frontend-geosmart (React)
# - pgadmin (Database admin)
```

### Access Services

```
PostgreSQL: localhost:5432
Redis: localhost:6379
API: http://localhost:8000
Dashboard: http://localhost:3000
PgAdmin: http://localhost:5050
```

### Stop Stack

```bash
# Stop all services (keep data)
docker-compose stop

# Stop and remove containers (delete data)
docker-compose down

# Stop and remove all (including volumes)
docker-compose down -v
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

```bash
# Error: "Could not connect to database"

# Solutions:
# 1. Verify PostgreSQL is running
psql -h localhost -U geosmart -d geosmart_dev -c "SELECT 1"

# 2. Check .env DATABASE_URL
cat .env | grep DATABASE_URL

# 3. Verify firewall isn't blocking port 5432
lsof -i :5432

# 4. Reset database
psql -h localhost -U geosmart -d geosmart_dev -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
python -m alembic upgrade head
```

#### 2. Port Already in Use

```bash
# Error: "Address already in use: 0.0.0.0:8000"

# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn main:app --reload --port 8001
```

#### 3. Module Import Error

```bash
# Error: "ModuleNotFoundError: No module named 'xgboost'"

# Solution: Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Or activate correct environment
conda activate geosmart
which python  # Should be in geosmart environment
```

#### 4. Out of Memory

```bash
# Error: "MemoryError" during notebook execution

# Solutions:
# 1. Close unused applications
# 2. Reduce dataset size for testing
# 3. Use sample data instead of full dataset
# 4. Increase machine RAM or upgrade machine

# Check memory usage
free -h  # Linux
vm_stat  # macOS
```

#### 5. Redis Connection Refused

```bash
# Error: "Connection refused 127.0.0.1:6379"

# Solutions:
# 1. Verify Redis is running
redis-cli ping

# 2. Start Redis
# Docker:
docker-compose up -d redis-geosmart

# Homebrew:
brew services start redis

# 3. Check Redis port
lsof -i :6379
```

---

## Performance Optimization (Local Development)

### 1. Database Query Optimization

```bash
# Enable query logging
psql -h localhost -U geosmart -d geosmart_dev

# In psql:
SET log_statement = 'all';
SET log_min_duration_statement = 1000;  # Log queries > 1 second

# View slow queries
tail -f /usr/local/var/log/postgres.log | grep "duration:"
```

### 2. API Performance Profiling

```bash
# Add profiling middleware
# In api/main.py:
from pyinstrument import Profiler

@app.middleware("http")
async def profile_request(request: Request, call_next):
    profiler = Profiler()
    profiler.start()
    response = await call_next(request)
    profiler.stop()
    print(profiler.output_text(unicode=True, show_all=True))
    return response
```

### 3. Frontend Bundle Analysis

```bash
# Analyze bundle size
npm install --save-dev webpack-bundle-analyzer

# Add to package.json scripts
# "analyze": "webpack-bundle-analyzer build/static/js/*.js"

npm run analyze
```

---

## Useful Development Commands

```bash
# Quick start all services
make dev-up

# Stop all services
make dev-down

# Restart database
make db-restart

# Load fresh sample data
make data-load

# Run all tests
make test

# Format code
make fmt

# Check code quality
make lint

# Generate API docs
make docs

# View logs
docker-compose logs -f api

# Enter database shell
make db-shell

# Reset everything (use carefully!)
make clean
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial comprehensive local setup guide |

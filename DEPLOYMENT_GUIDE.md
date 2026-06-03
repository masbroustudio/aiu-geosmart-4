# 🚀 Azure Deployment Guide - GeoUMKM Smart v4.0

## ✅ Completed Steps

### Phase 1: Local Development
- ✅ Environment setup (Node v22, pnpm, Python, Azure Tools)
- ✅ 8 ML notebooks executed → 14 data files + 2 models generated
- ✅ Frontend (Next.js) running @ localhost:3000
- ✅ API (Azure Functions) running @ localhost:7071/api
- ✅ End-to-end testing passed

### Phase 2: Pre-Deployment Testing
- ✅ TypeScript compilation (0 errors)
- ✅ All API endpoints tested & working
- ✅ Azure Functions configuration verified
- ✅ All ML data files present & ready

### Phase 3: Azure Deployment Setup
- ✅ Resource Group created: `rg-geoumkm-v2` (eastasia)
- ✅ Static Web App created: `swa-geoumkm-v2`
- ✅ Public URL: https://witty-island-0fdf65f00.7.azurestaticapps.net
- ✅ Configuration files committed to GitHub
- ✅ Code pushed to `masbroustudio/aiu-geosmart-4` (main branch)

---

## 🔧 Next Steps for Deployment

### Step 1: Connect GitHub to Static Web App (Azure Portal)

1. Go to Azure Portal: https://portal.azure.com
2. Search for "Static Web Apps" → Select `swa-geoumkm-v2`
3. Left menu → **Deployment Center**
4. Click **Manage deployment token** (copy it)
5. Add to GitHub as Secret:
   - Go to: https://github.com/masbroustudio/aiu-geosmart-4/settings/secrets/actions
   - Click "New repository secret"
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: (paste the token from step 4)

### Step 2: Configure GitHub Action Workflow

Create file: `.github/workflows/azure-deploy.yml`

```yaml
name: Build and Deploy to Azure Static Web App

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        working-directory: ./frontend
        run: pnpm install --frozen-lockfile

      - name: Build
        working-directory: ./frontend
        run: pnpm build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.AZURE_API_URL || 'https://witty-island-0fdf65f00.7.azurestaticapps.net/api' }}

      - name: Deploy to Azure Static Web App
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/frontend"
          output_location: "out"
          skip_app_build: true

  close_pull_request:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    
    steps:
      - name: Close Pull Request
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
```

### Step 3: Deploy Frontend

Push to main branch:
```bash
git push masbroustudio main
```

This will trigger GitHub Actions to build & deploy frontend to Azure Static Web App.

### Step 4: Verify Deployment

Check Azure Portal:
1. Static Web App → `swa-geoumkm-v2` → Overview
2. Look for "Builds" section
3. Wait for workflow to complete (green checkmark)
4. Access URL: https://witty-island-0fdf65f00.7.azurestaticapps.net

---

## ⚠️ Important Notes

### API Integration
- Frontend will use fallback static data if API not available
- For full API integration, deploy Azure Functions separately:
  ```bash
  cd api
  func azure functionapp publish func-geoumkm-api
  ```
- Update `NEXT_PUBLIC_API_URL` in GitHub Secrets

### ML Data
- All 14 CSV files & 2 models already committed
- Data is embedded in repository (18 MB total)
- No additional setup needed for data pipeline

### Environment Variables

**Frontend (.env.production):**
```
NEXT_PUBLIC_API_URL=https://witty-island-0fdf65f00.7.azurestaticapps.net/api
```

**GitHub Secrets Needed:**
- `AZURE_STATIC_WEB_APPS_API_TOKEN` - From Static Web App deployment token
- `AZURE_API_URL` (optional) - Custom API endpoint

---

## 📊 Resource Summary

| Resource | Name | Status | URL |
|----------|------|--------|-----|
| Resource Group | rg-geoumkm-v2 | ✅ Created | - |
| Static Web App | swa-geoumkm-v2 | ✅ Created | https://witty-island-0fdf65f00.7.azurestaticapps.net |
| Storage Account | stgeoumkmstor | ✅ Created | - |
| Function App | func-geoumkm-api | ⏳ To Deploy | - |
| Region | East Asia | ✅ Set | - |

---

## 🔍 Troubleshooting

### Static Web App not updating
1. Check GitHub Actions workflow in repo
2. View logs: https://github.com/masbroustudio/aiu-geosmart-4/actions
3. Verify `AZURE_STATIC_WEB_APPS_API_TOKEN` is correct

### API endpoints not responding
1. Frontend will use static data (fallback)
2. To enable live API:
   - Deploy Azure Functions
   - Update `NEXT_PUBLIC_API_URL`
   - Restart Static Web App build

### Build failures
1. Check pnpm lock file is committed
2. Verify Node.js version compatibility
3. Check output location matches "out" (Next.js default)

---

## 📝 Deployment Checklist

- [ ] GitHub Secrets configured (`AZURE_STATIC_WEB_APPS_API_TOKEN`)
- [ ] GitHub Actions workflow file created
- [ ] Code pushed to main branch
- [ ] Build completes successfully in Azure Portal
- [ ] Frontend loads @ https://witty-island-0fdf65f00.7.azurestaticapps.net
- [ ] Dashboard & pages accessible
- [ ] (Optional) Azure Functions API deployed & connected

---

**Status: Ready for deployment! 🚀**

Execute Step 1-3 above to complete production deployment.

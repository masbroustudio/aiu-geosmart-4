# 🗺️ GeoUMKM Smart V4.0

> **AI-Powered Location Intelligence & Credit Risk System for Indonesian MSMEs**  
> *Enterprise-Ready Platform for Banks, Government, and Investors*

⚠️ **STATUS:** v4.0 in development - Code audit completed, 3-4 weeks to production-ready.  
📋 **See:** [`AUDIT-SUMMARY.md`](./docs/AUDIT-SUMMARY.md) and [`19-code-documentation-consistency-audit.md`](./docs/19-code-documentation-consistency-audit.md)

![Dicoding](https://img.shields.io/badge/Dicoding-Submission-blue)
![Azure](https://img.shields.io/badge/Azure-Static%20Web%20Apps-0078D4)
![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB)
![XGBoost](https://img.shields.io/badge/XGBoost-ML-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Deskripsi Proyek

**GeoUMKM Smart V3.0** adalah sistem intelijen lokasi dan penilaian risiko kredit berbasis **AI dan geospatial analytics** yang melayani **3 target pengguna utama**:

### 🏦 Bank (Credit Risk)
- Model credit risk scoring dengan Probability of Default (PD) buckets
- Regulatory-compliant risk assessment untuk portofolio UMKM
- Score bands dan calibration sesuai standar perbankan

### 🏛️ Pemerintah / Government (Priority Areas & Policy Simulation)
- Identifikasi kecamatan prioritas untuk intervensi program
- What-If simulation untuk estimasi dampak kebijakan (KUR, pelatihan, infrastruktur)
- Clustering wilayah berdasarkan karakteristik UMKM

### 💼 Investor (Opportunity Scoring)
- Location scoring model untuk penilaian peluang investasi
- Segmentasi pasar berdasarkan clustering geospasial
- Rekomendasi lokasi optimal per sektor usaha

---

## 📊 Statistik Proyek

| Metrik | Nilai |
|--------|-------|
| Total Data UMKM | 10,000 |
| Kecamatan | 596 |
| Kabupaten/Kota | 27 |
| Notebook | 8 |
| ML Models | XGBoost, LightGBM |
| Clusters | K-Means + DBSCAN |

---

## 📓 Notebook Pipeline

Notebooks harus dijalankan secara berurutan (sequential) karena setiap notebook menghasilkan data yang digunakan oleh notebook berikutnya.

| # | Notebook | Deskripsi |
|---|----------|-----------|
| 01 | `01_Data_Foundation.ipynb` | Generate 10,000 dataset UMKM sintetis dengan 596 kecamatan riil di Jawa Barat |
| 02 | `02_EDA_Feature_Engineering.ipynb` | Exploratory Data Analysis + Feature Engineering (34 kolom) |
| 03 | `03_Location_Scoring_Model.ipynb` | XGBoost location scoring model dengan SHAP explainability |
| 04 | `04_Credit_Risk_Model.ipynb` | Credit risk model dengan PD buckets dan regulatory compliance |
| 05 | `05_Clustering_Segmentation.ipynb` | K-Means + DBSCAN clustering untuk segmentasi wilayah |
| 06 | `06_Recommendation_WhatIf.ipynb` | Recommendation engine + What-If policy simulation |
| 07 | `07_LLM_RIG_Preparation.ipynb` | Knowledge base construction + RIG (Retrieval-Integrated Generation) preparation |
| 08 | `08_Executive_Summary.ipynb` | Model cards + executive summary untuk stakeholders |

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **ML Pipeline (XGBoost/LightGBM)** | Ensemble models untuk location scoring dan credit risk |
| **Credit Risk Model** | PD estimation dengan score bands, calibration curves, KS statistic |
| **Clustering & Segmentation** | K-Means + DBSCAN untuk segmentasi geospasial UMKM |
| **Recommendation Engine** | Rekomendasi lokasi optimal per kecamatan berdasarkan multi-criteria scoring |
| **What-If Simulation** | Simulasi dampak kebijakan pemerintah terhadap skor UMKM |
| **LLM/RIG Preparation** | Knowledge base terstruktur untuk integrasi dengan Large Language Models |
| **SHAP Explainability** | Feature importance dan model interpretability |
| **Executive Summary** | Model cards dan ringkasan untuk pengambil keputusan |

---

## 🛠️ Technology Stack

- **XGBoost / LightGBM** - Gradient boosting models
- **scikit-learn** - ML pipeline, preprocessing, clustering
- **SHAP** - Model explainability
- **Pandas / NumPy / SciPy** - Data processing & statistics
- **Matplotlib / Seaborn** - Visualization
- **nbformat** - Programmatic notebook generation
- **Azure Static Web Apps** - Deployment & hosting
- **GitHub Actions** - CI/CD pipeline

---

## 📁 Struktur Folder

```
geoumkm-smart-3/
├── notebooks/                    # Jupyter Notebooks (harus dijalankan berurutan)
│   ├── 01_Data_Foundation.ipynb
│   ├── 02_EDA_Feature_Engineering.ipynb
│   ├── 03_Location_Scoring_Model.ipynb
│   ├── 04_Credit_Risk_Model.ipynb
│   ├── 05_Clustering_Segmentation.ipynb
│   ├── 06_Recommendation_WhatIf.ipynb
│   ├── 07_LLM_RIG_Preparation.ipynb
│   └── 08_Executive_Summary.ipynb
│
├── data/                         # Generated data (dari notebook execution)
│   ├── umkm_dataset.csv
│   ├── umkm_engineered.csv
│   ├── umkm_clustered.csv
│   ├── location_scores_predicted.csv
│   ├── credit_score_bands.csv
│   ├── recommendations_by_kecamatan.csv
│   ├── whatif_simulation_results.csv
│   └── knowledge_base/          # Knowledge base untuk LLM/RIG
│
├── models/                       # Trained ML models
│   ├── location_scoring_model.joblib
│   └── credit_risk_model.joblib
│
├── docs/                         # HTML exports & visualizations
│
├── scripts/                      # Build scripts untuk notebook generation
│
├── index.html                    # Landing page (Azure Static Web Apps)
├── README.md
└── .gitignore
```

---

## 🚀 Cara Menjalankan

### 1. Clone Repository

```bash
git clone https://github.com/masbroustudio/geoumkm-smart-3.git
cd geoumkm-smart-3
```

### 2. Install Dependencies

```bash
pip install pandas numpy scikit-learn xgboost lightgbm scipy matplotlib seaborn shapely nbformat nbconvert jupyter-client ipykernel
```

### 3. Jalankan Notebooks (Berurutan)

```bash
# Notebook HARUS dijalankan secara berurutan (01 -> 02 -> ... -> 08)
jupyter nbconvert --to notebook --execute notebooks/01_Data_Foundation.ipynb
jupyter nbconvert --to notebook --execute notebooks/02_EDA_Feature_Engineering.ipynb
jupyter nbconvert --to notebook --execute notebooks/03_Location_Scoring_Model.ipynb
jupyter nbconvert --to notebook --execute notebooks/04_Credit_Risk_Model.ipynb
jupyter nbconvert --to notebook --execute notebooks/05_Clustering_Segmentation.ipynb
jupyter nbconvert --to notebook --execute notebooks/06_Recommendation_WhatIf.ipynb
jupyter nbconvert --to notebook --execute notebooks/07_LLM_RIG_Preparation.ipynb
jupyter nbconvert --to notebook --execute notebooks/08_Executive_Summary.ipynb
```

### 4. Export ke HTML

```bash
jupyter nbconvert --to html notebooks/*.ipynb --output-dir docs/
```

### 5. Buka Landing Page

```bash
# Buka index.html di browser
open index.html           # macOS
xdg-open index.html       # Linux
start index.html          # Windows
```

> **Catatan:** Notebooks harus dijalankan secara berurutan karena setiap notebook menghasilkan file data (CSV) di folder `data/` yang dibutuhkan oleh notebook berikutnya.

---

## 📚 Documentation

Comprehensive project documentation adalah tersedia di folder `docs/`:

| File | Topik |
|------|-------|
| [`00-project-brief.md`](./docs/00-project-brief.md) | Problem statement, vision, target users, KPIs |
| [`01-masterplan.md`](./docs/01-masterplan.md) | Product principles, feature catalog, roadmap |
| [`02-architecture.md`](./docs/02-architecture.md) | System architecture, components, technology choices |
| [`03-data-model.md`](./docs/03-data-model.md) | Data schema, entity relationships, data lineage |
| [`04-ml-pipeline.md`](./docs/04-ml-pipeline.md) | 8 notebooks, pipeline execution, data flow |
| [`05-api-specification.md`](./docs/05-api-specification.md) | REST API endpoints, request/response, authentication |
| [`06-models-guide.md`](./docs/06-models-guide.md) | 4 ML models, performance metrics, SHAP explanations |
| [`07-deployment.md`](./docs/07-deployment.md) | Azure deployment, CI/CD, monitoring |
| [`08-setup-local.md`](./docs/08-setup-local.md) | Local development environment setup |
| [`09-faq-troubleshooting.md`](./docs/09-faq-troubleshooting.md) | Common issues and solutions |

---

## 👤 Author

**Yudha Elfransyah**  
- Email: yudhae@gmail.com  
- GitHub: [masbroustudio](https://github.com/masbroustudio)

---

## 📜 Lisensi

MIT License - Lihat file [LICENSE](LICENSE) untuk detail.

---

*METC Datathon 2026 - Urban Resilience & Smart City*  
*Dicoding Submission*

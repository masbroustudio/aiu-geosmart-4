# 🗺️ GeoUMKM Smart V4.0

> **AI-Powered Location Intelligence & Credit Risk System for Indonesian MSMEs**  
> *Enterprise-Ready Platform for Banks, Government, and Investors*

![Dicoding](https://img.shields.io/badge/Dicoding-Submission-blue)
![Azure](https://img.shields.io/badge/Azure-Static%20Web%20Apps-0078D4)
![Node.js](https://img.shields.io/badge/Node.js-v20%2B-339933)
![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB)
![XGBoost](https://img.shields.io/badge/XGBoost-ML-orange)
![Azure OpenAI](https://img.shields.io/badge/Azure%20OpenAI-GPT--4o-0078D4)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌟 Yang Baru di GeoUMKM Smart V4.0 (Datathon Edition)

Versi **v4.0** membawa platform ini ke tingkat kesiapan produksi (*production-ready*) skala enterprise dengan penambahan fitur-fitur **Agentic AI**, **Explainable AI (XAI)**, dan **Data Pipeline Automation** yang mutakhir:

### 1. 🤖 Agentic AI & Tool Call Chatbot (Azure OpenAI GPT-4o)
* Obrolan AI kini berjalan secara **agentic** menggunakan model **Azure OpenAI GPT-4o** dan **Function Calling**.
* AI secara cerdas dapat memanggil alat (*tools*) internal backend secara langsung berdasarkan konteks obrolan untuk menjawab pengguna:
  * `calculate_credit_score`: Menghitung skor kredit UMKM real-time menggunakan model XGBoost.
  * `get_portfolio_summary`: Mengambil ringkasan data portofolio kredit perbankan secara live.
  * `get_location_recommendations`: Memberikan rekomendasi wilayah potensial teratas per sektor usaha.
* Dilengkapi dengan *fallback* berbasis aturan (*rule-based*) lokal yang tangguh jika API Key Azure OpenAI tidak dikonfigurasi.

### 2. 📊 Kalkulator Kredit Interaktif & SHAP Explainable AI (XAI)
* Di halaman **Credit Scoring**, ditambahkan formulir kalkulator ML interaktif. Petugas kredit bank dapat memasukkan parameter operasional UMKM untuk mendapatkan skor, rating, dan Probability of Default (PD) secara instan.
* Dilengkapi visualisasi **SHAP (Shapley Additive exPlanations) Force Plot** dinamis untuk menjelaskan secara transparan faktor apa saja yang menaikkan atau menurunkan skor kredit UMKM tersebut.

### 3. 📉 Simulator Stress Test Portofolio Dinamis
* Di halaman **Portfolio Analytics**, ditambahkan slider kejutan makroekonomi (NPL Shock Range Slider) yang interaktif.
* Ketika digeser, grafik dan nilai *Expected Loss (EL)*, rata-rata PD tertimbang, serta *Additional Loss* akan dihitung ulang secara dinamis untuk menguji ketahanan portofolio bank terhadap guncangan ekonomi.

### 4. 🗺️ Peta Kepadatan Spasial (Heatmap) & Filter Legenda Interaktif
* Peta spasial sebaran kecamatan kini memiliki mode visualisasi ganda: **Pin Standard** dan **Heatmap Density (Kepadatan Spasial)** dengan rendering berpendar yang halus.
* Legenda skor potensi pada peta bersifat **interaktif**. Pengguna dapat mengklik kategori skor pada legenda untuk menyaring koordinat kecamatan secara real-time pada peta.

### 5. 📥 Upload CSV Batch Ingestion & Auto-Scoring Pipeline
* Di halaman **Reports**, ditambahkan panel unggah data CSV batch.
* Pengguna dapat mengunggah dataset UMKM dalam format CSV. Pipeline backend akan otomatis melakukan ekstraksi fitur (*feature engineering*), mengeksekusi model prediksi XGBoost, menyajikan ringkasan statistik (rata-rata skor, risiko tinggi/rendah), dan menyajikan data tabular hasil prediksi yang siap diunduh (*Export Scored CSV*).

### 6. ⚙️ Halaman Pengaturan Developer & Sesi Serverless
* Halaman **Settings** yang interaktif mencakup: pembaruan profil pengguna berbasis decoding JWT client-side, generator API Keys developer, sakelar tema gelap/terang, preferensi bahasa, serta pembersihan data cache.
* Ditambahkan logika **Session Auto-Recovery** di backend middleware untuk menjaga stabilitas sesi otentikasi JWT saat container Azure Functions mengalami daur ulang (*cold start/recycle*).

---

## 📋 Deskripsi Proyek

**GeoUMKM Smart V4.0** adalah sistem intelijen lokasi dan penilaian risiko kredit berbasis **AI dan geospatial analytics** yang melayani **3 target pengguna utama**:

### 🏦 Bank (Credit Risk)
* Model credit risk scoring dengan Probability of Default (PD) buckets
* Regulatory-compliant risk assessment untuk portofolio UMKM
* Score bands dan calibration sesuai standar perbankan

### 🏛️ Pemerintah / Government (Priority Areas & Policy Simulation)
* Identifikasi kecamatan prioritas untuk intervensi program
* What-If simulation untuk estimasi dampak kebijakan (KUR, pelatihan, infrastruktur)
* Clustering wilayah berdasarkan karakteristik UMKM

### 💼 Investor (Opportunity Scoring)
* Location scoring model untuk penilaian peluang investasi
* Segmentasi pasar berdasarkan clustering geospasial
* Rekomendasi lokasi optimal per sektor usaha

---

## 📊 Statistik Proyek

| Metrik | Nilai |
| :--- | :--- |
| **Total Data UMKM** | 10,000 |
| **Kecamatan Jawa Barat** | 596 |
| **Kabupaten/Kota** | 27 |
| **Notebook Pipeline** | 8 |
| **Model ML** | XGBoost, LightGBM |
| **Algoritma Clustering** | K-Means + DBSCAN |
| **Teknologi AI Chat** | GPT-4o Agentic Function Calling |

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 14 (App Router), TailwindCSS, Recharts, Framer Motion, React-Leaflet.
* **Backend API**: Azure Functions v4 (Node.js 20), TypeScript.
* **Database & Ingestion**: PostgreSQL / PostGIS support, client-side CSV Parser.
* **Machine Learning & AI**: XGBoost (Python/Pickle), SHAP Interpretability, Azure OpenAI (GPT-4o API).
* **Hosting & CI/CD**: Azure Static Web Apps, GitHub Actions.

---

## 🚀 Cara Menjalankan Secara Lokal

### 1. Clone Repository & Setup Frontend
```bash
git clone https://github.com/masbroustudio/aiu-geosmart-4.git
cd aiu-geosmart-4/frontend
pnpm install
pnpm dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### 2. Jalankan API Backend (Azure Functions)
Pastikan Azure Functions Core Tools telah terinstal:
```bash
cd ../api
npm install
npm run build
func start
```

### 3. Konfigurasi Environment Variables (Lokal & Produksi)
Buat berkas `.env` di folder `/api` untuk mengaktifkan database PostgreSQL dan fitur RAG Chatbot:
```env
# Database (Azure PostgreSQL)
DB_TYPE=mock                 # Ubah ke 'postgres' jika ingin menghubungkan PostgreSQL
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-secure-jwt-secret-key
DATA_DIR=/tmp

# Azure OpenAI (Agentic Chatbot)
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

---

## 👤 Author

**Yudha Elfransyah**  
* Email: yudhae@gmail.com  
* GitHub: [masbroustudio](https://github.com/masbroustudio)

---

## 📜 Lisensi

MIT License - Lihat file [LICENSE](LICENSE) untuk detail.

---

*METC Datathon 2026 - Urban Resilience & Smart City*  
*Dicoding Submission*

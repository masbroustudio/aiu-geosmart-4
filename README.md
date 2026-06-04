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

Versi **v4.0** membawa platform ini ke tingkat kesiapan produksi (*production-ready*) skala enterprise dengan penambahan fitur-fitur **Agentic AI**, **Explainable AI (XAI)**, **Enterprise Database & Queue Systems**, serta **Data Pipeline Automation** yang mutakhir:

### 1. 🤖 Agentic AI & Tool Call Chatbot (Azure OpenAI GPT-4o)
* Obrolan AI kini berjalan secara **agentic** menggunakan model **Azure OpenAI GPT-4o** dan **Function Calling**.
* AI secara cerdas dapat memanggil alat (*tools*) internal backend secara langsung berdasarkan konteks obrolan untuk menjawab pengguna:
  * `calculate_credit_score`: Menghitung skor kredit UMKM real-time menggunakan model XGBoost.
  * `get_portfolio_summary`: Mengambil ringkasan data portofolio kredit perbankan secara live.
  * `get_location_recommendations`: Memberikan rekomendasi wilayah potensial teratas per sektor usaha.
* Dilengkapi dengan *fallback* berbasis aturan (*rule-based*) lokal yang tangguh jika API Key Azure OpenAI tidak dikonfigurasi.

### 2. 🗄️ Konektivitas Azure PostgreSQL & Auto-Seeding
* Mendukung penuh koneksi basis data relasional riil dengan data seeding otomatis saat inisialisasi untuk 10.000 records (tabel `umkm_dataset` dan `umkm_clustered`).
* Halaman dasbor (Overview, Clustering, & Credit Scoring) mengambil data secara dinamis menggunakan query SQL (dengan fallback otomatis ke CSV jika basis data dinonaktifkan).

### 3. 🛡️ Keamanan & Integrasi API Keys Developer
* Halaman **Settings** kini dilengkapi modul pembuatan, penayangan, dan pencabutan (revoke) **Developer API Keys** yang aman (disimpan di DB dengan enkripsi SHA-256).
* Dilengkapi dengan bypass interseptor header Azure Static Web Apps menggunakan header kustom `X-Custom-Authorization` pada middleware backend untuk otentikasi JWT dan validasi `X-API-Key`.

### 4. 📈 Penyimpanan Skenario Simulasi Kebijakan
* Pengguna dapat menyimpan, memberi nama, memuat kembali (load), dan menghapus riwayat skenario alokasi anggaran daerah yang telah dirancang langsung ke database PostgreSQL/Mock.

### 5. 🔮 Simulasi Geospasial Berbasis Model ML di Backend
* Kalkulasi simulasi anggaran daerah kini dijalankan di backend (`POST /api/policy/simulate`).
* Menghasilkan prediksi peningkatan skor potensi per kecamatan secara dinamis dan non-linear berdasarkan hukum *diminishing returns* (kurva logaritma) menggunakan bobot target potensi masing-masing klaster.

### 6. 📥 Ingestion Pipeline Asinkron (Simulasi Background Job Queue)
* Pengunggahan file CSV batch berukuran besar dipindahkan ke backend secara asinkron (`POST /api/reports/batch-score/upload`) dengan antrean latar belakang (*background job queue*).
* Menghindari browser *freeze* (macet) pada berkas >50.000 baris dengan memproses data dalam pecahan (*chunks*), serta dilengkapi *polling status* dan antarmuka progres persentase secara real-time pada UI laporan.

### 7. ⏱️ Dynamic Clustering Retraining Scheduler
* Mengimplementasikan penjadwal (Azure Functions Timer Trigger) dan API manual pengembang (`POST /api/developer/clustering/retrain`) yang melatih kembali sentroid K-Means dan DBSCAN pada tabel basis data ketika ada penambahan UMKM baru secara signifikan.

### 8. 📊 Credit Scoring Interaktif & SHAP Explainable AI (XAI)
* Kalkulator ML interaktif di halaman **Credit Scoring** untuk menghitung skor kredit UMKM (300-850), rating, dan PD secara instan menggunakan model XGBoost.
* Dilengkapi visualisasi **SHAP (Shapley Additive exPlanations)** dinamis untuk menjelaskan faktor apa saja yang menaikkan atau menurunkan skor kredit tersebut.

### 9. 📈 Simulator Stress Test Portofolio Dinamis
* Slider kejutan makroekonomi (NPL Shock Range Slider) yang interaktif untuk menguji ketahanan portofolio bank terhadap guncangan ekonomi secara dinamis.

### 10. 🗺️ Peta Kepadatan Spasial (Heatmap) & Legenda Interaktif
* Peta spasial sebaran kecamatan dengan mode visualisasi ganda (**Pin Standard** dan **Heatmap Density**) serta legenda interaktif yang berfungsi sebagai filter koordinat secara real-time pada peta.
* Integrasi *What-If Simulator* Location Intelligence langsung ke backend endpoint `/api/whatif`.

### 12. 🛠️ Perbaikan Path File & Penanganan Error Autentikasi pada Azure SWA
* **Lokalisasi Data SWA**: Memindahkan dan menyinkronkan seluruh dataset (`.csv` dan `.json`) ke direktori `api/data/` agar dikemas dan dideploy secara utuh oleh Azure Static Web Apps (karena folder `ml/data/` di luar root API tidak dikemas saat deploy).
* **Path Resolution Fallback**: Memperbarui utility path resolution agar mendahulukan pencarian file di `api/data` lokal sebelum melakukan *fallback* ke `ml/data` untuk menjaga kompatibilitas eksekusi lokal (`func start`) dan Azure serverless.
* **Koreksi Status HTTP Autentikasi**: Memperbaiki pengecekan status autentikasi di catch block seluruh handler API (25 file handler) dari pengecekan kaku `error.message === 'Unauthorized'` menjadi `error.message.startsWith('Unauthorized')` agar jika token JWT tidak valid/kedaluwarsa, API mengembalikan kode status kustom `401 Unauthorized` dengan benar, alih-alih mengalami crash dengan status `500 Internal Server Error`.
* **Pencegahan Race Condition Database (Cold-Start Query Lock)**: Mengimplementasikan mekanisme transparent query lock untuk mencegah race condition pada SWA cold start, di mana query API berjalan mendahului selesainya proses inisialisasi skema basis data PostgreSQL dan pengisian data (auto-seeding).
* **Penyelarasan Key Mapping Credit Scoring & What-If Simulator**: Memetakan key mapping camelCase dari backend response ke properti komponen UI frontend untuk mencegah galat `TypeError` (seperti `.map` atau `.toFixed` of undefined) saat merender tabel Credit Score Bands portofolio, tabel PD Regulatory Buckets, dan hasil simulator What-If geospasial.
* **Penyelarasan Data Obrolan AI (Bank, Government, Investor Mode)**: Menyelaraskan seluruh metrik statistik pada bot AI asisten (baik tool calling backend maupun fallback frontend) agar konsisten dengan dataset 10.000 UMKM Jawa Barat, total eksposur kredit perbankan Rp 585 Miliar, average PD 43,2%, dan Expected Loss Rp 175,5 Miliar.

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

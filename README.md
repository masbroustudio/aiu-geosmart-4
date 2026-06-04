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

### 4. 📊 Credit Scoring Interaktif & SHAP Explainable AI (XAI)
* Kalkulator ML interaktif di halaman **Credit Scoring** untuk menghitung skor kredit UMKM (300-850), rating, dan PD secara instan menggunakan model XGBoost.
* Dilengkapi visualisasi **SHAP (Shapley Additive exPlanations)** dinamis berbasis Recharts Waterfall Chart untuk menjelaskan kontribusi positif/negatif dari setiap fitur terhadap baseline score.

### 5. 📈 Simulator Stress Test Portofolio Dinamis & Cohort Analysis
* Slider kejutan makroekonomi (Inflasi Jabar, BI-Rate, dan Pertumbuhan PDRB Sektor) yang interaktif untuk menguji ketahanan portofolio bank menggunakan persamaan shock default non-linear eksponensial.
* Ditunjang dengan **Grafik Kohor Portofolio (Portfolio Cohort LineChart)** berbasis usia bisnis untuk memantau tren NPL secara berkelanjutan.

### 6. 🗺️ Lokasi Intelijen: Custom MCDA & Deteksi Market Gap
* Fitur **Custom Multi-Criteria Decision Analysis (MCDA)** dengan 5 slider bobot preferensi (Infrastruktur, Digital, Finansial, Kompetisi, dan Kelangsungan Hidup) untuk menghitung skor kelayakan wilayah secara real-time.
* Fitur **Deteksi Market Gap Spasial** berbasis rasio populasi dan kompetitor per kecamatan untuk memetakan pasar tersembunyi berpotensi tinggi secara otomatis.

### 7. 🔮 Pelatihan Ulang Klaster & Radar Profiling Segmentasi
* Ditambahkan grafik **Radar Profiling Segmentasi** 6-dimensi untuk membandingkan performa antar segmen klaster UMKM.
* UI **Pelatihan Ulang Model** yang dinamis (K-Means Centroids & DBSCAN Spatial) untuk memetakan ulang segmentasi 10.000 data UMKM langsung di backend server ML.

### 8. 🔮 Proyeksi Kebijakan 5 Tahun & Berbagi URL Hash Skenario
* Visualisasi **Proyeksi Dampak Anggaran 5 Tahun** berbasis AreaChart untuk meramal kelangsungan hidup UMKM dan skor potensi di bawah simulasi budget saat ini.
* Sinkronisasi hash URL dinamis (`#alloc=...&budget=...`) dan tombol salin tautan instan memudahkan pengguna membagikan skenario simulasi kebijakan.

### 9. 📥 Ingestion Pipeline Asinkron (Simulasi Background Job Queue)
* Pengunggahan file CSV batch berukuran besar dipindahkan ke backend secara asinkron (`POST /api/reports/batch-score/upload`) dengan antrean latar belakang (*background job queue*).
* Menghindari browser *freeze* (macet) pada berkas >50.000 baris dengan memproses data dalam pecahan (*chunks*), serta dilengkapi *polling status* dan antarmuka progres persentase secara real-time pada UI laporan.

### 10. 🛠️ Perbaikan Path File & Penanganan Error Autentikasi pada Azure SWA
* **Lokalisasi Data SWA**: Memindahkan dan menyinkronkan seluruh dataset (`.csv` dan `.json`) ke direktori `api/data/` agar dikemas dan dideploy secara utuh oleh Azure Static Web Apps.
* **Koreksi Status HTTP Autentikasi**: Memperbaiki pengecekan status autentikasi di catch block seluruh handler API agar mengembalikan kode status kustom `401 Unauthorized` dengan benar.
* **Division-by-Zero & Fallback pada Overview API**: Menambahkan penanganan pembagian dengan nol pada overview handler dan mekanisme SQL-to-CSV fallback otomatis jika Postgres offline.
* **AI Chat Assistant Lokal & Analisis Kontekstual Kecamatan**: Menambahkan interceptor kata kunci kewilayahan/kecamatan prioritas pada API chatbot untuk memberikan wawasan wilayah secara instan saat mode offline.

### 11. 🚀 Pembaruan Terkini & Redesain Premium (SaaS Edition)
* **Redesain Landing Page Premium**: Transformasi total halaman depan dengan tema gelap (*dark mode*) futuristik, efek bias cahaya (*floating gradient orbs*), animasi pemindaian laser (*scanning laser line*), dan mockup dasbor interaktif (menampilkan peta spasial, grafik SHAP, dan antarmuka obrolan AI).
* **Billing Switcher & Dynamic Pricing**: Penambahan toggle interaktif bulanan/tahunan (dengan diskon hemat 20%) untuk kalkulasi harga paket lisensi secara dinamis.
* **Penyelarasan Font Sistem (Inter)**: Penyeragaman font di seluruh platform menggunakan Next.js font loader (`next/font/google`) yang dipetakan ke variabel CSS dan Tailwind CSS (`--font-sans`), menyelesaikan inkonsistensi rendering font antar sistem operasi.
* **Resolusi Bug TDZ Policy Simulation**: Perbaikan runtime `ReferenceError: Cannot access 'z' before initialization` dengan membenahi urutan inisialisasi variabel metrik turunan sebelum dipanggil di fungsi pembuat data proyeksi *timeline*.
* **Penyempurnaan UX Location Intelligence**: Restrukturisasi list box kecamatan yang terlalu panjang menjadi filter interaktif berbasis Kabupaten/Kota, serta penambahan popup detail kecamatan ketika elemen kecamatan diklik.
* **Optimasi LLM Prompting & Fitur AI Workspace Baru**: Pembaharuan sistem prompt chatbot AI Assistant agar lebih cerdas menjawab kebutuhan Bank, Pemerintah, dan Investor (misal: rekomendasi lokasi tekstil), serta implementasi workspace AI baru untuk visualisasi tabel dan grafik data science.
* **Transparansi Pemodelan Credit Risk & Kolektibilitas OJK**: Penjelasan detail (tooltip info) bahwa Probability of Default (PD) dihitung berbasis target model 3 tahun (*is_survived_3yr* dari notebook). Menambahkan pencocokan kelas Kolektibilitas OJK (Kolektibilitas 1 s/d 5) serta petunjuk rekomendasi aksi dinamis peningkatan skor UMKM berbasis visualisasi kontribusi SHAP.
* **Penjelasan & Tooltip Sensitivitas Portofolio**: Penambahan fitur `labelTooltip` pada `KPICard` untuk menguraikan metrik bank (Expected Loss, Weighted PD, HHI Diversification). Implementasi laporan penasihat OJK (*OJK Stress Test Advisory Report*) yang secara reaktif menafsirkan dampak guncangan makroekonomi BI-Rate dan inflasi terhadap kecukupan CKPN (Cadangan Kerugian Penurunan Nilai) bank.
* **Simulator Stress Test Basel III & Integrasi PD Bucket**: Penyelarasan asumsi LGD (Loss Given Default) ke level **45%** sesuai standar Basel F-IRB di notebook. Mengembangkan Stress Test Portofolio menjadi **tabbed-interface** dinamis yang mencakup:
  1. *Transmisi Makro & CKPN*: Proyeksi Expected Loss dan tambahan CKPN/Penyisihan secara interaktif.
  2. *Permodalan Basel III*: Simulasi interaktif pergeseran **Risk-Weighted Assets (RWA)**, **Capital Charge (K)**, dan **Capital Adequacy Ratio (CAR)** bank (dimulai dari baseline 18.5% yang terkikis oleh additional Expected Loss).
  3. *Migrasi PD Bucket (Notebook)*: Tabel detail yang menunjukkan migrasi debitur (10.000 UMKM) di sepanjang 6 PD bucket regulasi Basel III (Low risk, Moderate, Elevated, High, Very High, Default Imminent) di bawah skenario normal vs stres.
* **Interaktivitas Pelatihan Ulang Model (Clustering Retraining)**: Memperbaiki aksi "Latih Ulang Klaster" agar secara reaktif memperbarui visualisasi dan data di halaman dasbor. Pada database aktif (Postgres), server ML di backend kini dinamis menerima parameter jumlah klaster K (2 s/d 8) serta metode (K-Means/DBSCAN), menghapus dan mengklasifikasi ulang data di DB, serta mengosongkan cache. Pada Sandbox/Mock Mode, frontend melakukan simulasi segmentasi virtual secara dinamis berdasarkan parameter K untuk langsung memperbarui visualisasi Radar Chart, profil kartu klaster, dan tabel perankingan prioritas anggaran/investasi secara instan.
* **Penyelarasan & Interaktivitas Priority Kecamatan (Policy Simulation)**: Mengembangkan list "Priority Kecamatan (Top 15)" pada simulator anggaran agar reaktif dan ter-update secara real-time berdasarkan "Total Anggaran Stimulus" dan alokasi anggaran klaster. Kenaikan skor potensi per wilayah dihitung secara dinamis, melakukan *reranking* (pengurutan ulang dari prioritas tertinggi ke terendah), serta menyajikan indikator visual perubahan peringkat (`↑`/`↓`) dan penambahan nilai skor (`+score_increase`) secara langsung di baris tabel kecamatan.
* **Dukungan Dark/Light Mode pada Landing Page**: Mengaktifkan tombol toggle tema (Dark/Light mode) pada landing page. Ditunjang dengan global CSS overrides di [globals.css](file:///C:/dev/aiu-geosmart/frontend/app/globals.css) yang secara reaktif menyesuaikan skema warna latar belakang, teks, border, kartu bento fitur, tombol switcher penagihan paket, serta panel visual mockup ketika kelas `.light` diterapkan oleh `ThemeProvider`.

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

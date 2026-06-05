# Pitch Deck, Narasi Presentasi 10 Menit, & Storyboard Teaser 30 Detik: GeoUMKM Smart v4.0

Dokumen ini berisi materi lengkap untuk keperluan presentasi (*pitching*) proyek **GeoUMKM Smart v4.0**. Materi dirancang terstruktur untuk menjelaskan kebaruan teknologi, performa model machine learning, kualitas kode, integrasi cloud, serta dampaknya yang nyata bagi para pemangku kepentingan.

---

## BAGIAN 1: Struktur Slide Pitch Deck

### Slide 1: Judul & Pembuka (The Hook)
*   **Visual**: Logo GeoUMKM Smart v4.0 dengan visualisasi peta interaktif Jawa Barat yang bersinar (*glow effect*) dalam tema gelap (*dark mode*) premium.
*   **Teks Utama**: **GeoUMKM Smart v4.0**
*   **Sub-Teks**: Akselerasi Kredit & Analisis Spasial UMKM Berbasis AI dan Microsoft Azure.
*   **Key Message**: Platform AI-GIS inovatif untuk memecahkan masalah kesenjangan pembiayaan dan intervensi kebijakan UMKM di Jawa Barat secara presisi.

### Slide 2: Permasalahan Utama (The Problem)
*   **Visual**: Infografis terbagi dua: 1) Peta Jabar yang kosong dengan ikon rantai terputus (melambangkan data spasial yang tidak terintegrasi), 2) Ikon grafik NPL naik dan UMKM menolak pinjaman karena proses birokrasi bank yang rumit.
*   **Teks Utama**: **Kesenjangan Pembiayaan & Ketidaktepatan Kebijakan**
*   **Poin Utama**:
    *   *Asymmetrical Information*: Lembaga keuangan kekurangan data spasial operasional untuk mengukur risiko default UMKM secara presisi.
    *   *Intervensi Tidak Terarah*: Pemerintah menyalurkan subsidi modal tanpa mengetahui hambatan utama (*limiting factors*) per wilayah.
    *   *Ancaman Likuiditas*: Tingkat kelangsungan hidup UMKM rendah (~67%) akibat keterbatasan infrastruktur dan inklusi digital.

### Slide 3: Solusi & Inovasi (The Value Proposition)
*   **Visual**: Diagram arsitektur solusi tiga lapis: **Data Spasial Rill (API-GIS)** $\rightarrow$ **Machine Learning Core (XGBoost/LightGBM)** $\rightarrow$ **Dasbor Analitis Bisnis**.
*   **Teks Utama**: **Platform AI & Location Intelligence Terpadu**
*   **Poin Utama**:
    *   *Inovasi Spasial*: Penggabungan data operasional bisnis UMKM dengan 11 parameter spasial (aksesibilitas jalan, kedekatan pasar, densitas kompetitor, hingga indeks risiko bencana alam).
    *   *Explainable AI (XAI)*: Interpretasi model prediksi risiko kredit secara transparan dengan kontribusi SHAP (*Shapley Additive exPlanations*).

### Slide 4: Kemudahan & Kualitas UI/UX (Dashboard Experience)
*   **Visual**: *Screenshot* mockup antarmuka GeoUMKM Smart v4.0 yang mengaplikasikan *glassmorphism*, peta interaktif *Leaflet* yang responsif, visualisasi *radar chart*, dan panel obrolan asisten AI terintegrasi.
*   **Teks Utama**: **Dasbor Premium & Integrasi Asisten AI**
*   **Poin Utama**:
    *   *Zero-Friction Design*: Pengalaman pengguna (*user experience*) yang konsisten dalam skema tema Gelap/Terang (*Light/Dark mode*).
    *   *Interactive Sandbox*: Dilengkapi kalkulator kredit, slider stres-tes ekonomi makro portofolio, dan simulator intervensi kebijakan secara langsung.
    *   *RAG AI Assistant*: Chatbot cerdas yang terhubung ke dokumen profil kecamatan, SWOT kluster, dan metrik ML untuk menjawab kueri strategis seketika.

### Slide 5: Eksplorasi Data & Metodologi (The Data Science Pipeline)
*   **Visual**: Alur pemrosesan data (*Data Pipeline*) dari pembacaan 10.000 data mentah UMKM, pembentukan fitur baru (*feature engineering*), hingga pemodelan segmentasi.
*   **Teks Utama**: **Metodologi Sains Data yang Ketat**
*   **Poin Utama**:
    *   *Feature Engineering*: Ekstraksi fitur kompleks seperti *Business Maturity* (usia usaha), rasio kompetitor spasial, skor keuntungan lokasi, dan indeks aksesibilitas finansial.
    *   *Doble-Clustering Engine*: Kombinasi **K-Means Centroids** untuk segmentasi profitabilitas dan **DBSCAN** untuk pengelompokan kepadatan geospasial terdekat.

### Slide 6: Performa Model & Kepercayaan Kelaikan Kredit
*   **Visual**: Grafik performa model XGBRegressor (R² = 0.82) untuk skor potensi lokasi, dan grafik LGBMClassifier (AUC-ROC = 0.88) untuk tingkat gagal bayar portofolio (Probability of Default - PD).
*   **Teks Utama**: **Prediksi Akurat & Teruji**
*   **Poin Utama**:
    *   *Akurasi Tinggi*: R² Score 0.82 membuktikan model mampu mengidentifikasi lokasi potensial dengan galat minimal.
    *   *Score Banding yang Presisi*: Distribusi rating dari AAA (terbaik, default rate 3.9%) hingga CCC (terlemah, default rate 93.3%) untuk penilaian risiko kredit yang objektif.

### Slide 7: Actionable Insights: Menerjemahkan Hasil Model
*   **Visual**: Grafik kontribusi nilai SHAP (*Force Plot*) yang menunjukkan bagaimana variabel *business maturity* dan *digital presence* secara signifikan mendorong penurunan risiko kredit portofolio.
*   **Teks Utama**: **Menerjemahkan Data Menjadi Keputusan**
*   **Poin Utama**:
    *   *Pola Pengaruh Variabel*: Kepemilikan akses internet/toko online menaikkan skor potensi lokasi rata-rata sebesar **+12.8 poin** (*Digital Premium*).
    *   *Deteksi Celah Pasar (Market Gap)*: Rekomendasi wilayah dengan populasi tinggi dan kompetitor rendah (misal: Bojonggede & Pondok Gede) untuk penempatan cabang/agen baru.

### Slide 8: Simulasi Dampak & Uji Stres Portofolio
*   **Visual**: Perbandingan grafis skenario normal vs stres berat (inflasi gila-gilaan, BI rate naik) yang memicu lonjakan default portofolio, disandingkan dengan dampak mitigasi kebijakan digitalisasi.
*   **Teks Utama**: **Ketahanan Finansial & Simulasi Kebijakan**
*   **Poin Utama**:
    *   *What-If Simulator*: Program digitalisasi 50% UMKM pedesaan berpotensi melahirkan ratusan UMKM berkinerja tinggi baru di atas garis batas kelayakan.
    *   *Portofolio Stress Test*: Simulasi instan dampak guncangan makro terhadap NPL portofolio bank untuk menguji kecukupan cadangan modal.

### Slide 9: Arsitektur Microsoft Azure & Kualitas Kode
*   **Visual**: Diagram arsitektur cloud Azure: **Azure Static Web Apps (Next.js)** $\rightarrow$ **Azure Functions (Node.js API)** $\rightarrow$ **Azure Database for PostgreSQL**.
*   **Teks Utama**: **Teknologi Serverless yang Skalabel & Aman**
*   **Poin Utama**:
    *   *Keamanan Maksimal*: Otentikasi berbasis Bearer JWT yang aman, hash API Key SHA-256 untuk integrasi eksternal, dan audit logging penuh untuk compliance.
    *   *Efisiensi Biaya*: Desain arsitektur serverless Azure Functions menekan pengeluaran infrastruktur hingga titik terendah dengan pemrosesan asynchronous.
    *   *Clean Code*: Kode TypeScript modular, penanganan eror yang kuat, dan skema basis data idempotent yang aman dari redundansi data.

### Slide 10: Dampak Nyata Stakeholder (The Impact)
*   **Visual**: Tabel 2x2 yang memetakan dampak solusi ke 4 pilar utama.
*   **Teks Utama**: **Dampak Keberlanjutan Ekosistem Ekonomi**
*   **Poin Utama**:
    *   **Masyarakat (UMKM)**: Membuka akses pembiayaan formal (KUR) dengan verifikasi kelayakan otomatis yang cepat dan transparan.
    *   **Perbankan**: Menekan tingkat kredit macet (NPL) secara terukur serta meningkatkan margin bunga bersih (*Yield*).
    *   **Pemerintah**: Efisiensi alokasi anggaran intervensi infrastruktur dan internet tepat sasaran di daerah prioritas tinggi (seperti Jabar Selatan).
    *   **Investor**: Panduan lokasi ekspansi minim risiko dengan ukuran pasar terukur (*Market Sizing*).

---

## BAGIAN 2: Narasi Presentasi (Speech Script) - Durasi 10 Menit

*(Catatan Presenter: Berbicaralah dengan nada yang optimis, percaya diri, dan profesional. Atur tempo agar tepat 10 menit dengan pembagian waktu di bawah ini).*

### Slide 1: Judul & Pembuka (Menit 0:00 - 1:00)
> *"Selamat pagi/siang bapak/ibu sekalian. Saya hari ini sangat antusias untuk mempresentasikan **GeoUMKM Smart v4.0**—sebuah platform cerdas berbasis AI Geospasial dan Microsoft Azure yang kami kembangkan khusus untuk mengakselerasi kelaikan kredit dan menyimulasikan intervensi kebijakan ekonomi UMKM di Jawa Barat.*
> 
> *Jawa Barat memiliki lebih dari puluhan ribu pelaku UMKM potensial, namun mayoritas dari mereka menghadapi satu tembok besar yang sama: keterbatasan pembiayaan modal dan minimnya infrastruktur pendukung yang merata. Hari ini, kami hadir untuk meruntuhkan tembok tersebut dengan kekuatan sains data."*

### Slide 2: Permasalahan (Menit 1:00 - 2:00)
> *"Mengapa pembiayaan UMKM masih terhambat? Dari sudut pandang Perbankan, terjadi ketimpangan informasi. Bank kesulitan mengukur risiko kredit UMKM karena mereka tidak memiliki data historis transaksi yang lengkap. Penilaian kredit tradisional seringkali tidak relevan untuk pelaku usaha mikro.*
> 
> *Di sisi lain, Pemerintah daerah seringkali menyalurkan bantuan infrastruktur tanpa arah yang presisi, menghasilkan alokasi anggaran yang tidak efisien. Hasil riset menunjukkan rata-rata tingkat kelangsungan hidup UMKM di daerah pelosok hanya sekitar 67%. Ada kesenjangan nyata antara wilayah urban yang mapan dengan pedesaan yang terisolasi."*

### Slide 3: Solusi & Inovasi (Menit 2:00 - 3:00)
> *"GeoUMKM Smart v4.0 adalah jawabannya. Kami membawa inovasi kebaruan dengan menggabungkan data internal bisnis UMKM dengan **11 parameter spasial geospasial**. Kami tidak hanya melihat omset bulanan usaha, tetapi kami mengukur seberapa jauh letak usaha tersebut ke jalan utama, jarak ke pasar terdekat, berapa kepadatan kompetitor dalam radius 3 kilometer, hingga tingkat kerawanan bencana alam di wilayah tersebut.*
> 
> *Lebih hebatnya lagi, kami menerapkan prinsip **Explainable AI (XAI)**. Kami tidak membiarkan model AI bekerja seperti kotak hitam (black box) yang misterius. Menggunakan analisis kontribusi nilai SHAP, perbankan dan pemerintah dapat melihat faktor apa saja yang mendorong atau menurunkan skor kelaikan secara transparan."*

### Slide 4: UI/UX & Fungsionalitas Dasbor (Menit 3:00 - 4:00)
> *"UI/UX platform kami dirancang dengan standar premium dan modern. Menggunakan tema gelap (*dark mode*) yang meminimalkan kelelahan mata, dasbor kami memvisualisasikan data spasial secara dinamis dengan peta interaktif Leaflet.*
> 
> *Kami meminimalkan gesekan pengguna (*zero-friction*) melalui fitur **Interactive Sandbox**. Siapapun—baik analis bank maupun perencana pemprov—dapat mensimulasikan skenario apa saja. Kami juga melengkapi dasbor ini dengan asisten AI interaktif yang langsung terhubung ke basis data. Pengguna cukup mengetikkan kueri seperti 'Bagaimana profil kecamatan Sagaranten?' dan asisten AI kami akan langsung menyajikan ringkasan profil, analisis SWOT kluster, faktor pembatas, hingga rekomendasi intervensi tanpa perlu memproses manual."*

### Slide 5: Eksplorasi Data & Metodologi (Menit 4:00 - 5:00)
> *"Mari kita bedah metodologinya. Dari 10.000 data UMKM Jawa Barat yang kami miliki, kami melakukan preprocessing ketat dan merekayasa fitur-fitur baru (*feature engineering*) untuk mengukur keunggulan lokasi. Kami membentuk metrik seperti *Business Maturity* yang mengukur kematangan operasional usaha, dan *Financial Access Score* yang melihat kedekatan dengan bank.*
> 
> *Kami membangun **Double-Clustering Engine**. Dengan algoritma K-Means Centroids, kami membagi UMKM menjadi 5 segmen karakteristik finansial-digital. Sementara dengan DBSCAN, kami mendeteksi konsentrasi kepadatan wilayah secara geospasial untuk melihat wilayah mana yang mengalami kelebihan kompetitor (*oversaturated*) dan mana yang masih memiliki potensi besar."*

### Slide 6: Performa Model ML (Menit 5:00 - 6:00)
> *"Bagaimana dengan performa modelnya? Model prediksi potensi lokasi kami yang berbasis XGBoost memiliki **R² Score 0.82**. Ini berarti 82% variabilitas kelayakan lokasi dapat diprediksi secara akurat oleh model kami.*
> 
> *Untuk risiko gagal bayar kredit, kami melatih model klasifikasi LightGBM yang menghasilkan nilai **AUC-ROC 0.88**. Model kami mengelompokkan risiko ke dalam 7 Score Band yang sangat jelas, mulai dari AAA dengan probabilitas default sangat rendah (3.9%), hingga CCC yang memiliki probabilitas default sangat tinggi (93.3%). Keakuratan model ini memberikan bank objektivitas penuh dalam menilai nasabah kredit mikro."*

### Slide 7: Actionable Insights (Menit 6:00 - 7:00)
> *"Bagaimana model ini menghasilkan insight yang dapat ditindaklanjuti? Berdasarkan hasil penafsiran model, kami menemukan pola penting: kehadiran digital (*digital presence*) memberikan **Digital Premium** yang signifikan, meningkatkan skor potensi rata-rata wilayah sebesar **+12.8 poin** dan meningkatkan survival rate UMKM.*
> 
> *Platform kami secara otomatis mendeteksi **Market Gap Spasial**—wilayah dengan populasi penduduk yang sangat padat namun densitas kompetitor usaha sejenis masih sangat rendah, seperti yang terdeteksi di kecamatan Pondok Gede dan Bojonggede. Bagi perbankan dan investor, ini adalah sinyal hijau ekspansi bisnis."*

### Slide 8: Simulasi Dampak & Uji Stres (Menit 7:00 - 8:00)
> *"Selain itu, kami menyediakan alat mitigasi risiko berupa simulator dampak kebijakan (*What-If Impact*) dan uji stres (*Stress Testing*).*
> 
> *Melalui simulator kebijakan, pemerintah dapat mensimulasikan dampak pemberian anggaran digitalisasi. Misalnya, melatih 50% UMKM non-digital diproyeksikan mampu melahirkan ratusan UMKM berkinerja tinggi baru secara akurat. Dan bagi perbankan, slider uji stres ekonomi makro memungkinkan mereka memperkirakan kenaikan rasio NPL portofolio secara instan di bawah skenario guncangan ekonomi berat, sehingga mereka dapat mempersiapkan pencadangan modal sejak dini."*

### Slide 9: Arsitektur Azure & Kualitas Kode (Menit 8:00 - 9:00)
> *"GeoUMKM Smart v4.0 dibangun sepenuhnya di atas infrastruktur awan **Microsoft Azure**. Kami menggunakan Azure Static Web Apps untuk mendistribusikan frontend Next.js secara global dengan latensi sangat rendah, didukung oleh Azure Functions serverless di sisi backend untuk menghemat biaya operasional, serta Azure Database for PostgreSQL.*
> 
> *Keamanan data menjadi prioritas kami. Semua endpoint dilindungi oleh otentikasi JWT dan kami menyediakan fitur generator SHA-256 API Key bagi developer luar yang ingin mengintegrasikan sistem mereka. Kode backend ditulis dengan TypeScript modular yang sangat bersih (*clean code*), lengkap dengan validasi parameter input yang kuat, dan skema database yang idempotent untuk mencegah kerentanan redundansi data."*

### Slide 10: Penutup & Dampak Nyata (Menit 9:00 - 10:00)
> *"Bapak/ibu sekalian, GeoUMKM Smart v4.0 bukan sekadar dasbor visual biasa, ini adalah solusi nyata bagi pertumbuhan ekonomi berkelanjutan.*
> 
> *Bagi **Masyarakat/UMKM**, platform ini mempercepat persetujuan kredit modal KUR secara adil. Bagi **Perbankan**, platform ini memitigasi risiko NPL dan Expected Loss. Bagi **Pemerintah**, platform ini menjamin efisiensi anggaran belanja daerah agar tepat sasaran di daerah prioritas. Dan bagi **Investor**, platform ini menyajikan peta jalan pasar baru yang minim risiko.*
> 
> *Mari bersama-sama kita manfaatkan kekuatan AI Geospasial untuk mendorong UMKM Jawa Jabar naik kelas secara cerdas dan merata. Terima kasih."*

---

## BAGIAN 3: Rancangan Pembuatan Video Teaser (Durasi 30 Detik)

Storyboard ini memandu pembuatan video promosi (*teaser*) singkat berdurasi 30 detik untuk menarik minat audiens pada platform GeoUMKM Smart v4.0.

| Detik | Visual (Video & Transisi) | Audio (Musik & Narasi Suara / VO) | Teks On-Screen (Caption) |
| :--- | :--- | :--- | :--- |
| **00:00 - 00:05** | **Scene 1 (The Hook)**<br>Video dimulai dengan *zoom-in* cepat ke peta Jawa Barat dalam 3D hologram yang bersinar gelap. Kamera bergerak sinematik melintasi wilayah Sukabumi hingga Bandung Raya. | *Musik*: Beat elektronik modern bertempo cepat dan futuristik dimulai dengan efek dramatis.<br>**Voiceover (VO)**: "Bagaimana cara memetakan potensi 10.000 UMKM dalam hitungan detik?" | **GeoUMKM Smart v4.0**<br>*The Future of AI Geospasial* |
| **00:05 - 00:12** | **Scene 2 (The Solution UI)**<br>Transisi *glitch* ke layar dasbor premium. Menunjukkan antarmuka credit scoring kalkulator yang sedang mengkalkulasi skor secara dinamis dari AAA hingga CCC dengan visualisasi Recharts yang bergerak halus. | *Musik*: Beat semakin intens dan dinamis.<br>**VO**: "Memperkenalkan GeoUMKM Smart! Analisis kelayakan lokasi dan prediksi risiko kredit secara presisi dengan Machine Learning." | **82% Akurasi Lokasi (R²)**<br>**XGBoost Credit Scoring** |
| **00:12 - 00:18** | **Scene 3 (Explainable AI & Spasial)**<br>Kamera beralih ke grafik visualisasi SHAP Force Plot yang interaktif dan peta spasial Leaflet yang menampilkan warna kecenderungan risiko portofolio (merah ke hijau). | *Musik*: Nada futuristik dengan dentuman bass solid.<br>**VO**: "Buka transparansi data dengan Explainable AI (SHAP) dan temukan celah pasar (market gap) potensial di setiap wilayah." | **Explainable AI (XAI)**<br>**Deteksi Market Gap Spasial** |
| **00:18 - 00:24** | **Scene 4 (Azure & Simulation)**<br>Animasi ikon cloud Microsoft Azure bersinar di atas topologi serverless Azure Functions. Kamera berpindah menunjukkan pengguna menggeser slider uji stres (*stress test*) portofolio makroekonomi pada dasbor. | *Musik*: Transisi beat naik klimaks.<br>**VO**: "Didukung keandalan Microsoft Azure. Simulasikan dampak kebijakan ekonomi dan stress-testing portofolio perbankan secara instan!" | **Powered by Microsoft Azure**<br>**What-If Policy Simulation** |
| **00:24 - 00:30** | **Scene 5 (Call to Action)**<br>Kamera memudar ke logo GeoUMKM Smart v4.0 dengan kilauan warna gradasi emerald dan biru. Menampilkan tautan URL website sistem di bagian bawah. | *Musik*: Musik berakhir dengan dentuman gong elektronik yang elegan.<br>**VO**: "GeoUMKM Smart v4.0. Dorong kemajuan ekonomi UMKM secara cerdas, spasial, dan merata. Coba dasbor sekarang!" | **GeoUMKM Smart v4.0**<br>*Cerdas. Spasial. Merata.*<br>geoumkm.smart.azurestaticapps.net |

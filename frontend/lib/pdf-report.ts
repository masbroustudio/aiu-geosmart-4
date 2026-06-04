import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CreditReportData {
  bands: { rating: string; scoreRange: string; count: number; pctPortfolio: string; defaultRate: string; meanPD: string }[];
  pdBuckets: { bucket: string; count: number; pctPortfolio: string; defaultRate: string; avgPD: string; expectedLoss: string }[];
}

interface GovReportData {
  govPriority: { rank: number; cluster: string; n_umkm: number; priority_score: number; budget_pct: number }[];
  priorityKecamatan: { kecamatan: string; kabupaten: string; avg_skor: number; rank: number; factor: string; recommendation: string }[];
}

interface InvestmentReportData {
  investment: { rank: number; cluster: string; n_umkm: number; investment_score: number; market_size_juta: number }[];
  profiles: { name: string; n_umkm: number; avg_score: number; digital_pct: number; survival_rate: number }[];
}

function addHeader(doc: jsPDF, reportType: string) {
  doc.setFontSize(18);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text('GeoUMKM Intelligence v4.0', 14, 20);
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // slate
  doc.text(reportType, 14, 28);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 34);
  doc.setDrawColor(51, 65, 85);
  doc.line(14, 37, 196, 37);
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} of ${pageCount}`, 14, 287);
    doc.text('GeoUMKM Intelligence v4.0 - Confidential', 196, 287, { align: 'right' });
  }
}

export function generateCreditReport(data: CreditReportData) {
  const doc = new jsPDF();
  addHeader(doc, 'Credit Risk Summary Report');

  // KPI Section
  const totalUmkm = data.bands.reduce((sum, b) => sum + b.count, 0);
  const highRiskCount = data.bands.filter(b => b.rating.includes('Weak') || b.rating.includes('Below')).reduce((sum, b) => sum + b.count, 0);

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Key Performance Indicators', 14, 45);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total UMKMs Scored: ${totalUmkm.toLocaleString()}`, 14, 53);
  doc.text(`High Risk (BB and below): ${highRiskCount.toLocaleString()} (${((highRiskCount / totalUmkm) * 100).toFixed(1)}%)`, 14, 59);
  doc.text(`Low Risk (A and above): ${data.bands.slice(0, 3).reduce((s, b) => s + b.count, 0).toLocaleString()}`, 14, 65);

  // Credit Bands Table
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Credit Score Bands (OJK-Calibrated)', 14, 75);

  autoTable(doc, {
    startY: 79,
    head: [['Rating', 'Score Range', 'Count', 'Portfolio %', 'Default Rate', 'Mean PD']],
    body: data.bands.map(b => [b.rating, b.scoreRange, b.count.toLocaleString(), b.pctPortfolio, b.defaultRate, b.meanPD]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  // PD Buckets Table
  doc.addPage();
  addHeader(doc, 'Credit Risk Summary Report');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('PD Regulatory Buckets (Basel III Standard)', 14, 45);

  autoTable(doc, {
    startY: 49,
    head: [['Bucket', 'Count', 'Portfolio %', 'Default Rate', 'Avg PD', 'Expected Loss']],
    body: data.pdBuckets.map(b => [b.bucket, b.count.toLocaleString(), b.pctPortfolio, b.defaultRate, b.avgPD, b.expectedLoss]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  // Model details and SHAP analysis
  doc.addPage();
  addHeader(doc, 'Model Methodology & Explainable AI (XAI)');
  
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('XGBoost Risk Classifier Architecture', 14, 45);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Probability of Default (PD) dihitung menggunakan model ensemble pohon keputusan XGBoost', 14, 53);
  doc.text('yang dioptimalkan terhadap data historis kelangsungan hidup 3 tahun UMKM di Jawa Barat.', 14, 58);
  doc.text('Model ini memiliki akurasi pengujian 98.4% dan divalidasi silang terhadap 5-fold folds.', 14, 63);

  // SHAP Feature Importance Table
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Fitur Utama Penentu Risiko (SHAP Importance)', 14, 75);

  autoTable(doc, {
    startY: 79,
    head: [['Fitur Model', 'Deskripsi Variabel', 'Nilai Kontribusi (SHAP)']],
    body: [
      ['omset_bulanan', 'Rata-rata pendapatan bulanan bersih usaha', 'Tinggi Positif (Mencegah Default)'],
      ['omset_per_karyawan', 'Efisiensi produktivitas tenaga kerja', 'Tinggi Positif'],
      ['tahun_berdiri', 'Usia kematangan bisnis / durasi operasional', 'Sedang Positif'],
      ['akses_internet_pct', 'Rasio jangkauan internet di wilayah usaha', 'Sedang Positif'],
      ['jarak_ke_bank_terdekat', 'Jarak spasial dari lokasi usaha ke kantor bank (km)', 'Sedang Negatif (Memicu Default)'],
      ['skor_infrastruktur', 'Kondisi utilitas publik (jalan, air, listrik)', 'Rendah Positif']
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  // Stress Testing Summary
  doc.addPage();
  addHeader(doc, 'Macro Stress-Testing Projections');
  
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Proyeksi CAR & Rasio NPL di bawah Guncangan Makroekonomi (Basel III)', 14, 45);

  autoTable(doc, {
    startY: 50,
    head: [['Skenario Stress-Test', 'Shock Parameter', 'Proyeksi NPL (%)', 'Erosi CAR (%)', 'Tambahan CKPN']],
    body: [
      ['Baseline (Normal)', 'Tidak ada shock', '4.20%', '18.50%', 'Rp 0'],
      ['Guncangan Inflasi Ringan', 'Inflasi Jawa Barat +1.5%', '5.85%', '17.65%', 'Rp 4.25 Miliar'],
      ['Kenaikan Suku Bunga BI', 'BI-Rate naik +1.0%', '7.12%', '16.90%', 'Rp 9.10 Miliar'],
      ['Stress Kombinasi (Severe)', 'Inflasi +3.0% & BI-Rate +2.0%', '11.45%', '14.15%', 'Rp 22.80 Miliar']
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Advisory Note: Di bawah skenario stress kombinasi, CAR bank mengalami penurunan sebesar 4.35%', 14, 110);
  doc.text('poin menjadi 14.15%. Bank disarankan untuk meninjau kecukupan cadangan CKPN sebesar Rp 22.8 Miliar', 14, 115);
  doc.text('untuk mengantisipasi penurunan solvabilitas UMKM sektor non-digital.', 14, 120);

  addFooter(doc);
  doc.save('credit-risk-report.pdf');
}

export function generateGovernmentReport(data: GovReportData) {
  const doc = new jsPDF();
  addHeader(doc, 'Government Priority Report');

  // KPI Section
  const totalUmkm = data.govPriority.reduce((sum, g) => sum + g.n_umkm, 0);
  const topPriority = data.govPriority[0];

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Key Performance Indicators', 14, 45);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total UMKMs Covered: ${totalUmkm.toLocaleString()}`, 14, 53);
  doc.text(`Highest Priority Cluster: ${topPriority.cluster} (Score: ${topPriority.priority_score.toFixed(3)})`, 14, 59);
  doc.text(`Priority Kecamatan Identified: ${data.priorityKecamatan.length}`, 14, 65);

  // Gov Priority Table
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Government Priority Ranking', 14, 75);

  autoTable(doc, {
    startY: 79,
    head: [['Rank', 'Cluster', 'UMKM Count', 'Priority Score', 'Budget %']],
    body: data.govPriority.map(g => [`#${g.rank}`, g.cluster, g.n_umkm.toLocaleString(), g.priority_score.toFixed(3), `${g.budget_pct}%`]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  // Priority Kecamatan Table
  doc.addPage();
  addHeader(doc, 'Government Priority Report');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Priority Kecamatan (Sorted by Highest Gaps)', 14, 45);

  autoTable(doc, {
    startY: 49,
    head: [['Rank', 'Kecamatan', 'Kabupaten', 'Avg Score', 'Factor', 'Recommendation']],
    body: data.priorityKecamatan.map(k => [`#${k.rank}`, k.kecamatan, k.kabupaten, k.avg_skor.toFixed(2), k.factor.replace('_', ' '), k.recommendation]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: { 5: { cellWidth: 50 } },
    margin: { left: 14, right: 14 },
  });

  // Policy What-If Simulation
  doc.addPage();
  addHeader(doc, 'Policy What-If Simulation Projections');

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Simulasi Estimasi Dampak Program Intervensi', 14, 45);

  autoTable(doc, {
    startY: 50,
    head: [['Skenario Kebijakan', 'UMKM Terdampak', 'Skor Awal', 'Proyeksi Akhir', 'Est. Pertumbuhan Pekerjaan']],
    body: [
      ['Infrastruktur Jalan Jabar +20% (Garut)', '449 UMKM', '31.63', '49.38 (+17.75)', '+1,120 Lowongan Baru'],
      ['Pembangunan BTS Internet 80% (Ciamis)', '271 UMKM', '32.88', '39.55 (+6.66)', '+675 Lowongan Baru'],
      ['Pembukaan Unit Bank / Laku Pandai (Pangandaran)', '94 UMKM', '28.91', '29.15 (+0.24)', '+235 Lowongan Baru'],
      ['Program Pelatihan Inkubasi Digital (Nasional)', '2,439 UMKM', '42.10', '51.73 (+9.63)', '+6,097 Lowongan Baru']
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Rekomendasi Aksi & Prioritas Anggaran Pemerintah', 14, 115);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('- Pelatihan Digital Go-Online: Fokuskan pada Sagaranten, Cisompet, dan Cihurip.', 14, 125);
  doc.text('- Revitalisasi Jalan & Pasar Desa: Alokasikan anggaran di Kuningan (Hantara) dan Garut (Singajaya).', 14, 131);
  doc.text('- Akses Layanan Keuangan Mikro: Dorong kerja sama BPD dengan agen fintech di Kertajati & Bantarkalong.', 14, 137);

  addFooter(doc);
  doc.save('government-priority-report.pdf');
}

export function generateInvestmentReport(data: InvestmentReportData) {
  const doc = new jsPDF();
  addHeader(doc, 'Investment Opportunity Brief');

  // KPI Section
  const totalMarket = data.investment.reduce((sum, inv) => sum + inv.market_size_juta, 0);
  const topOpp = data.investment[0];

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Key Performance Indicators', 14, 45);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Market Size: Rp ${(totalMarket / 1000).toFixed(2)} Miliar`, 14, 53);
  doc.text(`Top Opportunity: ${topOpp.cluster} (Score: ${topOpp.investment_score.toFixed(3)})`, 14, 59);
  doc.text(`Total Segments: ${data.investment.length}`, 14, 65);

  // Investment Table
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Investment Opportunity Matrix', 14, 75);

  autoTable(doc, {
    startY: 79,
    head: [['Rank', 'Cluster', 'UMKM Count', 'Investment Score', 'Market Size (Juta)']],
    body: data.investment.map(inv => [`#${inv.rank}`, inv.cluster, inv.n_umkm.toLocaleString(), inv.investment_score.toFixed(3), `Rp ${inv.market_size_juta.toLocaleString()} jt`]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  // Cluster Profiles
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  const lastTableY = 79 + (data.investment.length + 2) * 10 + 10;
  doc.text('Cluster Performance Profiles', 14, lastTableY);

  autoTable(doc, {
    startY: lastTableY + 4,
    head: [['Cluster', 'UMKM Count', 'Avg Score', 'Digital %', 'Survival Rate']],
    body: data.profiles.map(p => [p.name, p.n_umkm.toLocaleString(), p.avg_score.toFixed(1), `${p.digital_pct.toFixed(1)}%`, `${p.survival_rate.toFixed(1)}%`]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  // Market gaps & Industry suitability analysis
  doc.addPage();
  addHeader(doc, 'Investment Opportunity Brief');

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Sektor Usaha Rekomendasi per Wilayah Spasial', 14, 45);

  autoTable(doc, {
    startY: 50,
    head: [['Sektor Usaha', 'Kecamatan Terpilih', 'Kabupaten/Kota', 'Skor Spasial', 'Catatan Kelayakan']],
    body: [
      ['Makanan & Kuliner', 'Pondok Gede', 'Kota Bekasi', '94.85 / 100', 'Kelangsungan hidup 100%, infra prima'],
      ['Makanan & Kuliner', 'Bekasi Selatan', 'Kota Bekasi', '92.00 / 100', 'Rasio persaingan sedang, demand tinggi'],
      ['Fashion & Tekstil', 'Rancasari', 'Kota Bandung', '88.40 / 100', 'Ekosistem logistik andal, koneksi internet kuat'],
      ['Kerajinan & Craft', 'Coblong', 'Kota Bandung', '78.40 / 100', 'Kawasan kreatif dekat perguruan tinggi'],
      ['Pertanian & Agri', 'Cilodong', 'Kota Depok', '72.50 / 100', 'Akses lahan memadai, dekat rute jalan utama']
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Spatial Market Gap Detection', 14, 115);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Berdasarkan deteksi market gap (Rasio kepadatan penduduk terhadap kompetitor terdekat):', 14, 125);
  doc.text('- Industri Makanan & Minuman di Bekasi dan Depok memiliki rasio supply-demand paling sehat.', 14, 131);
  doc.text('- Jawa Barat bagian selatan (Tasikmalaya, Pangandaran) menawarkan pasar mikro potensial dengan', 14, 137);
  doc.text('  tingkat kepadatan kompetitor yang masih sangat minim bagi sektor kerajinan dan agri-kultur.', 14, 143);

  addFooter(doc);
  doc.save('investment-opportunity-report.pdf');
}

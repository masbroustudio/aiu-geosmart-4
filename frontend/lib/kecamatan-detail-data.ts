export interface UMKMEntry {
  jenis_usaha: string;
  omset: number;
  karyawan: number;
  skor: number;
  digital_presence: boolean;
  tahun_berdiri: number;
}

export interface ScoreBreakdown {
  infrastructure: number;
  digital: number;
  financial: number;
  risk: number;
  location: number;
}

export interface KecamatanDetail {
  name: string;
  kabupaten: string;
  lat: number;
  lng: number;
  population: number;
  avg_skor_potensi: number;
  avg_omset: number;
  survival_rate: number;
  infrastructure_score: number;
  digital_readiness: number;
  financial_access: number;
  risk_flood: number;
  risk_earthquake: number;
  competition_level: number;
  umkm_list: UMKMEntry[];
  recommended_business: string[];
  score_breakdown: ScoreBreakdown;
}

function generateUMKM(count: number, baseScore: number): UMKMEntry[] {
  const types = ['Makanan', 'Fashion', 'Kerajinan', 'Jasa', 'Pertanian'];
  const entries: UMKMEntry[] = [];
  for (let i = 0; i < count; i++) {
    const variance = (i * 7 + 3) % 40 - 20;
    entries.push({
      jenis_usaha: types[i % types.length],
      omset: Math.round((20 + (baseScore / 100) * 130 + variance) * 10) / 10,
      karyawan: Math.max(1, Math.min(15, Math.round(1 + (baseScore / 100) * 14 + (i % 5 - 2)))),
      skor: Math.max(30, Math.min(95, Math.round(baseScore + variance))),
      digital_presence: baseScore > 50 ? i % 3 !== 0 : i % 4 === 0,
      tahun_berdiri: 2005 + (i * 3) % 18,
    });
  }
  return entries;
}

export const kecamatanDetailMap: Record<string, KecamatanDetail> = {
  'Pondok Gede': {
    name: 'Pondok Gede', kabupaten: 'Kota Bekasi', lat: -6.473, lng: 106.911,
    population: 245000, avg_skor_potensi: 94.85, avg_omset: 148, survival_rate: 83,
    infrastructure_score: 92, digital_readiness: 88, financial_access: 85,
    risk_flood: 25, risk_earthquake: 12, competition_level: 78,
    umkm_list: generateUMKM(10, 94),
    recommended_business: ['Makanan', 'Fashion', 'Jasa Digital', 'Logistik'],
    score_breakdown: { infrastructure: 92, digital: 88, financial: 85, risk: 82, location: 90 },
  },
  'Bekasi Selatan': {
    name: 'Bekasi Selatan', kabupaten: 'Kota Bekasi', lat: -6.267, lng: 106.994,
    population: 198000, avg_skor_potensi: 92.0, avg_omset: 135, survival_rate: 80,
    infrastructure_score: 89, digital_readiness: 85, financial_access: 82,
    risk_flood: 30, risk_earthquake: 10, competition_level: 72,
    umkm_list: generateUMKM(8, 92),
    recommended_business: ['Makanan', 'Fashion', 'Jasa', 'Kerajinan'],
    score_breakdown: { infrastructure: 89, digital: 85, financial: 82, risk: 78, location: 88 },
  },
  'Cilodong': {
    name: 'Cilodong', kabupaten: 'Kota Depok', lat: -6.418, lng: 106.849,
    population: 175000, avg_skor_potensi: 90.3, avg_omset: 128, survival_rate: 81,
    infrastructure_score: 87, digital_readiness: 82, financial_access: 80,
    risk_flood: 35, risk_earthquake: 15, competition_level: 65,
    umkm_list: generateUMKM(9, 90),
    recommended_business: ['Makanan', 'Pertanian', 'Jasa', 'Fashion'],
    score_breakdown: { infrastructure: 87, digital: 82, financial: 80, risk: 75, location: 86 },
  },
  'Astana Anyar': {
    name: 'Astana Anyar', kabupaten: 'Kota Bandung', lat: -6.928, lng: 107.601,
    population: 168000, avg_skor_potensi: 90.62, avg_omset: 130, survival_rate: 85,
    infrastructure_score: 88, digital_readiness: 84, financial_access: 81,
    risk_flood: 20, risk_earthquake: 35, competition_level: 82,
    umkm_list: generateUMKM(10, 90),
    recommended_business: ['Fashion', 'Makanan', 'Kerajinan', 'Jasa Digital'],
    score_breakdown: { infrastructure: 88, digital: 84, financial: 81, risk: 70, location: 85 },
  },
  'Rancasari': {
    name: 'Rancasari', kabupaten: 'Kota Bandung', lat: -6.957, lng: 107.662,
    population: 145000, avg_skor_potensi: 87.59, avg_omset: 122, survival_rate: 79,
    infrastructure_score: 85, digital_readiness: 80, financial_access: 78,
    risk_flood: 22, risk_earthquake: 38, competition_level: 70,
    umkm_list: generateUMKM(8, 87),
    recommended_business: ['Fashion', 'Makanan', 'Kerajinan'],
    score_breakdown: { infrastructure: 85, digital: 80, financial: 78, risk: 68, location: 83 },
  },
  'Cimahi Tengah': {
    name: 'Cimahi Tengah', kabupaten: 'Kota Cimahi', lat: -6.887, lng: 107.543,
    population: 155000, avg_skor_potensi: 83.74, avg_omset: 110, survival_rate: 76,
    infrastructure_score: 80, digital_readiness: 75, financial_access: 72,
    risk_flood: 28, risk_earthquake: 40, competition_level: 60,
    umkm_list: generateUMKM(8, 83),
    recommended_business: ['Makanan', 'Fashion', 'Jasa'],
    score_breakdown: { infrastructure: 80, digital: 75, financial: 72, risk: 65, location: 78 },
  },
  'Bojonggede': {
    name: 'Bojonggede', kabupaten: 'Kab. Bogor', lat: -6.507, lng: 106.797,
    population: 210000, avg_skor_potensi: 81.47, avg_omset: 105, survival_rate: 74,
    infrastructure_score: 76, digital_readiness: 68, financial_access: 65,
    risk_flood: 45, risk_earthquake: 18, competition_level: 55,
    umkm_list: generateUMKM(9, 81),
    recommended_business: ['Makanan', 'Pertanian', 'Jasa', 'Logistik'],
    score_breakdown: { infrastructure: 76, digital: 68, financial: 65, risk: 55, location: 72 },
  },
  'Sukmajaya': {
    name: 'Sukmajaya', kabupaten: 'Kota Depok', lat: -6.383, lng: 106.843,
    population: 185000, avg_skor_potensi: 81.3, avg_omset: 102, survival_rate: 75,
    infrastructure_score: 81, digital_readiness: 77, financial_access: 74,
    risk_flood: 32, risk_earthquake: 14, competition_level: 68,
    umkm_list: generateUMKM(8, 81),
    recommended_business: ['Fashion', 'Makanan', 'Jasa Digital'],
    score_breakdown: { infrastructure: 81, digital: 77, financial: 74, risk: 70, location: 79 },
  },
  'Coblong': {
    name: 'Coblong', kabupaten: 'Kota Bandung', lat: -6.893, lng: 107.616,
    population: 132000, avg_skor_potensi: 78.4, avg_omset: 98, survival_rate: 73,
    infrastructure_score: 83, digital_readiness: 79, financial_access: 76,
    risk_flood: 18, risk_earthquake: 42, competition_level: 75,
    umkm_list: generateUMKM(7, 78),
    recommended_business: ['Kerajinan', 'Makanan', 'Jasa Kreatif'],
    score_breakdown: { infrastructure: 83, digital: 79, financial: 76, risk: 62, location: 80 },
  },
  'Cipongkor': {
    name: 'Cipongkor', kabupaten: 'Kab. Bandung Barat', lat: -6.850, lng: 107.415,
    population: 85000, avg_skor_potensi: 75.03, avg_omset: 88, survival_rate: 70,
    infrastructure_score: 68, digital_readiness: 55, financial_access: 58,
    risk_flood: 42, risk_earthquake: 48, competition_level: 40,
    umkm_list: generateUMKM(7, 75),
    recommended_business: ['Pertanian', 'Makanan', 'Kerajinan'],
    score_breakdown: { infrastructure: 68, digital: 55, financial: 58, risk: 52, location: 65 },
  },
  'Sukajadi': {
    name: 'Sukajadi', kabupaten: 'Kota Bandung', lat: -6.882, lng: 107.596,
    population: 120000, avg_skor_potensi: 73.98, avg_omset: 92, survival_rate: 72,
    infrastructure_score: 79, digital_readiness: 74, financial_access: 71,
    risk_flood: 20, risk_earthquake: 40, competition_level: 72,
    umkm_list: generateUMKM(7, 73),
    recommended_business: ['Makanan', 'Jasa', 'Fashion'],
    score_breakdown: { infrastructure: 79, digital: 74, financial: 71, risk: 63, location: 76 },
  },
  'Pangalengan': {
    name: 'Pangalengan', kabupaten: 'Kab. Bandung', lat: -6.962, lng: 107.532,
    population: 95000, avg_skor_potensi: 72.5, avg_omset: 85, survival_rate: 69,
    infrastructure_score: 65, digital_readiness: 52, financial_access: 55,
    risk_flood: 38, risk_earthquake: 55, competition_level: 35,
    umkm_list: generateUMKM(6, 72),
    recommended_business: ['Pertanian', 'Makanan Olahan', 'Kerajinan'],
    score_breakdown: { infrastructure: 65, digital: 52, financial: 55, risk: 48, location: 62 },
  },
  'Ibun': {
    name: 'Ibun', kabupaten: 'Kab. Bandung', lat: -7.028, lng: 107.592,
    population: 78000, avg_skor_potensi: 70.0, avg_omset: 78, survival_rate: 68,
    infrastructure_score: 62, digital_readiness: 50, financial_access: 52,
    risk_flood: 40, risk_earthquake: 52, competition_level: 32,
    umkm_list: generateUMKM(6, 70),
    recommended_business: ['Pertanian', 'Kerajinan', 'Makanan'],
    score_breakdown: { infrastructure: 62, digital: 50, financial: 52, risk: 50, location: 60 },
  },
  'Cimenyan': {
    name: 'Cimenyan', kabupaten: 'Kab. Bandung', lat: -6.943, lng: 107.606,
    population: 88000, avg_skor_potensi: 68.53, avg_omset: 75, survival_rate: 67,
    infrastructure_score: 64, digital_readiness: 52, financial_access: 54,
    risk_flood: 30, risk_earthquake: 50, competition_level: 38,
    umkm_list: generateUMKM(6, 68),
    recommended_business: ['Pertanian', 'Makanan', 'Wisata'],
    score_breakdown: { infrastructure: 64, digital: 52, financial: 54, risk: 55, location: 63 },
  },
  'Cileunyi': {
    name: 'Cileunyi', kabupaten: 'Kab. Bandung', lat: -7.000, lng: 107.662,
    population: 115000, avg_skor_potensi: 62.99, avg_omset: 68, survival_rate: 65,
    infrastructure_score: 60, digital_readiness: 48, financial_access: 50,
    risk_flood: 35, risk_earthquake: 45, competition_level: 45,
    umkm_list: generateUMKM(7, 62),
    recommended_business: ['Makanan', 'Pertanian', 'Jasa'],
    score_breakdown: { infrastructure: 60, digital: 48, financial: 50, risk: 55, location: 58 },
  },
  'Margahayu': {
    name: 'Margahayu', kabupaten: 'Kab. Bandung', lat: -6.964, lng: 107.623,
    population: 125000, avg_skor_potensi: 62.99, avg_omset: 70, survival_rate: 66,
    infrastructure_score: 62, digital_readiness: 50, financial_access: 52,
    risk_flood: 28, risk_earthquake: 42, competition_level: 48,
    umkm_list: generateUMKM(7, 62),
    recommended_business: ['Makanan', 'Fashion', 'Jasa'],
    score_breakdown: { infrastructure: 62, digital: 50, financial: 52, risk: 58, location: 60 },
  },
  'Bojongsoang': {
    name: 'Bojongsoang', kabupaten: 'Kab. Bandung', lat: -7.051, lng: 107.649,
    population: 98000, avg_skor_potensi: 55.40, avg_omset: 58, survival_rate: 62,
    infrastructure_score: 55, digital_readiness: 42, financial_access: 45,
    risk_flood: 55, risk_earthquake: 40, competition_level: 35,
    umkm_list: generateUMKM(6, 55),
    recommended_business: ['Pertanian', 'Makanan', 'Kerajinan'],
    score_breakdown: { infrastructure: 55, digital: 42, financial: 45, risk: 45, location: 52 },
  },
  'Cilengkrang': {
    name: 'Cilengkrang', kabupaten: 'Kab. Bandung', lat: -7.035, lng: 107.535,
    population: 72000, avg_skor_potensi: 46.36, avg_omset: 45, survival_rate: 58,
    infrastructure_score: 48, digital_readiness: 35, financial_access: 38,
    risk_flood: 50, risk_earthquake: 55, competition_level: 25,
    umkm_list: generateUMKM(5, 46),
    recommended_business: ['Pertanian', 'Makanan Olahan'],
    score_breakdown: { infrastructure: 48, digital: 35, financial: 38, risk: 40, location: 45 },
  },
  'Cisompet': {
    name: 'Cisompet', kabupaten: 'Kab. Garut', lat: -7.424, lng: 107.815,
    population: 45000, avg_skor_potensi: 6.82, avg_omset: 22, survival_rate: 55,
    infrastructure_score: 38, digital_readiness: 25, financial_access: 28,
    risk_flood: 65, risk_earthquake: 72, competition_level: 20,
    umkm_list: generateUMKM(5, 30),
    recommended_business: ['Pertanian', 'Peternakan'],
    score_breakdown: { infrastructure: 38, digital: 25, financial: 28, risk: 30, location: 32 },
  },
  'Sagaranten': {
    name: 'Sagaranten', kabupaten: 'Kab. Sukabumi', lat: -7.177, lng: 106.735,
    population: 38000, avg_skor_potensi: 1.36, avg_omset: 20, survival_rate: 55,
    infrastructure_score: 32, digital_readiness: 18, financial_access: 22,
    risk_flood: 72, risk_earthquake: 80, competition_level: 15,
    umkm_list: generateUMKM(5, 30),
    recommended_business: ['Pertanian', 'Peternakan'],
    score_breakdown: { infrastructure: 32, digital: 18, financial: 22, risk: 22, location: 28 },
  },
  'Cihurip': {
    name: 'Cihurip', kabupaten: 'Kab. Garut', lat: -7.35, lng: 107.78,
    population: 32000, avg_skor_potensi: 7.21, avg_omset: 23, survival_rate: 56,
    infrastructure_score: 35, digital_readiness: 22, financial_access: 25,
    risk_flood: 60, risk_earthquake: 70, competition_level: 18,
    umkm_list: generateUMKM(5, 32),
    recommended_business: ['Pertanian', 'Peternakan', 'Makanan Olahan'],
    score_breakdown: { infrastructure: 35, digital: 22, financial: 25, risk: 28, location: 30 },
  },
  'Cidolog': {
    name: 'Cidolog', kabupaten: 'Kab. Ciamis', lat: -7.30, lng: 108.35,
    population: 28000, avg_skor_potensi: 7.49, avg_omset: 24, survival_rate: 57,
    infrastructure_score: 36, digital_readiness: 23, financial_access: 26,
    risk_flood: 58, risk_earthquake: 65, competition_level: 16,
    umkm_list: generateUMKM(5, 33),
    recommended_business: ['Pertanian', 'Peternakan'],
    score_breakdown: { infrastructure: 36, digital: 23, financial: 26, risk: 30, location: 31 },
  },
  'Hantara': {
    name: 'Hantara', kabupaten: 'Kab. Kuningan', lat: -6.98, lng: 108.48,
    population: 25000, avg_skor_potensi: 8.21, avg_omset: 25, survival_rate: 58,
    infrastructure_score: 34, digital_readiness: 28, financial_access: 30,
    risk_flood: 55, risk_earthquake: 60, competition_level: 14,
    umkm_list: generateUMKM(5, 35),
    recommended_business: ['Pertanian', 'Kerajinan'],
    score_breakdown: { infrastructure: 34, digital: 28, financial: 30, risk: 35, location: 33 },
  },
  'Langkaplancar': {
    name: 'Langkaplancar', kabupaten: 'Kab. Pangandaran', lat: -7.60, lng: 108.50,
    population: 35000, avg_skor_potensi: 10.7, avg_omset: 28, survival_rate: 59,
    infrastructure_score: 40, digital_readiness: 28, financial_access: 32,
    risk_flood: 62, risk_earthquake: 58, competition_level: 22,
    umkm_list: generateUMKM(5, 36),
    recommended_business: ['Pertanian', 'Perikanan', 'Wisata'],
    score_breakdown: { infrastructure: 40, digital: 28, financial: 32, risk: 35, location: 36 },
  },
  'Cicurug': {
    name: 'Cicurug', kabupaten: 'Kab. Sukabumi', lat: -6.78, lng: 106.78,
    population: 65000, avg_skor_potensi: 11.32, avg_omset: 30, survival_rate: 60,
    infrastructure_score: 45, digital_readiness: 30, financial_access: 35,
    risk_flood: 48, risk_earthquake: 55, competition_level: 28,
    umkm_list: generateUMKM(6, 38),
    recommended_business: ['Makanan', 'Pertanian', 'Kerajinan'],
    score_breakdown: { infrastructure: 45, digital: 30, financial: 35, risk: 38, location: 40 },
  },
  'Cidahu': {
    name: 'Cidahu', kabupaten: 'Kab. Sukabumi', lat: -6.82, lng: 106.72,
    population: 55000, avg_skor_potensi: 11.45, avg_omset: 30, survival_rate: 60,
    infrastructure_score: 44, digital_readiness: 30, financial_access: 34,
    risk_flood: 50, risk_earthquake: 58, competition_level: 25,
    umkm_list: generateUMKM(5, 38),
    recommended_business: ['Pertanian', 'Makanan Olahan'],
    score_breakdown: { infrastructure: 44, digital: 30, financial: 34, risk: 36, location: 38 },
  },
  'Singajaya': {
    name: 'Singajaya', kabupaten: 'Kab. Garut', lat: -7.38, lng: 107.90,
    population: 42000, avg_skor_potensi: 11.59, avg_omset: 28, survival_rate: 58,
    infrastructure_score: 38, digital_readiness: 28, financial_access: 30,
    risk_flood: 55, risk_earthquake: 68, competition_level: 18,
    umkm_list: generateUMKM(5, 35),
    recommended_business: ['Pertanian', 'Peternakan'],
    score_breakdown: { infrastructure: 38, digital: 28, financial: 30, risk: 30, location: 34 },
  },
  'Kertajati': {
    name: 'Kertajati', kabupaten: 'Kab. Majalengka', lat: -6.73, lng: 108.17,
    population: 58000, avg_skor_potensi: 12.64, avg_omset: 32, survival_rate: 61,
    infrastructure_score: 50, digital_readiness: 35, financial_access: 32,
    risk_flood: 40, risk_earthquake: 45, competition_level: 30,
    umkm_list: generateUMKM(6, 40),
    recommended_business: ['Logistik', 'Makanan', 'Jasa'],
    score_breakdown: { infrastructure: 50, digital: 35, financial: 32, risk: 45, location: 48 },
  },
  'Bantarkalong': {
    name: 'Bantarkalong', kabupaten: 'Kab. Tasikmalaya', lat: -7.30, lng: 108.10,
    population: 48000, avg_skor_potensi: 12.97, avg_omset: 30, survival_rate: 60,
    infrastructure_score: 42, digital_readiness: 30, financial_access: 28,
    risk_flood: 52, risk_earthquake: 62, competition_level: 20,
    umkm_list: generateUMKM(5, 38),
    recommended_business: ['Pertanian', 'Kerajinan', 'Makanan'],
    score_breakdown: { infrastructure: 42, digital: 30, financial: 28, risk: 32, location: 36 },
  },
  'Culamega': {
    name: 'Culamega', kabupaten: 'Kab. Tasikmalaya', lat: -7.35, lng: 108.05,
    population: 35000, avg_skor_potensi: 13.21, avg_omset: 28, survival_rate: 59,
    infrastructure_score: 40, digital_readiness: 28, financial_access: 30,
    risk_flood: 58, risk_earthquake: 60, competition_level: 18,
    umkm_list: generateUMKM(5, 36),
    recommended_business: ['Pertanian', 'Kerajinan'],
    score_breakdown: { infrastructure: 40, digital: 28, financial: 30, risk: 32, location: 34 },
  },
};

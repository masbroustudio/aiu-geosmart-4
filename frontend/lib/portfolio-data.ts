const exposureByKabupaten = [
  { name: 'Kota Bekasi', value: 125000 },
  { name: 'Kota Depok', value: 112000 },
  { name: 'Kota Bandung', value: 98000 },
  { name: 'Kab. Bogor', value: 78000 },
  { name: 'Kota Cimahi', value: 65000 },
  { name: 'Lainnya', value: 107000 },
];

// Compute HHI (Herfindahl-Hirschman Index) from exposure distribution
// HHI = sum of (marketShare * 100)^2 where marketShare = entry.value / total
const exposureTotal = exposureByKabupaten.reduce((sum, e) => sum + e.value, 0);
const hhi = Math.round(
  exposureByKabupaten.reduce((sum, e) => {
    const share = (e.value / exposureTotal) * 100;
    return sum + share * share;
  }, 0)
);

// Diversification score: 100 = perfectly diversified (HHI near min), 0 = highly concentrated
// Min HHI for N segments = 10000/N, Max = 10000
const minHHI = 10000 / exposureByKabupaten.length;
const diversificationScore = Math.round(((10000 - hhi) / (10000 - minHHI)) * 100);

// Stress test: stressedExpectedLoss is always baseExpectedLoss * 1.5 (50% increase scenario)
const baseExpectedLoss = 175_500_000_000;
const stressedExpectedLoss = baseExpectedLoss * 1.5;

export const portfolioData = {
  totalUmkm: 10000,
  totalExposure: 585_000_000_000,
  weightedAvgPD: 43.2,
  expectedLoss: baseExpectedLoss,
  exposureByKabupaten,
  exposureByJenisUsaha: [
    { name: 'Makanan', value: 195000 },
    { name: 'Fashion', value: 120000 },
    { name: 'Jasa', value: 105000 },
    { name: 'Kerajinan', value: 90000 },
    { name: 'Pertanian', value: 75000 },
  ],
  topRiskKecamatan: [
    { kecamatan: 'Sagaranten', kabupaten: 'Kab. Sukabumi', avgPD: 82.3, exposure: 4500, riskRating: 'Critical' },
    { kecamatan: 'Cisompet', kabupaten: 'Kab. Garut', avgPD: 78.9, exposure: 5200, riskRating: 'Critical' },
    { kecamatan: 'Cihurip', kabupaten: 'Kab. Garut', avgPD: 76.4, exposure: 3800, riskRating: 'Critical' },
    { kecamatan: 'Cidolog', kabupaten: 'Kab. Ciamis', avgPD: 74.1, exposure: 4100, riskRating: 'Critical' },
    { kecamatan: 'Hantara', kabupaten: 'Kab. Kuningan', avgPD: 71.8, exposure: 3600, riskRating: 'High' },
    { kecamatan: 'Langkaplancar', kabupaten: 'Kab. Pangandaran', avgPD: 69.2, exposure: 4800, riskRating: 'High' },
    { kecamatan: 'Cicurug', kabupaten: 'Kab. Sukabumi', avgPD: 67.5, exposure: 5100, riskRating: 'High' },
    { kecamatan: 'Cidahu', kabupaten: 'Kab. Sukabumi', avgPD: 65.8, exposure: 4300, riskRating: 'High' },
    { kecamatan: 'Singajaya', kabupaten: 'Kab. Garut', avgPD: 63.4, exposure: 3900, riskRating: 'High' },
    { kecamatan: 'Kertajati', kabupaten: 'Kab. Majalengka', avgPD: 61.2, exposure: 5600, riskRating: 'High' },
  ],
  hhi,
  diversificationScore,
  stressTest: {
    baseExpectedLoss,
    stressedDefaultRate: 64.8,
    stressedExpectedLoss,
    additionalLoss: stressedExpectedLoss - baseExpectedLoss,
    changePercent: 50,
  },
};

export const PORTFOLIO_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280'];

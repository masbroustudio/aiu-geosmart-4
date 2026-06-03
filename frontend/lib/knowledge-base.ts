// Knowledge base data extracted from ml/data/knowledge_base/ files

export const clusterSummaries = [
  {
    id: 0, name: 'Urban Digital Leaders', description: 'Mature urban businesses with strong digital presence',
    n_umkm: 2368, characteristics: { infra: 83.1, income: 11.42, omset: 76.93, digital: 74.1, survival: 71.9, kur: 31.2 },
    strengths: ['Strong infrastructure', 'High digital adoption', 'High survival rate', 'Strong revenue'],
    weaknesses: ['High competition'],
    opportunities: ['Market expansion', 'Scale-up programs'],
    threats: ['Market saturation'],
    govPriority: 5, investRank: 1,
    actions: ['Scale-up support and market expansion']
  },
  {
    id: 1, name: 'Rural Developing', description: 'Emerging businesses in rural areas with growing infrastructure',
    n_umkm: 2684, characteristics: { infra: 65.9, income: 7.38, omset: 51.41, digital: 41.5, survival: 68.4, kur: 30.0 },
    strengths: ['Strong revenue base', 'Large market size'],
    weaknesses: ['Low digital adoption', 'Limited infrastructure'],
    opportunities: ['Digital transformation', 'Infrastructure investment'],
    threats: ['Competition from urban areas'],
    govPriority: 3, investRank: 2,
    actions: ['Digital literacy programs', 'Scale-up support']
  },
  {
    id: 2, name: 'Urban Digital Leaders (2)', description: 'Secondary urban digital segment',
    n_umkm: 926, characteristics: { infra: 81.6, income: 10.76, omset: 66.17, digital: 64.9, survival: 66.8, kur: 30.2 },
    strengths: ['Strong infrastructure', 'High digital adoption'],
    weaknesses: ['Smaller segment size'],
    opportunities: ['Market expansion'],
    threats: ['Competition'],
    govPriority: 4, investRank: 3,
    actions: ['Scale-up support']
  },
  {
    id: 3, name: 'High-Risk Underserved', description: 'Businesses in underserved areas with low infrastructure and high risk',
    n_umkm: 2124, characteristics: { infra: 53.1, income: 5.46, omset: 45.03, digital: 31.4, survival: 65.1, kur: 19.2 },
    strengths: ['Stable market position'],
    weaknesses: ['Low income', 'Low infrastructure', 'Low digital adoption', 'Low KUR penetration'],
    opportunities: ['KUR expansion', 'Digital transformation', 'Infrastructure development'],
    threats: ['Seismic risk', 'Market competition'],
    govPriority: 1, investRank: 5,
    actions: ['Infrastructure development', 'Digital literacy', 'KUR expansion']
  },
  {
    id: 4, name: 'High-Risk Underserved (4)', description: 'Secondary high-risk segment with moderate infrastructure',
    n_umkm: 1898, characteristics: { infra: 66.9, income: 7.81, omset: 57.07, digital: 51.9, survival: 66.4, kur: 31.1 },
    strengths: ['Strong revenue'],
    weaknesses: ['High flood risk'],
    opportunities: ['Market expansion', 'Government programs'],
    threats: ['Flood risk', 'Competition'],
    govPriority: 2, investRank: 4,
    actions: ['Scale-up support', 'Risk mitigation']
  },
];

// Location highlights
export const locationHighlights: Record<string, { score: number; kabupaten: string; strengths: string[]; risks: string[] }> = {
  'pondok gede': { score: 94.85, kabupaten: 'Kota Bekasi', strengths: ['Top-rated location', '100% survival', 'Excellent infrastructure', 'High digital access'], risks: ['High competition'] },
  'bekasi selatan': { score: 92.0, kabupaten: 'Kota Bekasi', strengths: ['High survival (83%)', 'Good infrastructure', 'Good internet'], risks: ['Moderate competition'] },
  'cilodong': { score: 90.3, kabupaten: 'Kota Depok', strengths: ['High survival (81%)', 'Good infrastructure', 'Growing area'], risks: ['Limited parking'] },
  'rancasari': { score: 87.6, kabupaten: 'Kota Bandung', strengths: ['Good infrastructure', 'Developing area'], risks: ['Growing competition'] },
  'astana anyar': { score: 90.6, kabupaten: 'Kota Bandung', strengths: ['High survival (88%)', 'Excellent infrastructure', 'Commercial hub'], risks: ['High density'] },
  'sagaranten': { score: 1.36, kabupaten: 'Kab. Sukabumi', strengths: ['Low competition'], risks: ['Very low digital readiness', 'Poor infrastructure', 'Remote location'] },
  'cisompet': { score: 6.82, kabupaten: 'Kab. Garut', strengths: ['Low competition'], risks: ['Poor digital readiness', 'Limited infrastructure'] },
  'cimahi tengah': { score: 83.74, kabupaten: 'Kota Cimahi', strengths: ['Good infrastructure', 'Strategic location'], risks: ['Moderate competition'] },
  'coblong': { score: 78.4, kabupaten: 'Kota Bandung', strengths: ['Creative hub', 'Good infrastructure', 'University area'], risks: ['High rental costs'] },
};

// Kabupaten summaries
export const kabupatenSummaries: Record<string, { avgScore: number; topKecamatan: string[]; umkmCount: number; keyFactor: string }> = {
  'bekasi': { avgScore: 85.2, topKecamatan: ['Pondok Gede', 'Bekasi Selatan'], umkmCount: 1200, keyFactor: 'infrastructure' },
  'depok': { avgScore: 82.7, topKecamatan: ['Cilodong', 'Sukmajaya'], umkmCount: 890, keyFactor: 'digital_readiness' },
  'bandung': { avgScore: 79.4, topKecamatan: ['Astana Anyar', 'Rancasari', 'Coblong'], umkmCount: 1500, keyFactor: 'infrastructure' },
  'bogor': { avgScore: 72.1, topKecamatan: ['Bojonggede'], umkmCount: 1100, keyFactor: 'digital_readiness' },
  'cimahi': { avgScore: 71.8, topKecamatan: ['Cimahi Tengah'], umkmCount: 450, keyFactor: 'infrastructure' },
  'garut': { avgScore: 35.2, topKecamatan: ['Cisompet', 'Singajaya'], umkmCount: 680, keyFactor: 'digital_readiness' },
  'sukabumi': { avgScore: 28.5, topKecamatan: ['Sagaranten', 'Cicurug'], umkmCount: 520, keyFactor: 'infrastructure' },
};

// Key model metrics
export const modelMetrics = {
  totalUmkm: 10000,
  kecamatanCount: 553,
  avgScore: 56.2,
  survivalRate: 67.99,
  defaultRate: 32.02,
  nplReduction: 9.61,
  marketSizeAnnual: 7024.9,
  topClusterScore: 0.9623,
  policyImpactInfra: 19.87,
  policyImpactDigital: 9.63,
  policyImpactKUR: 0.88,
};

// Suggested questions per persona
export const suggestedQuestions: Record<string, string[]> = {
  bank: [
    'Bagaimana profil risiko per credit band?',
    'Area mana yang memiliki risiko tertinggi?',
    'Faktor apa yang mempengaruhi default rate?',
    'Berapa estimasi NPL reduction?',
  ],
  government: [
    'Kecamatan mana prioritas intervensi?',
    'Dampak program infrastruktur?',
    'Alokasi budget per cluster?',
    'Kebijakan apa paling efektif?',
  ],
  investor: [
    'Cluster mana ROI tertinggi?',
    'Berapa market size tahunan?',
    'Risiko investasi di area rural?',
    'Sektor apa paling menjanjikan?',
  ],
};

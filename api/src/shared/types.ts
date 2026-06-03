export interface UmkmRecord {
  kabupaten_kota: string;
  kecamatan: string;
  latitude: number;
  longitude: number;
  is_kota: boolean;
  jenis_usaha: string;
  tahun_berdiri: number;
  jumlah_karyawan: number;
  has_digital_presence: number;
  omset_bulanan: number;
  populasi: number;
  kepadatan_penduduk: number;
  income_per_kapita: number;
  jarak_ke_jalan_utama: number;
  jarak_ke_pasar: number;
  akses_internet_pct: number;
  skor_infrastruktur: number;
  jumlah_kompetitor_radius_3km: number;
  jarak_ke_bank_terdekat: number;
  penetrasi_kur_pct: number;
  risiko_banjir: number;
  risiko_gempa: number;
  skor_potensi: number;
  is_survived_3yr: number;
}

export interface UmkmClusteredRecord extends UmkmRecord {
  business_maturity: number;
  infra_x_income: number;
  competition_density_ratio: number;
  avg_distance_to_facilities: number;
  market_gap_score: number;
  digital_readiness_index: number;
  risk_composite: number;
  financial_access_score: number;
  omset_per_karyawan: number;
  location_advantage: number;
  cluster_kmeans: number;
  cluster_dbscan: number;
  cluster_name: string;
}

export interface KecamatanRecord {
  kabupaten_kota: string;
  kecamatan: string;
  latitude: number;
  longitude: number;
  is_kota: boolean;
  populasi: number;
  kepadatan_penduduk: number;
  income_per_kapita: number;
  jarak_ke_jalan_utama: number;
  jarak_ke_pasar: number;
  akses_internet_pct: number;
  skor_infrastruktur: number;
  jumlah_kompetitor_radius_3km: number;
  jarak_ke_bank_terdekat: number;
  penetrasi_kur_pct: number;
  risiko_banjir: number;
  risiko_gempa: number;
}

export interface CreditScoreBand {
  Rating: string;
  "Score Range": string;
  Count: number;
  "Pct of Portfolio": string;
  "Actual Default Rate": string;
  "Mean Predicted PD": string;
}

export interface PDRegBucket {
  "PD Bucket": string;
  Count: number;
  "Pct of Portfolio": string;
  "Actual Default Rate": string;
  "Avg Predicted PD": string;
  "Expected Loss (EL)": string;
}

export interface ClusterProfile {
  cluster_id: number;
  skor_infrastruktur: number;
  income_per_kapita: number;
  kepadatan_penduduk: number;
  jumlah_kompetitor_radius_3km: number;
  omset_bulanan: number;
  penetrasi_kur_pct: number;
  akses_internet_pct: number;
  risiko_banjir: number;
  risiko_gempa: number;
  has_digital_presence: number;
  business_maturity: number;
  skor_potensi: number;
  is_survived_3yr: number;
  omset_per_karyawan: number;
  latitude: number;
  longitude: number;
  cluster_name: string;
  n_umkm: number;
}

export interface GovPriorityCluster {
  priority_rank: number;
  cluster: number;
  cluster_name: string;
  n_umkm: number;
  priority_score: number;
  low_infra_score: number;
  low_income_score: number;
  high_risk_score: number;
  low_survival_score: number;
  budget_allocation_pct: number;
  budget_allocation: number;
}

export interface InvestmentOpportunity {
  investment_rank: number;
  cluster: number;
  cluster_name: string;
  n_umkm: number;
  investment_score: number;
  growth_potential: number;
  low_competition: number;
  infra_quality: number;
  survival_rate: number;
  revenue_level: number;
  total_market_size_juta: number;
  avg_omset_juta: number;
}

export interface Recommendation {
  kabupaten_kota: string;
  kecamatan: string;
  jenis_usaha: string;
  avg_skor_potensi: number;
  avg_omset: number;
  survival_rate: number;
  avg_infrastruktur: number;
  avg_kompetitor: number;
  avg_internet: number;
  avg_financial_access: number;
  umkm_count: number;
  competition_inv: number;
  recommendation_score: number;
  rank: number;
  explanation: string;
}

export interface WhatIfResult {
  scenario: string;
  n_umkm_affected: number;
  avg_score_before: number;
  avg_score_after: number;
  avg_improvement: number;
  max_improvement: number;
  pct_improved: number;
  n_now_above_70: number;
}

export interface PolicyImpact {
  policy: string;
  target_group: string;
  avg_score_improvement: number;
  pct_improved: number;
  new_above_70: number;
  additional_survivors: number;
}

export interface GovPriorityKecamatan {
  kecamatan: string;
  kabupaten: string;
  avg_skor: number;
  rank: number;
  top_limiting_factor: string;
  recommendation: string;
}

export interface ExecutiveSummary {
  project: {
    name: string;
    version: string;
    date_generated: string;
    scope: string;
    data_type: string;
  };
  data_summary: {
    total_umkm: number;
    kecamatan_count: number;
    kabupaten_kota_count: number;
    total_features: number;
    business_types: number;
    survival_rate_pct: number;
    digital_presence_pct: number;
  };
  model_performance: {
    location_scoring: {
      algorithm: string;
      rmse: number;
      mae: number;
      r2: number;
      n_test_samples: number;
    };
    credit_risk: {
      algorithm: string;
      auc_roc_approx: number;
      ks_statistic: number;
      overall_default_rate_pct: number;
      n_score_bands: number;
      portfolio_size: number;
    };
    clustering: {
      algorithm: string;
      n_kmeans_clusters: number;
      n_dbscan_clusters: number;
      silhouette_score: number;
      dbscan_noise_ratio_pct: number;
    };
  };
  business_impact: {
    government: {
      total_umkm_impacted: number;
      new_viable_locations: number;
      priority_clusters: number;
      policies_simulated: number;
    };
    banking: {
      current_default_rate_pct: number;
      estimated_npl_reduction_pct: number;
      high_risk_segment_pct: number;
      potential_kur_recipients: number;
    };
    investors: {
      total_market_size_juta_monthly: number;
      annual_opportunity_miliar: number;
      top_cluster: string;
      top_cluster_score: number;
    };
  };
  key_metrics: {
    avg_location_score: number;
    urban_rural_gap: number;
    digital_premium: number;
    total_market_size_miliar_annual: number;
  };
  [key: string]: unknown;
}

export interface OverviewKPI {
  total_umkm: number;
  avg_score: number;
  high_risk_count: number;
  survival_rate: number;
  score_distribution: { bucket: string; count: number }[];
  top_kabupaten: { name: string; avg_score: number }[];
  cluster_distribution: { name: string; count: number }[];
}

export interface ChatMessage {
  message: string;
  persona: string;
  history?: { role: string; content: string }[];
}

export interface ChatResponse {
  response: string;
  intent?: string;
  sources?: string[];
}

export interface KnowledgeBaseEntry {
  query: string;
  intent: string;
  retrieved_docs: string[];
  expected_response: string;
}

export interface KnowledgeBase {
  bank_examples: KnowledgeBaseEntry[];
  government_examples: KnowledgeBaseEntry[];
  investor_examples: KnowledgeBaseEntry[];
}

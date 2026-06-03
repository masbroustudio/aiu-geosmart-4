import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";
import {
  UmkmRecord,
  UmkmClusteredRecord,
  KecamatanRecord,
  CreditScoreBand,
  PDRegBucket,
  ClusterProfile,
  GovPriorityCluster,
  InvestmentOpportunity,
  Recommendation,
  WhatIfResult,
  PolicyImpact,
  GovPriorityKecamatan,
  ExecutiveSummary,
  KnowledgeBase,
} from "../shared/types.js";
import { toNumber, toBoolean } from "../shared/utils.js";

// Base path for data files
function getDataPath(relativePath: string): string {
  return path.resolve(__dirname, "../../..", "ml/data", relativePath);
}

function loadCSV<T>(filename: string): T[] {
  const filePath = getDataPath(filename);
  const content = fs.readFileSync(filePath, "utf-8");
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data as T[];
}

function loadJSON<T>(filename: string): T {
  const filePath = getDataPath(filename);
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as T;
}

// Cached data
let umkmData: UmkmRecord[] | null = null;
let umkmClusteredData: UmkmClusteredRecord[] | null = null;
let kecamatanData: KecamatanRecord[] | null = null;
let creditBands: CreditScoreBand[] | null = null;
let pdRegBuckets: PDRegBucket[] | null = null;
let clusterProfiles: ClusterProfile[] | null = null;
let govPriorityClusters: GovPriorityCluster[] | null = null;
let investmentOpps: InvestmentOpportunity[] | null = null;
let recommendations: Recommendation[] | null = null;
let whatIfResults: WhatIfResult[] | null = null;
let policyImpacts: PolicyImpact[] | null = null;
let govPriorityKecamatan: GovPriorityKecamatan[] | null = null;
let executiveSummary: ExecutiveSummary | null = null;
let knowledgeBase: KnowledgeBase | null = null;

function parseUmkmRecord(raw: Record<string, string>): UmkmRecord {
  return {
    kabupaten_kota: raw.kabupaten_kota || "",
    kecamatan: raw.kecamatan || "",
    latitude: toNumber(raw.latitude),
    longitude: toNumber(raw.longitude),
    is_kota: toBoolean(raw.is_kota),
    jenis_usaha: raw.jenis_usaha || "",
    tahun_berdiri: toNumber(raw.tahun_berdiri),
    jumlah_karyawan: toNumber(raw.jumlah_karyawan),
    has_digital_presence: toNumber(raw.has_digital_presence),
    omset_bulanan: toNumber(raw.omset_bulanan),
    populasi: toNumber(raw.populasi),
    kepadatan_penduduk: toNumber(raw.kepadatan_penduduk),
    income_per_kapita: toNumber(raw.income_per_kapita),
    jarak_ke_jalan_utama: toNumber(raw.jarak_ke_jalan_utama),
    jarak_ke_pasar: toNumber(raw.jarak_ke_pasar),
    akses_internet_pct: toNumber(raw.akses_internet_pct),
    skor_infrastruktur: toNumber(raw.skor_infrastruktur),
    jumlah_kompetitor_radius_3km: toNumber(raw.jumlah_kompetitor_radius_3km),
    jarak_ke_bank_terdekat: toNumber(raw.jarak_ke_bank_terdekat),
    penetrasi_kur_pct: toNumber(raw.penetrasi_kur_pct),
    risiko_banjir: toNumber(raw.risiko_banjir),
    risiko_gempa: toNumber(raw.risiko_gempa),
    skor_potensi: toNumber(raw.skor_potensi),
    is_survived_3yr: toNumber(raw.is_survived_3yr),
  };
}

function parseUmkmClusteredRecord(raw: Record<string, string>): UmkmClusteredRecord {
  return {
    ...parseUmkmRecord(raw),
    business_maturity: toNumber(raw.business_maturity),
    infra_x_income: toNumber(raw.infra_x_income),
    competition_density_ratio: toNumber(raw.competition_density_ratio),
    avg_distance_to_facilities: toNumber(raw.avg_distance_to_facilities),
    market_gap_score: toNumber(raw.market_gap_score),
    digital_readiness_index: toNumber(raw.digital_readiness_index),
    risk_composite: toNumber(raw.risk_composite),
    financial_access_score: toNumber(raw.financial_access_score),
    omset_per_karyawan: toNumber(raw.omset_per_karyawan),
    location_advantage: toNumber(raw.location_advantage),
    cluster_kmeans: toNumber(raw.cluster_kmeans),
    cluster_dbscan: toNumber(raw.cluster_dbscan),
    cluster_name: raw.cluster_name || "",
  };
}

function parseKecamatanRecord(raw: Record<string, string>): KecamatanRecord {
  return {
    kabupaten_kota: raw.kabupaten_kota || "",
    kecamatan: raw.kecamatan || "",
    latitude: toNumber(raw.latitude),
    longitude: toNumber(raw.longitude),
    is_kota: toBoolean(raw.is_kota),
    populasi: toNumber(raw.populasi),
    kepadatan_penduduk: toNumber(raw.kepadatan_penduduk),
    income_per_kapita: toNumber(raw.income_per_kapita),
    jarak_ke_jalan_utama: toNumber(raw.jarak_ke_jalan_utama),
    jarak_ke_pasar: toNumber(raw.jarak_ke_pasar),
    akses_internet_pct: toNumber(raw.akses_internet_pct),
    skor_infrastruktur: toNumber(raw.skor_infrastruktur),
    jumlah_kompetitor_radius_3km: toNumber(raw.jumlah_kompetitor_radius_3km),
    jarak_ke_bank_terdekat: toNumber(raw.jarak_ke_bank_terdekat),
    penetrasi_kur_pct: toNumber(raw.penetrasi_kur_pct),
    risiko_banjir: toNumber(raw.risiko_banjir),
    risiko_gempa: toNumber(raw.risiko_gempa),
  };
}

export function getUmkmData(): UmkmRecord[] {
  if (!umkmData) {
    const raw = loadCSV<Record<string, string>>("umkm_dataset.csv");
    umkmData = raw.map(parseUmkmRecord);
  }
  return umkmData;
}

export function getUmkmClusteredData(): UmkmClusteredRecord[] {
  if (!umkmClusteredData) {
    const raw = loadCSV<Record<string, string>>("umkm_clustered.csv");
    umkmClusteredData = raw.map(parseUmkmClusteredRecord);
  }
  return umkmClusteredData;
}

export function getKecamatanData(): KecamatanRecord[] {
  if (!kecamatanData) {
    const raw = loadCSV<Record<string, string>>("kecamatan_reference.csv");
    kecamatanData = raw.map(parseKecamatanRecord);
  }
  return kecamatanData;
}

export function getCreditBands(): CreditScoreBand[] {
  if (!creditBands) {
    creditBands = loadCSV<CreditScoreBand>("credit_score_bands.csv");
  }
  return creditBands;
}

export function getPDRegBuckets(): PDRegBucket[] {
  if (!pdRegBuckets) {
    pdRegBuckets = loadCSV<PDRegBucket>("pd_regulatory_buckets.csv");
  }
  return pdRegBuckets;
}

export function getClusterProfiles(): ClusterProfile[] {
  if (!clusterProfiles) {
    const raw = loadCSV<Record<string, string>>("cluster_profiles.csv");
    clusterProfiles = raw.map((r) => ({
      cluster_id: toNumber(r.cluster_id),
      skor_infrastruktur: toNumber(r.skor_infrastruktur),
      income_per_kapita: toNumber(r.income_per_kapita),
      kepadatan_penduduk: toNumber(r.kepadatan_penduduk),
      jumlah_kompetitor_radius_3km: toNumber(r.jumlah_kompetitor_radius_3km),
      omset_bulanan: toNumber(r.omset_bulanan),
      penetrasi_kur_pct: toNumber(r.penetrasi_kur_pct),
      akses_internet_pct: toNumber(r.akses_internet_pct),
      risiko_banjir: toNumber(r.risiko_banjir),
      risiko_gempa: toNumber(r.risiko_gempa),
      has_digital_presence: toNumber(r.has_digital_presence),
      business_maturity: toNumber(r.business_maturity),
      skor_potensi: toNumber(r.skor_potensi),
      is_survived_3yr: toNumber(r.is_survived_3yr),
      omset_per_karyawan: toNumber(r.omset_per_karyawan),
      latitude: toNumber(r.latitude),
      longitude: toNumber(r.longitude),
      cluster_name: r.cluster_name || "",
      n_umkm: toNumber(r.n_umkm),
    }));
  }
  return clusterProfiles;
}

export function getGovPriorityClusters(): GovPriorityCluster[] {
  if (!govPriorityClusters) {
    const raw = loadCSV<Record<string, string>>("government_priority_clusters.csv");
    govPriorityClusters = raw.map((r) => ({
      priority_rank: toNumber(r.priority_rank),
      cluster: toNumber(r.cluster),
      cluster_name: r.cluster_name || "",
      n_umkm: toNumber(r.n_umkm),
      priority_score: toNumber(r.priority_score),
      low_infra_score: toNumber(r.low_infra_score),
      low_income_score: toNumber(r.low_income_score),
      high_risk_score: toNumber(r.high_risk_score),
      low_survival_score: toNumber(r.low_survival_score),
      budget_allocation_pct: toNumber(r.budget_allocation_pct),
      budget_allocation: toNumber(r.budget_allocation),
    }));
  }
  return govPriorityClusters;
}

export function getInvestmentOpps(): InvestmentOpportunity[] {
  if (!investmentOpps) {
    const raw = loadCSV<Record<string, string>>("investment_opportunity_clusters.csv");
    investmentOpps = raw.map((r) => ({
      investment_rank: toNumber(r.investment_rank),
      cluster: toNumber(r.cluster),
      cluster_name: r.cluster_name || "",
      n_umkm: toNumber(r.n_umkm),
      investment_score: toNumber(r.investment_score),
      growth_potential: toNumber(r.growth_potential),
      low_competition: toNumber(r.low_competition),
      infra_quality: toNumber(r.infra_quality),
      survival_rate: toNumber(r.survival_rate),
      revenue_level: toNumber(r.revenue_level),
      total_market_size_juta: toNumber(r.total_market_size_juta),
      avg_omset_juta: toNumber(r.avg_omset_juta),
    }));
  }
  return investmentOpps;
}

export function getRecommendations(): Recommendation[] {
  if (!recommendations) {
    const raw = loadCSV<Record<string, string>>("recommendations_by_kecamatan.csv");
    recommendations = raw.map((r) => ({
      kabupaten_kota: r.kabupaten_kota || "",
      kecamatan: r.kecamatan || "",
      jenis_usaha: r.jenis_usaha || "",
      avg_skor_potensi: toNumber(r.avg_skor_potensi),
      avg_omset: toNumber(r.avg_omset),
      survival_rate: toNumber(r.survival_rate),
      avg_infrastruktur: toNumber(r.avg_infrastruktur),
      avg_kompetitor: toNumber(r.avg_kompetitor),
      avg_internet: toNumber(r.avg_internet),
      avg_financial_access: toNumber(r.avg_financial_access),
      umkm_count: toNumber(r.umkm_count),
      competition_inv: toNumber(r.competition_inv),
      recommendation_score: toNumber(r.recommendation_score),
      rank: toNumber(r.rank),
      explanation: r.explanation || "",
    }));
  }
  return recommendations;
}

export function getWhatIfResults(): WhatIfResult[] {
  if (!whatIfResults) {
    const raw = loadCSV<Record<string, string>>("whatif_simulation_results.csv");
    whatIfResults = raw.map((r) => ({
      scenario: r.scenario || "",
      n_umkm_affected: toNumber(r.n_umkm_affected),
      avg_score_before: toNumber(r.avg_score_before),
      avg_score_after: toNumber(r.avg_score_after),
      avg_improvement: toNumber(r.avg_improvement),
      max_improvement: toNumber(r.max_improvement),
      pct_improved: toNumber(r.pct_improved),
      n_now_above_70: toNumber(r.n_now_above_70),
    }));
  }
  return whatIfResults;
}

export function getPolicyImpacts(): PolicyImpact[] {
  if (!policyImpacts) {
    const raw = loadCSV<Record<string, string>>("policy_impact_estimates.csv");
    policyImpacts = raw.map((r) => ({
      policy: r.policy || "",
      target_group: r.target_group || "",
      avg_score_improvement: toNumber(r.avg_score_improvement),
      pct_improved: toNumber(r.pct_improved),
      new_above_70: toNumber(r.new_above_70),
      additional_survivors: toNumber(r.additional_survivors),
    }));
  }
  return policyImpacts;
}

export function getGovPriorityKecamatan(): GovPriorityKecamatan[] {
  if (!govPriorityKecamatan) {
    const raw = loadCSV<Record<string, string>>("government_priority_kecamatan.csv");
    govPriorityKecamatan = raw.map((r) => ({
      kecamatan: r.kecamatan || "",
      kabupaten: r.kabupaten || "",
      avg_skor: toNumber(r.avg_skor),
      rank: toNumber(r.rank),
      top_limiting_factor: r.top_limiting_factor || "",
      recommendation: r.recommendation || "",
    }));
  }
  return govPriorityKecamatan;
}

export function getExecutiveSummary(): ExecutiveSummary {
  if (!executiveSummary) {
    executiveSummary = loadJSON<ExecutiveSummary>("executive_summary.json");
  }
  return executiveSummary;
}

export function getKnowledgeBase(): KnowledgeBase {
  if (!knowledgeBase) {
    knowledgeBase = loadJSON<KnowledgeBase>("knowledge_base/example_queries.json");
  }
  return knowledgeBase;
}

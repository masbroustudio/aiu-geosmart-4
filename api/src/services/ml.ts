import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { toNumber } from '../shared/utils.js';

// Types for ML models
export interface LocationScore {
  actual_skor_potensi: number;
  predicted_skor_potensi: number;
  kabupaten_kota: string;
  kecamatan: string;
  residual: number;
}

export interface CreditScoreResult {
  rating: string;
  score_range: string;
  count: number;
  pct_of_portfolio: string;
  actual_default_rate: string;
  mean_predicted_pd: string;
  confidence: number;
}

export interface CreditScoringRequest {
  umkm_name?: string;
  sector?: string;
  location?: string;
  omset_bulanan?: number;
  jumlah_karyawan?: number;
  has_digital_presence?: boolean;
  tahun_berdiri?: number;
  skor_infrastruktur?: number;
  skor_potensi?: number;
}

export interface CreditScoringResponse {
  umkm_name?: string;
  credit_score: number;
  rating: string;
  pd_bucket: string;
  predicted_pd: number;
  confidence: number;
  explanation: string;
  risk_level: 'low' | 'medium' | 'high' | 'very_high';
}

export interface LocationScoringResponse {
  location: string;
  kecamatan: string;
  kabupaten_kota: string;
  predicted_score: number;
  actual_score: number;
  residual: number;
  opportunity_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  recommendations: string[];
}

// Global caches
let locationScores: LocationScore[] | null = null;
let creditBandData: CreditScoreResult[] | null = null;

function getDataPath(filename: string): string {
  return path.resolve(__dirname, '../../..', 'ml/data', filename);
}

function loadCSV<T>(filename: string): T[] {
  const filePath = getDataPath(filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data as T[];
}

function parseLocationScore(raw: Record<string, string>): LocationScore {
  return {
    actual_skor_potensi: toNumber(raw.actual_skor_potensi),
    predicted_skor_potensi: toNumber(raw.predicted_skor_potensi),
    kabupaten_kota: raw.kabupaten_kota || '',
    kecamatan: raw.kecamatan || '',
    residual: toNumber(raw.residual),
  };
}

function parseCreditBand(raw: Record<string, string>): CreditScoreResult {
  return {
    rating: raw.Rating || '',
    score_range: raw['Score Range'] || '',
    count: toNumber(raw.Count),
    pct_of_portfolio: raw['Pct of Portfolio'] || '0%',
    actual_default_rate: raw['Actual Default Rate'] || '0%',
    mean_predicted_pd: raw['Mean Predicted PD'] || '0%',
    confidence: 0,
  };
}

function loadLocationScores(): LocationScore[] {
  if (!locationScores) {
    const raw = loadCSV<Record<string, string>>('location_scores_predicted.csv');
    locationScores = raw.map(parseLocationScore);
  }
  return locationScores;
}

function loadCreditBands(): CreditScoreResult[] {
  if (!creditBandData) {
    const raw = loadCSV<Record<string, string>>('credit_score_bands.csv');
    creditBandData = raw.map(parseCreditBand);

    // Calculate confidence scores based on count and actual default rate
    if (creditBandData.length > 0) {
      const maxCount = Math.max(...creditBandData.map((b) => b.count));
      creditBandData.forEach((band) => {
        const count = band.count || 1;
        band.confidence = Math.round((count / maxCount) * 100);
      });
    }
  }
  return creditBandData;
}

/**
 * Score a location based on kecamatan name
 */
export function scoreLocation(
  kecamatanName: string,
  kabupatenName?: string
): LocationScoringResponse | null {
  const scores = loadLocationScores();

  // Find matching location
  let match = scores.find((s) =>
    s.kecamatan.toLowerCase().includes(kecamatanName.toLowerCase())
  );

  // If not found and kabupaten provided, try to find by both
  if (!match && kabupatenName) {
    match = scores.find(
      (s) =>
        s.kecamatan.toLowerCase().includes(kecamatanName.toLowerCase()) &&
        s.kabupaten_kota.toLowerCase().includes(kabupatenName.toLowerCase())
    );
  }

  if (!match) {
    return null;
  }

  // Determine opportunity level based on predicted score
  let opportunity_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  if (match.predicted_skor_potensi < 40) {
    opportunity_level = 'very_low';
  } else if (match.predicted_skor_potensi < 55) {
    opportunity_level = 'low';
  } else if (match.predicted_skor_potensi < 70) {
    opportunity_level = 'medium';
  } else if (match.predicted_skor_potensi < 85) {
    opportunity_level = 'high';
  } else {
    opportunity_level = 'very_high';
  }

  // Generate recommendations based on score
  const recommendations: string[] = [];
  if (match.predicted_skor_potensi >= 70) {
    recommendations.push('High growth potential - prioritize for investment');
    recommendations.push('Strong market fundamentals in this location');
  } else if (match.predicted_skor_potensi >= 55) {
    recommendations.push('Moderate growth potential with infrastructure improvements');
    recommendations.push('Suitable for medium-risk investment');
  } else {
    recommendations.push('Develop local infrastructure to improve opportunity');
    recommendations.push('Focus on market development initiatives');
  }

  return {
    location: `${match.kecamatan}, ${match.kabupaten_kota}`,
    kecamatan: match.kecamatan,
    kabupaten_kota: match.kabupaten_kota,
    predicted_score: match.predicted_skor_potensi,
    actual_score: match.actual_skor_potensi,
    residual: match.residual,
    opportunity_level,
    recommendations,
  };
}

/**
 * Get all location scores for a kabupaten
 */
export function getLocationsByKabupaten(kabupatenName: string): LocationScoringResponse[] {
  const scores = loadLocationScores();

  const matches = scores.filter((s) =>
    s.kabupaten_kota.toLowerCase().includes(kabupatenName.toLowerCase())
  );

  return matches.map((match) => {
    let opportunity_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    if (match.predicted_skor_potensi < 40) {
      opportunity_level = 'very_low';
    } else if (match.predicted_skor_potensi < 55) {
      opportunity_level = 'low';
    } else if (match.predicted_skor_potensi < 70) {
      opportunity_level = 'medium';
    } else if (match.predicted_skor_potensi < 85) {
      opportunity_level = 'high';
    } else {
      opportunity_level = 'very_high';
    }

    const recommendations: string[] = [];
    if (match.predicted_skor_potensi >= 70) {
      recommendations.push('High growth potential');
    } else if (match.predicted_skor_potensi >= 55) {
      recommendations.push('Moderate growth potential');
    } else {
      recommendations.push('Development needed');
    }

    return {
      location: `${match.kecamatan}, ${match.kabupaten_kota}`,
      kecamatan: match.kecamatan,
      kabupaten_kota: match.kabupaten_kota,
      predicted_score: match.predicted_skor_potensi,
      actual_score: match.actual_skor_potensi,
      residual: match.residual,
      opportunity_level,
      recommendations,
    };
  });
}

/**
 * Score credit risk based on UMKM characteristics
 */
export function scoreCreditRisk(request: CreditScoringRequest): CreditScoringResponse {
  const bands = loadCreditBands();

  // Simple scoring algorithm based on available features
  let creditScore = 650; // Base score

  // Adjust based on features
  if (request.omset_bulanan && request.omset_bulanan > 5000000) {
    creditScore += 50;
  } else if (request.omset_bulanan && request.omset_bulanan < 1000000) {
    creditScore -= 30;
  }

  if (request.jumlah_karyawan && request.jumlah_karyawan > 10) {
    creditScore += 30;
  }

  if (request.has_digital_presence) {
    creditScore += 40;
  }

  if (request.skor_potensi && request.skor_potensi > 70) {
    creditScore += 25;
  }

  if (request.tahun_berdiri) {
    const yearsOld = new Date().getFullYear() - request.tahun_berdiri;
    if (yearsOld > 5) {
      creditScore += 40;
    } else if (yearsOld > 3) {
      creditScore += 20;
    }
  }

  // Cap score between 300 and 850
  creditScore = Math.min(850, Math.max(300, creditScore));

  // Find appropriate rating band
  let ratingBand = bands.find((b) => {
    const range = b.score_range.split('-');
    const min = parseInt(range[0]);
    const max = parseInt(range[1]);
    return creditScore >= min && creditScore <= max;
  }) || bands[bands.length - 1];

  // Determine risk level
  let risk_level: 'low' | 'medium' | 'high' | 'very_high';
  if (creditScore >= 750) {
    risk_level = 'low';
  } else if (creditScore >= 650) {
    risk_level = 'medium';
  } else if (creditScore >= 550) {
    risk_level = 'high';
  } else {
    risk_level = 'very_high';
  }

  // Extract PD percentage
  const pdPercentage = parseFloat(ratingBand.mean_predicted_pd) || 0;

  return {
    umkm_name: request.umkm_name,
    credit_score: creditScore,
    rating: ratingBand.rating,
    pd_bucket: ratingBand.rating.split('(')[1]?.replace(')', '').trim() || 'Standard',
    predicted_pd: pdPercentage,
    confidence: ratingBand.confidence,
    explanation: `Credit score of ${creditScore} places this UMKM in the "${ratingBand.rating}" category with a predicted default probability of ${pdPercentage}%.`,
    risk_level,
  };
}

/**
 * Get credit band statistics
 */
export function getCreditBandStats(): CreditScoreResult[] {
  return loadCreditBands();
}

/**
 * Initialize ML service (preload data)
 */
export function initializeMlService(): void {
  try {
    loadLocationScores();
    loadCreditBands();
    console.log('ML service initialized: location and credit data loaded');
  } catch (error) {
    console.error('Failed to initialize ML service:', error);
  }
}

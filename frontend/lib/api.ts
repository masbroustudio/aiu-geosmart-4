import {
  overviewData,
  creditData,
  clusterData,
  policyData,
  recommendData,
  kecamatanMapData,
} from './static-data';

const BASE_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || '')
  : '';

// Auth token management
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'X-Custom-Authorization': `Bearer ${token}` }),
  };
}

async function fetchWithFallback<T>(
  endpoint: string,
  fallback: T,
  options?: RequestInit
): Promise<T> {
  if (!BASE_URL) return fallback;
  try {
    const headers = {
      ...getAuthHeaders(),
      ...options?.headers,
    };
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (res.status === 401) {
      // Clear invalid token on unauthorized
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
      return fallback;
    }
    
    if (!res.ok) return fallback;
    const json = await res.json();
    // Unwrap the API envelope { success, data }
    if (json && json.success && json.data !== undefined) {
      return json.data as T;
    }
    return json as T;
  } catch {
    return fallback;
  }
}

export async function fetchOverview() {
  const data = await fetchWithFallback('/api/overview', overviewData);
  // Transform API field names to match frontend expectations
  // API uses { bucket, count } but frontend expects { range, count }
  if (data && data.score_distribution && data.score_distribution.length > 0) {
    const first = data.score_distribution[0] as Record<string, unknown>;
    if ('bucket' in first && !('range' in first)) {
      data.score_distribution = data.score_distribution.map(
        (item: { bucket?: string; range?: string; count: number }) => ({
          range: item.bucket || item.range || '',
          count: item.count,
        })
      );
    }
  }
  return data;
}

export async function fetchScores(params?: { kabupaten?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.kabupaten) query.set('kabupaten', params.kabupaten);
  if (params?.limit) query.set('limit', String(params.limit));
  const path = `/api/score${query.toString() ? `?${query}` : ''}`;
  return fetchWithFallback(path, kecamatanMapData);
}

export async function fetchCredit() {
  return fetchWithFallback('/api/credit', creditData);
}

export async function fetchClusters() {
  return fetchWithFallback('/api/cluster', clusterData);
}

export async function fetchRecommendations(params?: { jenis_usaha?: string; kabupaten?: string }) {
  const query = new URLSearchParams();
  if (params?.jenis_usaha) query.set('jenis_usaha', params.jenis_usaha);
  if (params?.kabupaten) query.set('kabupaten', params.kabupaten);
  const path = `/api/recommend${query.toString() ? `?${query}` : ''}`;
  const data = await fetchWithFallback(path, recommendData);
  // Transform API field names: kabupaten_kota -> kabupaten, avg_skor_potensi -> avg_score
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0] as Record<string, unknown>;
    if ('kabupaten_kota' in first || 'avg_skor_potensi' in first) {
      return data.map((item: Record<string, unknown>) => ({
        kabupaten: (item.kabupaten_kota || item.kabupaten || '') as string,
        kecamatan: (item.kecamatan || '') as string,
        jenis_usaha: (item.jenis_usaha || '') as string,
        avg_score: (item.avg_skor_potensi || item.avg_score || 0) as number,
        rank: (item.rank || 0) as number,
        explanation: (item.explanation || '') as string,
      })) as typeof recommendData;
    }
  }
  return data;
}

export async function fetchPolicy() {
  return fetchWithFallback('/api/policy', policyData);
}

export async function fetchStatus(): Promise<{ dbType: 'mock' | 'postgres'; env: string; version: string }> {
  return fetchWithFallback('/api/status', { dbType: 'mock', env: 'development', version: '4.0.0' });
}

export interface DeveloperKey {
  id: number;
  user_id: number;
  key_hash: string;
  role: string;
  rate_limit: number;
  is_active: boolean;
  created_at: string;
  raw_key?: string;
}

export async function fetchDeveloperKeys(): Promise<DeveloperKey[]> {
  return fetchWithFallback<DeveloperKey[]>('/api/developer/keys', []);
}

export async function createDeveloperKey(): Promise<DeveloperKey | null> {
  if (!BASE_URL) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/developer/keys`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    if (res.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
      return null;
    }
    
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as DeveloperKey;
    }
    return null;
  } catch {
    return null;
  }
}

export async function deleteDeveloperKey(id: number): Promise<boolean> {
  if (!BASE_URL) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/developer/keys?id=${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (res.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
      return false;
    }
    
    if (!res.ok) return false;
    const json = await res.json();
    return !!json.success;
  } catch {
    return false;
  }
}

export async function fetchKecamatan(_params?: { kabupaten?: string }) {
  // Always return static kecamatanMapData because the API's /api/kecamatan
  // endpoint returns raw reference data without scores, which the map needs
  // for color-coding. The static data has pre-computed scores.
  return kecamatanMapData;
}

export async function postChat(body: { message: string; persona: string; history?: Array<{ role: string; content: string }> }): Promise<{ response: string }> {
  if (!BASE_URL) return { response: '' };
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (res.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
      return { response: '' };
    }
    
    if (!res.ok) return { response: '' };
    const json = await res.json();
    // Unwrap the API envelope { success, data: { response, intent, sources } }
    if (json && json.success && json.data?.response) {
      return { response: json.data.response };
    }
    if (json?.response) {
      return { response: json.response };
    }
    return { response: '' };
  } catch {
    return { response: '' };
  }
}

// Auth endpoints
export async function register(email: string, password: string, fullName: string) {
  if (!BASE_URL) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string) {
  if (!BASE_URL) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (json.success && json.data?.token) {
      setAuthToken(json.data.token);
      return json.data;
    }
    return null;
  } catch {
    return null;
  }
}

export function logout() {
  clearAuthToken();
}

// New ML Scoring endpoints
export interface CreditScoreRequest {
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

export interface CreditScoreResponse {
  umkm_name?: string;
  credit_score: number;
  rating: string;
  pd_bucket: string;
  predicted_pd: number;
  confidence: number;
  explanation: string;
  risk_level: string;
}

export async function scoreCreditRisk(request: CreditScoreRequest): Promise<CreditScoreResponse | null> {
  if (!BASE_URL) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/scoring/credit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
    
    if (res.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
      return null;
    }
    
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as CreditScoreResponse;
    }
    return null;
  } catch {
    return null;
  }
}

export interface LocationScoreRequest {
  kecamatan?: string;
  kabupaten_kota?: string;
  latitude?: number;
  longitude?: number;
}

export interface LocationScoreResponse {
  location: string;
  kecamatan: string;
  kabupaten_kota: string;
  predicted_score: number;
  actual_score: number;
  residual: number;
  opportunity_level: string;
  recommendations: string[];
}

export async function scoreLocation(request: LocationScoreRequest): Promise<LocationScoreResponse | LocationScoreResponse[] | null> {
  if (!BASE_URL) return null;
  try {
    const query = new URLSearchParams();
    if (request.kecamatan) query.set('kecamatan', request.kecamatan);
    if (request.kabupaten_kota) query.set('kabupaten_kota', request.kabupaten_kota);
    
    const res = await fetch(`${BASE_URL}/api/scoring/location${query.toString() ? `?${query}` : ''}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (res.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
      return null;
    }
    
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as LocationScoreResponse | LocationScoreResponse[];
    }
    return null;
  } catch {
    return null;
  }
}

export interface SavedPolicyScenario {
  id: number;
  user_id: number;
  scenario_name: string;
  parameters: string;
  results: string;
  base_score: number;
  simulated_score: number;
  impact: number;
  created_at: string;
}

export async function fetchSavedScenarios(): Promise<SavedPolicyScenario[]> {
  return fetchWithFallback<SavedPolicyScenario[]>('/api/policy/scenarios', []);
}

export async function savePolicyScenario(body: {
  scenario_name: string;
  parameters: any;
  results: any;
  base_score: number;
  simulated_score: number;
  impact: number;
}): Promise<SavedPolicyScenario | null> {
  if (!BASE_URL) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/policy/scenarios`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    
    if (res.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
      return null;
    }
    
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as SavedPolicyScenario;
    }
    return null;
  } catch {
    return null;
  }
}

export async function deletePolicyScenario(id: number): Promise<boolean> {
  if (!BASE_URL) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/policy/scenarios?id=${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (res.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
      return false;
    }
    
    if (!res.ok) return false;
    const json = await res.json();
    return !!json.success;
  } catch {
    return false;
  }
}

export interface BatchScoreJobResponse {
  jobId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  createdAt: string;
  updatedAt: string;
  stats?: { total: number; avgScore: number; lowRisk: number; highRisk: number };
  scoredRows?: any[];
  error?: string;
}

export async function uploadBatchCredit(filename: string, csvText: string): Promise<{ jobId: number } | null> {
  if (!BASE_URL) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/reports/batch-score/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ filename, csv_text: csvText }),
    });
    
    if (res.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
      return null;
    }
    
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getBatchCreditStatus(jobId: number): Promise<BatchScoreJobResponse | null> {
  if (!BASE_URL) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/reports/batch-score/status?jobId=${jobId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (res.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
      return null;
    }
    
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as BatchScoreJobResponse;
    }
    return null;
  } catch {
    return null;
  }
}

export interface SimulationResponse {
  results: Array<{
    cluster: number;
    cluster_name: string;
    allocation_pct: number;
    allocated_budget: number;
    predicted_umkm_improved: number;
    predicted_new_jobs: number;
    predicted_score_increase: number;
    roi: number;
  }>;
  summary: {
    totalImproved: number;
    totalNewJobs: number;
    avgScoreIncrease: number;
    base_score: number;
    simulated_score: number;
  };
}

export async function simulatePolicy(allocations: number[], totalBudget: number): Promise<SimulationResponse | null> {
  if (!BASE_URL) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/policy/simulate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ allocations, totalBudget }),
    });
    
    if (res.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
      return null;
    }
    
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as SimulationResponse;
    }
    return null;
  } catch {
    return null;
  }
}

export interface WhatIfResponse {
  scenarios: Array<{
    scenario: string;
    affected: number;
    before: number;
    after: number;
    improvement: number;
    max_improvement: number;
    pct_improved: number;
    above_70: number;
  }>;
  input: any;
}

export async function simulateWhatIf(body: {
  infrastructure_improvement?: number;
  new_bank_distance?: number;
  internet_pct_increase?: number;
  target_kecamatan?: string;
  scenario?: string;
}): Promise<WhatIfResponse | null> {
  if (!BASE_URL) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/whatif`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    
    if (res.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
      return null;
    }
    
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as WhatIfResponse;
    }
    return null;
  } catch {
    return null;
  }
}



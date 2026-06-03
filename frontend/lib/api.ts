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

async function fetchWithFallback<T>(endpoint: string, fallback: T): Promise<T> {
  if (!BASE_URL) return fallback;
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`);
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

export async function fetchKecamatan(_params?: { kabupaten?: string }) {
  // Always return static kecamatanMapData because the API's /api/kecamatan
  // endpoint returns raw reference data without scores, which the map needs
  // for color-coding. The static data has pre-computed scores.
  return kecamatanMapData;
}

export async function postChat(body: { message: string; persona: string; history?: Array<{ role: string; content: string }> }): Promise<{ response: string }> {
  if (!BASE_URL) return { response: '' };
  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
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

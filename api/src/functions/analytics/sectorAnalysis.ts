import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/verifyToken';
import { logAudit, extractRequestInfo } from '../../services/audit';
import { getCached, setCached } from '../../utils/caching';

interface SectorAnalysis {
  sectors: {
    name: string;
    umkm_count: number;
    average_score: number;
    average_default_rate: number;
  }[];
  top_performing_sectors: string[];
  highest_risk_sectors: string[];
}

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const cacheKey = 'analytics:sector-analysis';
    let analysis = getCached<SectorAnalysis>(cacheKey);

    if (!analysis) {
      // Sample sector data for MVP
      const sectorData = [
        { name: 'Retail', umkm_count: 245, average_score: 720, average_default_rate: 2.1 },
        { name: 'Manufacturing', umkm_count: 189, average_score: 745, average_default_rate: 1.8 },
        { name: 'Services', umkm_count: 312, average_score: 695, average_default_rate: 2.5 },
        { name: 'Agriculture', umkm_count: 156, average_score: 680, average_default_rate: 3.2 },
        { name: 'Technology', umkm_count: 78, average_score: 775, average_default_rate: 1.2 },
        { name: 'Hospitality', umkm_count: 203, average_score: 710, average_default_rate: 2.3 },
      ];

      const sortedByScore = [...sectorData].sort((a, b) => b.average_score - a.average_score);
      const sortedByRisk = [...sectorData].sort((a, b) => b.average_default_rate - a.average_default_rate);

      analysis = {
        sectors: sectorData,
        top_performing_sectors: sortedByScore.slice(0, 3).map((s) => s.name),
        highest_risk_sectors: sortedByRisk.slice(0, 3).map((s) => s.name),
      };

      setCached(cacheKey, analysis, 60000);
    }

    await logAudit({
      userId,
      action: 'analytics_sector_analysis_retrieved',
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      statusCode: 200,
      responseTimeMs: Date.now() - startTime,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: analysis,
        metadata: {
          retrieved_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message === 'Unauthorized';
    const statusCode = isAuthError ? 401 : 500;

    context.error('Error in sector analysis handler:', error);

    await logAudit({
      userId,
      action: isAuthError ? 'analytics_sector_analysis_unauthorized' : 'analytics_sector_analysis_error',
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      statusCode,
      responseTimeMs: Date.now() - startTime,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
    });

    return {
      status: statusCode,
      jsonBody: {
        success: false,
        error: isAuthError ? 'Unauthorized: Valid token required' : 'Internal server error',
      },
    };
  }
}

app.http('sectorAnalysis', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'analytics/sector-analysis',
  handler,
});

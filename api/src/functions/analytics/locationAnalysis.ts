import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/verifyToken';
import { logAudit, extractRequestInfo } from '../../services/audit';
import { initializeMlService, getLocationsByKabupaten } from '../../services/ml';
import { getCached, setCached } from '../../utils/caching';

interface LocationAnalysis {
  total_locations: number;
  high_opportunity_locations: number;
  locations_by_opportunity: {
    kabupaten: string;
    kecamatan: string;
    predicted_score: number;
    opportunity_level: string;
  }[];
}

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const cacheKey = 'analytics:location-analysis';
    let analysis = getCached<LocationAnalysis>(cacheKey);

    if (!analysis) {
      initializeMlService();

      // For now, get locations from a specific kabupaten for demo
      // In production, this would aggregate all locations
      const sampleLocations = getLocationsByKabupaten('Bandung').slice(0, 20);

      const highOpportunity = sampleLocations.filter((l) => l.opportunity_level === 'high' || l.opportunity_level === 'very_high').length;

      analysis = {
        total_locations: sampleLocations.length,
        high_opportunity_locations: highOpportunity,
        locations_by_opportunity: sampleLocations
          .sort((a, b) => b.predicted_score - a.predicted_score)
          .map((l) => ({
            kabupaten: l.kabupaten_kota,
            kecamatan: l.kecamatan,
            predicted_score: l.predicted_score,
            opportunity_level: l.opportunity_level,
          })),
      };

      setCached(cacheKey, analysis, 60000);
    }

    await logAudit({
      userId,
      action: 'analytics_location_analysis_retrieved',
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

    context.error('Error in location analysis handler:', error);

    await logAudit({
      userId,
      action: isAuthError ? 'analytics_location_analysis_unauthorized' : 'analytics_location_analysis_error',
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

app.http('locationAnalysis', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'analytics/location-analysis',
  handler,
});

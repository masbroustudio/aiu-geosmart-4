import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/verifyToken';
import { logAudit, extractRequestInfo } from '../../services/audit';
import { initializeMlService, getCreditBandStats } from '../../services/ml';
import { getCached, setCached } from '../../utils/caching';

interface AnalyticsOverview {
  total_credit_bands: number;
  average_default_rate: number;
  total_umkms_assessed: number;
  portfolio_distribution: {
    rating: string;
    count: number;
    default_rate: string;
  }[];
}

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    // Try cache first
    const cacheKey = 'analytics:overview';
    let overview = getCached<AnalyticsOverview>(cacheKey);

    if (!overview) {
      initializeMlService();
      const bands = getCreditBandStats();

      // Calculate average default rate
      const defaultRates = bands.map((b) => parseFloat(b.actual_default_rate) || 0);
      const avgDefaultRate =
        defaultRates.length > 0 ? defaultRates.reduce((a, b) => a + b, 0) / defaultRates.length : 0;

      // Calculate total UMKMs
      const totalUmkms = bands.reduce((sum, b) => sum + b.count, 0);

      overview = {
        total_credit_bands: bands.length,
        average_default_rate: Math.round(avgDefaultRate * 100) / 100,
        total_umkms_assessed: totalUmkms,
        portfolio_distribution: bands.map((b) => ({
          rating: b.rating,
          count: b.count,
          default_rate: b.actual_default_rate,
        })),
      };

      setCached(cacheKey, overview, 60000); // Cache for 60 seconds
    }

    await logAudit({
      userId,
      action: 'analytics_overview_retrieved',
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
        data: overview,
        metadata: {
          retrieved_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message === 'Unauthorized';
    const statusCode = isAuthError ? 401 : 500;

    context.error('Error in analytics overview handler:', error);

    await logAudit({
      userId,
      action: isAuthError ? 'analytics_overview_unauthorized' : 'analytics_overview_error',
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

app.http('analyticsOverview', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'analytics/overview',
  handler,
});

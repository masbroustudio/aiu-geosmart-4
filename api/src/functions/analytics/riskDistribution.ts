import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/verifyToken';
import { logAudit, extractRequestInfo } from '../../services/audit';
import { initializeMlService, getCreditBandStats } from '../../services/ml';
import { getCached, setCached } from '../../utils/caching';

interface RiskDistribution {
  low_risk: { count: number; percentage: number };
  medium_risk: { count: number; percentage: number };
  high_risk: { count: number; percentage: number };
  very_high_risk: { count: number; percentage: number };
}

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const cacheKey = 'analytics:risk-distribution';
    let distribution = getCached<RiskDistribution>(cacheKey);

    if (!distribution) {
      initializeMlService();
      const bands = getCreditBandStats();

      const totalCount = bands.reduce((sum, b) => sum + b.count, 0);

      const lowRiskCount = bands.filter((b) => b.rating.includes('AAA') || b.rating.includes('AA')).reduce((s, b) => s + b.count, 0);
      const mediumRiskCount = bands.filter((b) => b.rating.includes('A') || b.rating.includes('BBB')).reduce((s, b) => s + b.count, 0);
      const highRiskCount = bands.filter((b) => b.rating.includes('BB')).reduce((s, b) => s + b.count, 0);
      const veryHighRiskCount = bands.filter((b) => b.rating.includes('B') || b.rating.includes('C')).reduce((s, b) => s + b.count, 0);

      distribution = {
        low_risk: {
          count: lowRiskCount,
          percentage: totalCount > 0 ? Math.round((lowRiskCount / totalCount) * 10000) / 100 : 0,
        },
        medium_risk: {
          count: mediumRiskCount,
          percentage: totalCount > 0 ? Math.round((mediumRiskCount / totalCount) * 10000) / 100 : 0,
        },
        high_risk: {
          count: highRiskCount,
          percentage: totalCount > 0 ? Math.round((highRiskCount / totalCount) * 10000) / 100 : 0,
        },
        very_high_risk: {
          count: veryHighRiskCount,
          percentage: totalCount > 0 ? Math.round((veryHighRiskCount / totalCount) * 10000) / 100 : 0,
        },
      };

      setCached(cacheKey, distribution, 60000);
    }

    await logAudit({
      userId,
      action: 'analytics_risk_distribution_retrieved',
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
        data: distribution,
        metadata: {
          retrieved_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message.startsWith('Unauthorized');
    const statusCode = isAuthError ? 401 : 500;

    context.error('Error in risk distribution handler:', error);

    await logAudit({
      userId,
      action: isAuthError ? 'analytics_risk_distribution_unauthorized' : 'analytics_risk_distribution_error',
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

app.http('riskDistribution', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'analytics/risk-distribution',
  handler,
});

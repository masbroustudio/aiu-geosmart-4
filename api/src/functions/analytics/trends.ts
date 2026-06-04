import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/verifyToken';
import { logAudit, extractRequestInfo } from '../../services/audit';
import { getCached, setCached } from '../../utils/caching';

interface TrendData {
  period: string;
  average_score: number;
  total_assessments: number;
  default_rate: number;
}

interface Trends {
  trend_type: string;
  data: TrendData[];
  overall_trend: 'improving' | 'declining' | 'stable';
}

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const cacheKey = 'analytics:trends';
    let trends = getCached<Trends>(cacheKey);

    if (!trends) {
      // Sample trend data for MVP
      const trendData: TrendData[] = [
        { period: '2024-01', average_score: 705, total_assessments: 142, default_rate: 2.3 },
        { period: '2024-02', average_score: 712, total_assessments: 158, default_rate: 2.1 },
        { period: '2024-03', average_score: 718, total_assessments: 165, default_rate: 2.0 },
        { period: '2024-04', average_score: 725, total_assessments: 172, default_rate: 1.9 },
        { period: '2024-05', average_score: 732, total_assessments: 189, default_rate: 1.8 },
        { period: '2024-06', average_score: 738, total_assessments: 201, default_rate: 1.7 },
      ];

      trends = {
        trend_type: 'monthly_average_score',
        data: trendData,
        overall_trend: 'improving',
      };

      setCached(cacheKey, trends, 60000);
    }

    await logAudit({
      userId,
      action: 'analytics_trends_retrieved',
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
        data: trends,
        metadata: {
          retrieved_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message.startsWith('Unauthorized');
    const statusCode = isAuthError ? 401 : 500;

    context.error('Error in trends handler:', error);

    await logAudit({
      userId,
      action: isAuthError ? 'analytics_trends_unauthorized' : 'analytics_trends_error',
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

app.http('trends', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'analytics/trends',
  handler,
});

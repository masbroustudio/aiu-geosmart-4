import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/verifyToken';
import { logAudit, extractRequestInfo } from '../../services/audit';
import { initializeMlService, getCreditBandStats } from '../../services/ml';
import { getCached, setCached } from '../../utils/caching';

interface ChartDataResponse {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
  }>;
  metadata: {
    total_records: number;
    date_range: { start: string; end: string };
  };
}

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const cacheKey = 'charts:credit-distribution';
    let chartData = getCached<ChartDataResponse>(cacheKey);

    if (!chartData) {
      initializeMlService();
      const bands = getCreditBandStats();

      const labels = bands.map((b) => b.rating);
      const data = bands.map((b) => b.count);
      const colors = [
        '#10b981', // low risk - green
        '#3b82f6', // medium risk - blue
        '#f59e0b', // high risk - amber
        '#ef4444', // very high risk - red
      ];

      const totalCount = bands.reduce((sum, b) => sum + b.count, 0);

      chartData = {
        labels,
        datasets: [
          {
            label: 'UMKM Count by Credit Rating',
            data,
            backgroundColor: colors,
          },
        ],
        metadata: {
          total_records: totalCount,
          date_range: {
            start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0],
          },
        },
      };

      setCached(cacheKey, chartData, 60000);
    }

    await logAudit({
      userId,
      action: 'charts_credit_distribution_retrieved',
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
        data: chartData,
        metadata: {
          retrieved_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message === 'Unauthorized';
    const statusCode = isAuthError ? 401 : 500;

    context.error('Error in credit distribution chart handler:', error);

    await logAudit({
      userId,
      action: isAuthError ? 'charts_credit_distribution_unauthorized' : 'charts_credit_distribution_error',
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

app.http('creditDistributionChart', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'charts/credit-distribution',
  handler,
});

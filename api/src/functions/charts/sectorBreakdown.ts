import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/verifyToken';
import { logAudit, extractRequestInfo } from '../../services/audit';
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

    const cacheKey = 'charts:sector-breakdown';
    let chartData = getCached<ChartDataResponse>(cacheKey);

    if (!chartData) {
      const sectors = [
        { name: 'Retail', count: 245 },
        { name: 'Manufacturing', count: 189 },
        { name: 'Services', count: 312 },
        { name: 'Agriculture', count: 156 },
        { name: 'Technology', count: 78 },
        { name: 'Hospitality', count: 203 },
      ];

      const labels = sectors.map((s) => s.name);
      const data = sectors.map((s) => s.count);
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

      const totalCount = sectors.reduce((sum, s) => sum + s.count, 0);

      chartData = {
        labels,
        datasets: [
          {
            label: 'UMKM by Sector',
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
      action: 'charts_sector_breakdown_retrieved',
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

    context.error('Error in sector breakdown chart handler:', error);

    await logAudit({
      userId,
      action: isAuthError ? 'charts_sector_breakdown_unauthorized' : 'charts_sector_breakdown_error',
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

app.http('sectorBreakdownChart', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'charts/sector-breakdown',
  handler,
});

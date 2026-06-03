import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/verifyToken';
import { logAudit, extractRequestInfo } from '../../services/audit';
import { initializeMlService, getLocationsByKabupaten } from '../../services/ml';
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

    const cacheKey = 'charts:location-heatmap';
    let chartData = getCached<ChartDataResponse>(cacheKey);

    if (!chartData) {
      initializeMlService();
      const locations = getLocationsByKabupaten('Bandung').slice(0, 15);

      const labels = locations.map((l) => l.kecamatan);
      const data = locations.map((l) => l.predicted_score);

      chartData = {
        labels,
        datasets: [
          {
            label: 'Location Opportunity Score',
            data,
            backgroundColor: data.map((score) => {
              if (score >= 85) return '#10b981';
              if (score >= 70) return '#3b82f6';
              if (score >= 55) return '#f59e0b';
              return '#ef4444';
            }),
          },
        ],
        metadata: {
          total_records: locations.length,
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
      action: 'charts_location_heatmap_retrieved',
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

    context.error('Error in location heatmap chart handler:', error);

    await logAudit({
      userId,
      action: isAuthError ? 'charts_location_heatmap_unauthorized' : 'charts_location_heatmap_error',
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

app.http('locationHeatmapChart', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'charts/location-heatmap',
  handler,
});

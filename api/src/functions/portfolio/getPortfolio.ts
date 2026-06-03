import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/verifyToken';
import { logAudit, extractRequestInfo } from '../../services/audit';
import { mockDb } from '../../db/mock';

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const portfolioId = request.params.id;
    if (!portfolioId) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Portfolio ID is required',
        },
      };
    }

    const portfolio = await mockDb.getPortfolio(portfolioId, userId);
    if (!portfolio) {
      await logAudit({
        userId,
        action: 'portfolio_get_not_found',
        endpoint: requestInfo.endpoint,
        method: requestInfo.method,
        statusCode: 404,
        responseTimeMs: Date.now() - startTime,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
      });

      return {
        status: 404,
        jsonBody: {
          success: false,
          error: 'Portfolio not found',
        },
      };
    }

    const items = await mockDb.getPortfolioItems(portfolioId);

    // Calculate portfolio statistics
    const scores = items.map((item) => item.score);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const riskCounts = {
      low: items.filter((i) => i.risk_level === 'low').length,
      medium: items.filter((i) => i.risk_level === 'medium').length,
      high: items.filter((i) => i.risk_level === 'high').length,
      very_high: items.filter((i) => i.risk_level === 'very_high').length,
    };

    await logAudit({
      userId,
      action: 'portfolio_get_retrieved',
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
        data: {
          portfolio,
          items,
          statistics: {
            total_items: items.length,
            average_score: Math.round(avgScore),
            risk_distribution: riskCounts,
          },
        },
        metadata: {
          retrieved_at: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message === 'Unauthorized';
    const statusCode = isAuthError ? 401 : 500;

    context.error('Error in getPortfolio handler:', error);

    await logAudit({
      userId,
      action: isAuthError ? 'portfolio_get_unauthorized' : 'portfolio_get_error',
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

app.http('getPortfolio', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'portfolio/{id}',
  handler,
});

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/verifyToken';
import { logAudit, extractRequestInfo } from '../../services/audit';
import { mockDb } from '../../db/mock';

interface RemoveFromPortfolioRequest {
  item_id: string;
}

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

    // Verify portfolio exists and belongs to user
    const portfolio = await mockDb.getPortfolio(portfolioId, userId);
    if (!portfolio) {
      await logAudit({
        userId,
        action: 'portfolio_remove_not_found',
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

    const body = (await request.json()) as RemoveFromPortfolioRequest;

    if (!body.item_id) {
      await logAudit({
        userId,
        action: 'portfolio_remove_validation_error',
        endpoint: requestInfo.endpoint,
        method: requestInfo.method,
        statusCode: 400,
        responseTimeMs: Date.now() - startTime,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
      });

      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Item ID is required',
        },
      };
    }

    const removed = await mockDb.removePortfolioItem(body.item_id, portfolioId);

    if (!removed) {
      await logAudit({
        userId,
        action: 'portfolio_remove_not_found',
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
          error: 'Item not found in portfolio',
        },
      };
    }

    await logAudit({
      userId,
      action: 'portfolio_item_removed',
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
        message: 'Item removed from portfolio',
        metadata: {
          removed_at: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message.startsWith('Unauthorized');
    const statusCode = isAuthError ? 401 : 500;

    context.error('Error in removeFromPortfolio handler:', error);

    await logAudit({
      userId,
      action: isAuthError ? 'portfolio_remove_unauthorized' : 'portfolio_remove_error',
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

app.http('removeFromPortfolio', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'portfolio/{id}/umkm',
  handler,
});

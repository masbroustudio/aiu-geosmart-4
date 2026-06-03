import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/verifyToken';
import { logAudit, extractRequestInfo } from '../../services/audit';
import { mockDb } from '../../db/mock';

interface AddToPortfolioRequest {
  umkm_id: string;
  umkm_name?: string;
  score: number;
  risk_level: 'low' | 'medium' | 'high' | 'very_high';
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
        action: 'portfolio_add_not_found',
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

    const body = (await request.json()) as AddToPortfolioRequest;

    if (!body.umkm_id || body.score === undefined || !body.risk_level) {
      await logAudit({
        userId,
        action: 'portfolio_add_validation_error',
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
          error: 'Missing required fields: umkm_id, score, risk_level',
        },
      };
    }

    const item = await mockDb.addPortfolioItem(
      portfolioId,
      body.umkm_id,
      body.score,
      body.risk_level,
      body.umkm_name,
      userId
    );

    await logAudit({
      userId,
      action: 'portfolio_item_added',
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      statusCode: 201,
      responseTimeMs: Date.now() - startTime,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
    });

    return {
      status: 201,
      jsonBody: {
        success: true,
        data: item,
        metadata: {
          added_at: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message === 'Unauthorized';
    const statusCode = isAuthError ? 401 : 500;

    context.error('Error in addToPortfolio handler:', error);

    await logAudit({
      userId,
      action: isAuthError ? 'portfolio_add_unauthorized' : 'portfolio_add_error',
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

app.http('addToPortfolio', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'portfolio/{id}/umkm',
  handler,
});

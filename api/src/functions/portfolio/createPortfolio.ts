import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/verifyToken';
import { logAudit, extractRequestInfo } from '../../services/audit';
import { mockDb } from '../../db/mock';

interface CreatePortfolioRequest {
  name: string;
  description?: string;
}

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const body = (await request.json()) as CreatePortfolioRequest;

    if (!body.name || body.name.trim().length === 0) {
      await logAudit({
        userId,
        action: 'portfolio_create_validation_error',
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
          error: 'Portfolio name is required',
        },
      };
    }

    const portfolio = await mockDb.createPortfolio(userId, body.name, body.description);

    await logAudit({
      userId,
      action: 'portfolio_created',
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
        data: portfolio,
        metadata: {
          created_by_user_id: userId,
          created_at: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message === 'Unauthorized';
    const statusCode = isAuthError ? 401 : 500;

    context.error('Error in createPortfolio handler:', error);

    await logAudit({
      userId,
      action: isAuthError ? 'portfolio_create_unauthorized' : 'portfolio_create_error',
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

app.http('createPortfolio', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'portfolio',
  handler,
});

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/verifyToken';
import { logAudit, extractRequestInfo } from '../../services/audit';
import {
  scoreCreditRisk,
  CreditScoringRequest,
  initializeMlService,
} from '../../services/ml';

interface ScoringRequest extends CreditScoringRequest {
  umkm_name?: string;
  sector?: string;
}

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    // Require authentication
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    // Initialize ML service on first call
    initializeMlService();

    // Parse request body
    const body = (await request.json()) as ScoringRequest;

    // Validate required fields
    if (!body.umkm_name && !body.sector) {
      await logAudit({
        userId,
        action: 'credit_score_validation_error',
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
          error: 'Missing required fields: umkm_name or sector',
        },
      };
    }

    // Score the credit risk
    const scoreResult = scoreCreditRisk(body);

    await logAudit({
      userId,
      action: 'credit_score_generated',
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
        data: scoreResult,
        metadata: {
          scored_by_user_id: userId,
          scored_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message.startsWith('Unauthorized');
    const statusCode = isAuthError ? 401 : 500;

    context.error('Error in creditScore handler:', error);

    await logAudit({
      userId,
      action: isAuthError ? 'credit_score_unauthorized' : 'credit_score_error',
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

app.http('creditScore', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'scoring/credit',
  handler,
});

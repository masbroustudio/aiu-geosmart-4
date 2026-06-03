import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../../middleware/verifyToken';
import { logAudit, extractRequestInfo } from '../../services/audit';
import {
  scoreCreditRisk,
  CreditScoringRequest,
  CreditScoringResponse,
  initializeMlService,
} from '../../services/ml';

interface BatchScoreRequest {
  umkms: CreditScoringRequest[];
  include_analysis?: boolean;
}

interface BatchScoreResponse {
  total_processed: number;
  total_high_risk: number;
  total_medium_risk: number;
  total_low_risk: number;
  average_score: number;
  median_score: number;
  scores: CreditScoringResponse[];
  processing_time_ms: number;
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
    const body = (await request.json()) as BatchScoreRequest;

    // Validate input
    if (!body.umkms || !Array.isArray(body.umkms)) {
      await logAudit({
        userId,
        action: 'batch_score_validation_error',
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
          error: 'Invalid request: umkms must be an array',
        },
      };
    }

    // Validate batch size
    if (body.umkms.length === 0 || body.umkms.length > 1000) {
      await logAudit({
        userId,
        action: 'batch_score_size_error',
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
          error: 'Batch size must be between 1 and 1000 UMKMs',
        },
      };
    }

    // Score each UMKM
    const scores = body.umkms.map((umkm) => scoreCreditRisk(umkm));

    // Calculate statistics
    const creditScores = scores.map((s) => s.credit_score);
    const totalScore = creditScores.reduce((sum, score) => sum + score, 0);
    const averageScore = creditScores.length > 0 ? totalScore / creditScores.length : 0;

    // Calculate median
    const sortedScores = [...creditScores].sort((a, b) => a - b);
    const median =
      sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
        : sortedScores[Math.floor(sortedScores.length / 2)];

    // Count risk levels
    const riskCounts = {
      high_risk: scores.filter((s) => s.risk_level === 'low').length,
      medium_risk: scores.filter((s) => s.risk_level === 'medium').length,
      low_risk: scores.filter((s) => s.risk_level === 'high' || s.risk_level === 'very_high').length,
    };

    const response: BatchScoreResponse = {
      total_processed: scores.length,
      total_high_risk: riskCounts.low_risk,
      total_medium_risk: riskCounts.medium_risk,
      total_low_risk: riskCounts.high_risk,
      average_score: Math.round(averageScore),
      median_score: Math.round(median),
      scores,
      processing_time_ms: Date.now() - startTime,
    };

    await logAudit({
      userId,
      action: 'batch_score_processed',
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
        data: response,
        metadata: {
          scored_by_user_id: userId,
          scored_at: new Date().toISOString(),
          batch_size: scores.length,
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message === 'Unauthorized';
    const statusCode = isAuthError ? 401 : 500;

    context.error('Error in batchScore handler:', error);

    await logAudit({
      userId,
      action: isAuthError ? 'batch_score_unauthorized' : 'batch_score_error',
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

app.http('batchScore', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'scoring/batch',
  handler,
});

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getCreditBands, getPDRegBuckets } from "../data/loader.js";
import { requireAuth } from "../middleware/verifyToken";
import { logAudit, extractRequestInfo } from "../services/audit";

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    // Require authentication
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const band = request.query.get("band") || undefined;
    const limit = parseInt(request.query.get("limit") || "50", 10);

    let creditBands = getCreditBands();
    const pdBuckets = getPDRegBuckets();

    if (band) {
      creditBands = creditBands.filter(
        (item) => item.Rating.toLowerCase().includes(band.toLowerCase())
      );
    }

    const results = creditBands.slice(0, limit);

    await logAudit({
      userId,
      action: "credit_score_view",
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
          credit_score_bands: results,
          pd_regulatory_buckets: pdBuckets,
        },
        summary: {
          total_bands: creditBands.length,
          total_pd_buckets: pdBuckets.length,
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message.startsWith('Unauthorized');
    const statusCode = isAuthError ? 401 : 500;
    
    context.error("Error in credit handler:", error);

    await logAudit({
      userId,
      action: isAuthError ? "credit_score_unauthorized" : "credit_score_error",
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      statusCode,
      responseTimeMs: Date.now() - startTime,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
    });

    return {
      status: statusCode,
      jsonBody: { success: false, error: isAuthError ? "Unauthorized: Valid token required" : "Internal server error" },
    };
  }
}

app.http("credit", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "credit",
  handler,
});

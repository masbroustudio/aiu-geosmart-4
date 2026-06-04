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
        (item) => item.Rating && item.Rating.toLowerCase().includes(band.toLowerCase())
      );
    }

    const results = creditBands.slice(0, limit).map((b) => ({
      Rating: b.Rating,
      "Score Range": b["Score Range"],
      Count: Number(b.Count || 0),
      "Pct of Portfolio": b["Pct of Portfolio"],
      "Actual Default Rate": b["Actual Default Rate"],
      "Mean Predicted PD": b["Mean Predicted PD"],
      rating: b.Rating,
      score_range: b["Score Range"],
      count: Number(b.Count || 0),
      pct_of_portfolio: b["Pct of Portfolio"],
      actual_default_rate: b["Actual Default Rate"],
      mean_predicted_pd: b["Mean Predicted PD"],
    }));

    const pdBucketsMapped = pdBuckets.map((b) => ({
      "PD Bucket": b["PD Bucket"],
      Count: Number(b.Count || 0),
      "Pct of Portfolio": b["Pct of Portfolio"],
      "Actual Default Rate": b["Actual Default Rate"],
      "Avg Predicted PD": b["Avg Predicted PD"],
      "Expected Loss (EL)": b["Expected Loss (EL)"],
      bucket: b["PD Bucket"],
      count: Number(b.Count || 0),
      pct_portfolio: b["Pct of Portfolio"],
      default_rate: b["Actual Default Rate"],
      avg_pd: b["Avg Predicted PD"],
      expected_loss: b["Expected Loss (EL)"],
    }));

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
          pd_regulatory_buckets: pdBucketsMapped,
        },
        summary: {
          total_bands: creditBands.length,
          total_pd_buckets: pdBucketsMapped.length,
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

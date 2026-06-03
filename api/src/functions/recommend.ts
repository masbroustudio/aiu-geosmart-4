import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getRecommendations } from "../data/loader.js";
import { requireAuth } from "../middleware/verifyToken.js";
import { logAudit, extractRequestInfo } from "../services/audit.js";

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    // Require authentication
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const jenisUsaha = request.query.get("jenis_usaha") || undefined;
    const kabupaten = request.query.get("kabupaten") || undefined;
    const limit = parseInt(request.query.get("limit") || "50", 10);

    let data = getRecommendations();

    if (jenisUsaha) {
      data = data.filter(
        (item) => item.jenis_usaha.toLowerCase() === jenisUsaha.toLowerCase()
      );
    }

    if (kabupaten) {
      data = data.filter(
        (item) => item.kabupaten_kota.toLowerCase() === kabupaten.toLowerCase()
      );
    }

    // Sort by recommendation_score desc
    const sorted = [...data].sort((a, b) => b.recommendation_score - a.recommendation_score);
    const results = sorted.slice(0, limit);

    await logAudit({
      userId,
      action: "recommendations_view",
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
        data: results,
        summary: {
          total_filtered: data.length,
          showing: results.length,
          unique_kecamatan: new Set(data.map((d) => d.kecamatan)).size,
          unique_jenis_usaha: new Set(data.map((d) => d.jenis_usaha)).size,
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message === 'Unauthorized';
    const statusCode = isAuthError ? 401 : 500;
    
    context.error("Error in recommend handler:", error);

    await logAudit({
      userId,
      action: isAuthError ? "recommendations_unauthorized" : "recommendations_error",
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

app.http("recommend", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "recommend",
  handler,
});


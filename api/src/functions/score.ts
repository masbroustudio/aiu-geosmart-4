import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getUmkmData } from "../data/loader.js";
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

    const kabupaten = request.query.get("kabupaten") || undefined;
    const jenisUsaha = request.query.get("jenis_usaha") || undefined;
    const limit = parseInt(request.query.get("limit") || "20", 10);

    let data = await getUmkmData();

    if (kabupaten) {
      data = data.filter(
        (item) => item.kabupaten_kota.toLowerCase() === kabupaten.toLowerCase()
      );
    }

    if (jenisUsaha) {
      data = data.filter(
        (item) => item.jenis_usaha.toLowerCase() === jenisUsaha.toLowerCase()
      );
    }

    // Sort by skor_potensi descending
    const sorted = [...data].sort((a, b) => b.skor_potensi - a.skor_potensi);
    const results = sorted.slice(0, limit);

    // Summary stats
    const totalFiltered = data.length;
    const avgScore = totalFiltered > 0
      ? data.reduce((sum, item) => sum + item.skor_potensi, 0) / totalFiltered
      : 0;
    const maxScore = totalFiltered > 0 ? Math.max(...data.map((d) => d.skor_potensi)) : 0;
    const minScore = totalFiltered > 0 ? Math.min(...data.map((d) => d.skor_potensi)) : 0;

    await logAudit({
      userId,
      action: "score_view",
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
          total_filtered: totalFiltered,
          avg_score: Math.round(avgScore * 100) / 100,
          max_score: Math.round(maxScore * 100) / 100,
          min_score: Math.round(minScore * 100) / 100,
          showing: results.length,
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message.startsWith('Unauthorized');
    const statusCode = isAuthError ? 401 : 500;
    
    context.error("Error in score handler:", error);

    await logAudit({
      userId,
      action: isAuthError ? "score_unauthorized" : "score_error",
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

app.http("score", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "score",
  handler,
});


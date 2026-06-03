import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getKecamatanData } from "../data/loader.js";
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

    let data = getKecamatanData();

    if (kabupaten) {
      data = data.filter(
        (item) => item.kabupaten_kota.toLowerCase() === kabupaten.toLowerCase()
      );
    }

    await logAudit({
      userId,
      action: "kecamatan_view",
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
        data,
        summary: {
          total: data.length,
          unique_kabupaten: new Set(data.map((d) => d.kabupaten_kota)).size,
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message === 'Unauthorized';
    const statusCode = isAuthError ? 401 : 500;
    
    context.error("Error in kecamatan handler:", error);

    await logAudit({
      userId,
      action: isAuthError ? "kecamatan_unauthorized" : "kecamatan_error",
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

app.http("kecamatan", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "kecamatan",
  handler,
});


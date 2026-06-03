import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getKecamatanData } from "../data/loader.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { logAudit, extractRequestInfo } from "../services/audit.js";

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    // Verify authentication
    const auth = await verifyToken(request, context);
    userId = auth?.userId;

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
    context.error("Error in kecamatan handler:", error);

    await logAudit({
      userId,
      action: "kecamatan_error",
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      statusCode: 500,
      responseTimeMs: Date.now() - startTime,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
    });

    return {
      status: 500,
      jsonBody: { success: false, error: "Internal server error" },
    };
  }
}

app.http("kecamatan", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "kecamatan",
  handler,
});


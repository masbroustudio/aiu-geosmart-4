import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getRecommendations } from "../data/loader.js";

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
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
    context.error("Error in recommend handler:", error);
    return {
      status: 500,
      jsonBody: { success: false, error: "Internal server error" },
    };
  }
}

app.http("recommend", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "recommend",
  handler,
});

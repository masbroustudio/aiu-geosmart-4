import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getUmkmData } from "../data/loader.js";

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const kabupaten = request.query.get("kabupaten") || undefined;
    const jenisUsaha = request.query.get("jenis_usaha") || undefined;
    const limit = parseInt(request.query.get("limit") || "20", 10);

    let data = getUmkmData();

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
    context.error("Error in score handler:", error);
    return {
      status: 500,
      jsonBody: { success: false, error: "Internal server error" },
    };
  }
}

app.http("score", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "score",
  handler,
});

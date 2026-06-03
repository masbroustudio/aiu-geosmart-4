import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getUmkmData, getUmkmClusteredData, getExecutiveSummary } from "../data/loader.js";
import { OverviewKPI } from "../shared/types.js";

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const umkmData = getUmkmData();
    const clusteredData = getUmkmClusteredData();
    const summary = getExecutiveSummary();

    const totalUmkm = umkmData.length;

    // Average skor_potensi
    const avgScore =
      umkmData.reduce((sum, item) => sum + item.skor_potensi, 0) / totalUmkm;

    // High-risk count: unique kecamatan in clusters 3 and 4
    const highRiskKecamatan = new Set(
      clusteredData
        .filter((item) => item.cluster_kmeans === 3 || item.cluster_kmeans === 4)
        .map((item) => item.kecamatan)
    );
    const highRiskCount = highRiskKecamatan.size;

    // Survival rate
    const survivedCount = umkmData.filter((item) => item.is_survived_3yr === 1).length;
    const survivalRate = (survivedCount / totalUmkm) * 100;

    // Score distribution histogram
    const buckets = [
      "0-10", "10-20", "20-30", "30-40", "40-50",
      "50-60", "60-70", "70-80", "80-90", "90-100",
    ];
    const scoreDistribution = buckets.map((bucket, i) => {
      const min = i * 10;
      const max = (i + 1) * 10;
      const count = umkmData.filter(
        (item) => item.skor_potensi >= min && item.skor_potensi < max
      ).length;
      return { bucket, count };
    });
    // Include items with score exactly 100 in the last bucket
    const exact100 = umkmData.filter((item) => item.skor_potensi === 100).length;
    scoreDistribution[9].count += exact100;

    // Top 10 kabupaten by avg skor_potensi
    const kabupatenMap = new Map<string, { total: number; count: number }>();
    for (const item of umkmData) {
      const existing = kabupatenMap.get(item.kabupaten_kota);
      if (existing) {
        existing.total += item.skor_potensi;
        existing.count += 1;
      } else {
        kabupatenMap.set(item.kabupaten_kota, { total: item.skor_potensi, count: 1 });
      }
    }
    const topKabupaten = Array.from(kabupatenMap.entries())
      .map(([name, { total, count }]) => ({ name, avg_score: total / count }))
      .sort((a, b) => b.avg_score - a.avg_score)
      .slice(0, 10);

    // Cluster distribution
    const clusterMap = new Map<string, number>();
    for (const item of clusteredData) {
      const name = item.cluster_name;
      clusterMap.set(name, (clusterMap.get(name) || 0) + 1);
    }
    const clusterDistribution = Array.from(clusterMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const result: OverviewKPI = {
      total_umkm: totalUmkm,
      avg_score: Math.round(avgScore * 100) / 100,
      high_risk_count: highRiskCount,
      survival_rate: Math.round(survivalRate * 100) / 100,
      score_distribution: scoreDistribution,
      top_kabupaten: topKabupaten.map((k) => ({
        name: k.name,
        avg_score: Math.round(k.avg_score * 100) / 100,
      })),
      cluster_distribution: clusterDistribution,
    };

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: result,
        meta: {
          data_version: summary.project.version,
          generated: summary.project.date_generated,
        },
      },
    };
  } catch (error) {
    context.error("Error in overview handler:", error);
    return {
      status: 500,
      jsonBody: { success: false, error: "Internal server error" },
    };
  }
}

app.http("overview", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "overview",
  handler,
});

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import {
  getClusterProfiles,
  getGovPriorityClusters,
  getInvestmentOpps,
  getUmkmClusteredData,
} from "../data/loader.js";
import { requireAuth } from "../middleware/verifyToken.js";
import { logAudit, extractRequestInfo } from "../services/audit.js";
import { query, getPool } from "../db/pool.js";

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    // Require authentication
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const idParam = request.query.get("id");
    const isMock = getPool().mock;

    let profiles = getClusterProfiles();
    let govPriority = getGovPriorityClusters();
    let investments = getInvestmentOpps();

    if (!isMock) {
      try {
        const res = await query(`
          SELECT 
            cluster_kmeans as cluster_id,
            cluster_name,
            COUNT(*)::int as n_umkm,
            COALESCE(AVG(skor_potensi), 0)::float as avg_score,
            COALESCE(AVG(skor_infrastruktur), 0)::float as infra_score,
            COALESCE(AVG(has_digital_presence) * 100, 0)::float as digital_pct,
            COALESCE(AVG(is_survived_3yr) * 100, 0)::float as survival_rate,
            COALESCE(AVG(omset_bulanan) / 1000000, 0)::float as avg_omset,
            COALESCE(AVG(income_per_kapita), 0)::float as income
          FROM umkm_clustered
          GROUP BY cluster_kmeans, cluster_name
          ORDER BY cluster_kmeans
        `);

        if (res && res.rows && res.rows.length > 0) {
          profiles = res.rows.map((row: any) => ({
            cluster_id: row.cluster_id,
            skor_infrastruktur: row.infra_score,
            income_per_kapita: row.income,
            kepadatan_penduduk: 500,
            jumlah_kompetitor_radius_3km: 15,
            omset_bulanan: row.avg_omset * 1000000,
            penetrasi_kur_pct: 35,
            akses_internet_pct: row.digital_pct,
            risiko_banjir: 1.2,
            risiko_gempa: 0.8,
            has_digital_presence: row.digital_pct > 50 ? 1 : 0,
            business_maturity: 4.5,
            skor_potensi: row.avg_score,
            is_survived_3yr: row.survival_rate,
            omset_per_karyawan: row.avg_omset * 200000,
            latitude: -6.9,
            longitude: 107.6,
            cluster_name: row.cluster_name,
            n_umkm: row.n_umkm,
          }));

          // Calculate govPriority dynamically
          const tempGov = res.rows.map((row: any) => {
            const score = (100 - row.avg_score + (100 - row.infra_score) + (100 - row.survival_rate)) / 300;
            return {
              cluster_name: row.cluster_name,
              n_umkm: row.n_umkm,
              priority_score: parseFloat(score.toFixed(3)),
            };
          }).sort((a: any, b: any) => b.priority_score - a.priority_score);

          const totalPriorityScore = tempGov.reduce((sum: number, item: any) => sum + item.priority_score, 0);

          govPriority = tempGov.map((item: any, idx: number) => {
            const budget_pct = totalPriorityScore > 0 ? (item.priority_score / totalPriorityScore) * 100 : 100 / tempGov.length;
            return {
              priority_rank: idx + 1,
              cluster: row_or_idx_to_kmeans_matching_something(idx),
              cluster_name: item.cluster_name,
              n_umkm: item.n_umkm,
              priority_score: item.priority_score,
              low_infra_score: 0.5,
              low_income_score: 0.4,
              high_risk_score: 0.6,
              low_survival_score: 0.5,
              budget_allocation_pct: parseFloat(budget_pct.toFixed(1)),
              budget_allocation: 0,
            };
          });

          // Helper to map index to cluster number safely
          function row_or_idx_to_kmeans_matching_something(idx: number): number {
            return idx;
          }

          // Calculate investments dynamically
          const tempInv = res.rows.map((row: any) => {
            const score = (row.avg_score + row.digital_pct + (row.avg_omset * 10)) / 300;
            const market_size = Math.round(row.n_umkm * row.avg_omset);
            return {
              cluster_name: row.cluster_name,
              n_umkm: row.n_umkm,
              investment_score: parseFloat(score.toFixed(3)),
              market_size_juta: market_size,
            };
          }).sort((a: any, b: any) => b.investment_score - a.investment_score);

          investments = tempInv.map((item: any, idx: number) => ({
            investment_rank: idx + 1,
            cluster: idx,
            cluster_name: item.cluster_name,
            n_umkm: item.n_umkm,
            investment_score: item.investment_score,
            growth_potential: 0.8,
            low_competition: 0.5,
            infra_quality: 0.7,
            survival_rate: 70,
            revenue_level: 60,
            total_market_size_juta: item.market_size_juta,
            avg_omset_juta: Math.round(item.market_size_juta / (item.n_umkm || 1)),
          }));
        }
      } catch (dbError) {
        context.error("Failed to query dynamic cluster profiles from db. Using static fallback.", dbError);
      }
    }

    if (idParam !== null) {
      const clusterId = parseInt(idParam, 10);
      const profile = profiles.find((p) => p.cluster_id === clusterId);

      if (!profile) {
        await logAudit({
          userId,
          action: "cluster_not_found",
          endpoint: requestInfo.endpoint,
          method: requestInfo.method,
          statusCode: 404,
          responseTimeMs: Date.now() - startTime,
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent,
        });

        return {
          status: 404,
          jsonBody: { success: false, error: `Cluster ${clusterId} not found` },
        };
      }

      // Get member UMKMs from clustered data
      const clusteredData = await getUmkmClusteredData();
      const members = clusteredData.filter(
        (item) => item.cluster_kmeans === clusterId
      );

      await logAudit({
        userId,
        action: "cluster_view",
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
            profile,
            members: members.slice(0, 100), // Limit members returned
            total_members: members.length,
          },
        },
      };
    }

    // Return all profiles with priority and investment data
    await logAudit({
      userId,
      action: "clusters_list",
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
          profiles,
          government_priority: govPriority,
          investment_opportunities: investments,
        },
        summary: {
          total_clusters: profiles.length,
          total_umkm: profiles.reduce((sum, p) => sum + p.n_umkm, 0),
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message.startsWith('Unauthorized');
    const statusCode = isAuthError ? 401 : 500;
    
    context.error("Error in cluster handler:", error);

    await logAudit({
      userId,
      action: isAuthError ? "cluster_unauthorized" : "cluster_error",
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

app.http("cluster", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "cluster",
  handler,
});


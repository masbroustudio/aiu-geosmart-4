import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import {
  getPolicyImpacts,
  getGovPriorityKecamatan,
  getGovPriorityClusters,
  getWhatIfResults,
} from "../data/loader.js";
import { requireAuth } from "../middleware/verifyToken.js";
import { logAudit, extractRequestInfo } from "../services/audit.js";

// GET Handler - Returns base policy metadata
async function getPolicyHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const policyImpacts = getPolicyImpacts();
    const priorityKecamatan = getGovPriorityKecamatan();
    const priorityClusters = getGovPriorityClusters();
    const whatifScenarios = getWhatIfResults();

    const topKecamatan = priorityKecamatan
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 20);

    const budgetData = priorityClusters.map((c) => ({
      cluster: c.cluster,
      cluster_name: c.cluster_name,
      priority_rank: c.priority_rank,
      n_umkm: c.n_umkm,
      budget_allocation_pct: c.budget_allocation_pct,
      budget_allocation: c.budget_allocation,
      priority_score: c.priority_score,
    }));

    await logAudit({
      userId,
      action: "policy_view",
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
          policy_impacts: policyImpacts,
          priority_kecamatan: topKecamatan,
          budget_allocation: budgetData,
          whatif_scenarios: whatifScenarios,
        },
        summary: {
          total_policies: policyImpacts.length,
          total_priority_kecamatan: priorityKecamatan.length,
          total_budget_clusters: priorityClusters.length,
          total_whatif_scenarios: whatifScenarios.length,
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message.startsWith('Unauthorized');
    const statusCode = isAuthError ? 401 : 500;
    context.error("Error in GET policy handler:", error);

    return {
      status: statusCode,
      jsonBody: { success: false, error: isAuthError ? "Unauthorized" : "Internal server error" },
    };
  }
}

// POST Handler - Performs dynamic non-linear simulations based on budget allocation
async function simulatePolicyHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const body: any = await request.json();
    const { allocations, totalBudget } = body;

    if (!Array.isArray(allocations) || typeof totalBudget !== "number") {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: "Missing or invalid parameters: allocations (array) and totalBudget (number)"
        }
      };
    }

    const priorityClusters = getGovPriorityClusters();
    if (allocations.length !== priorityClusters.length) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: `Mismatch allocations size. Expected exactly ${priorityClusters.length} entries.`
        }
      };
    }

    let totalImproved = 0;
    let totalJobs = 0;
    let weightedScoreIncreaseSum = 0;
    let totalActiveUmkm = 0;

    const results = priorityClusters.map((cluster, idx) => {
      const pct = allocations[idx] || 0;
      const allocated = totalBudget * (pct / 100);

      // NON-LINEAR PREDICTIVE MODEL (approximation of XGBoost variables output)
      // Intervention cost is Rp 50.000.000 / UMKM
      const maxPossibleTarget = Math.round(allocated / 50_000_000);
      const predicted_umkm_improved = Math.round(
        Math.min(cluster.n_umkm, maxPossibleTarget) * (cluster.priority_score || 0.8)
      );

      const predicted_new_jobs = Math.round(predicted_umkm_improved * 2.5);

      // Non-linear score increase: logarithmic curve to simulate diminishing returns
      const factor = cluster.n_umkm > 0 ? (allocated / 50_000_000) / cluster.n_umkm : 0;
      const score_increase = factor > 0 
        ? Math.min(25, (Math.min(1.0, factor) * 10 + Math.log1p(factor) * 5) * (cluster.priority_score || 0.8) * 1.5)
        : 0;

      const roi = allocated > 0 ? Math.round((predicted_umkm_improved * 12_000_000) / allocated * 100) : 0;

      totalImproved += predicted_umkm_improved;
      totalJobs += predicted_new_jobs;
      weightedScoreIncreaseSum += score_increase * cluster.n_umkm;
      totalActiveUmkm += cluster.n_umkm;

      return {
        cluster: cluster.cluster,
        cluster_name: cluster.cluster_name,
        allocation_pct: pct,
        allocated_budget: allocated,
        predicted_umkm_improved,
        predicted_new_jobs,
        predicted_score_increase: parseFloat(score_increase.toFixed(1)),
        roi
      };
    });

    const avgScoreIncrease = totalActiveUmkm > 0 ? parseFloat((weightedScoreIncreaseSum / totalActiveUmkm).toFixed(2)) : 0;

    await logAudit({
      userId,
      action: "policy_simulate",
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
          results,
          summary: {
            totalImproved,
            totalNewJobs: totalJobs,
            avgScoreIncrease,
            base_score: 61.3,
            simulated_score: parseFloat((61.3 + avgScoreIncrease).toFixed(2))
          }
        }
      }
    };

  } catch (error: any) {
    const isAuthError = error instanceof Error && error.message.startsWith('Unauthorized');
    const statusCode = isAuthError ? 401 : 500;
    context.error("Error in simulatePolicyHandler:", error);

    return {
      status: statusCode,
      jsonBody: { success: false, error: isAuthError ? "Unauthorized" : "Internal server error" },
    };
  }
}

app.http("policyGet", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "policy",
  handler: getPolicyHandler,
});

app.http("policySimulate", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "policy/simulate",
  handler: simulatePolicyHandler,
});

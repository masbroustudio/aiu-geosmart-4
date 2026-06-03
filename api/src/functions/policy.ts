import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import {
  getPolicyImpacts,
  getGovPriorityKecamatan,
  getGovPriorityClusters,
} from "../data/loader.js";
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

    const policyImpacts = getPolicyImpacts();
    const priorityKecamatan = getGovPriorityKecamatan();
    const priorityClusters = getGovPriorityClusters();

    // Return top 20 priority kecamatan
    const topKecamatan = priorityKecamatan
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 20);

    // Budget allocation data
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
        },
        summary: {
          total_policies: policyImpacts.length,
          total_priority_kecamatan: priorityKecamatan.length,
          total_budget_clusters: priorityClusters.length,
        },
      },
    };
  } catch (error) {
    context.error("Error in policy handler:", error);

    await logAudit({
      userId,
      action: "policy_error",
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

app.http("policy", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "policy",
  handler,
});


import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import {
  getPolicyImpacts,
  getGovPriorityKecamatan,
  getGovPriorityClusters,
} from "../data/loader.js";

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
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

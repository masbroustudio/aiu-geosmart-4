import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import {
  getClusterProfiles,
  getGovPriorityClusters,
  getInvestmentOpps,
  getUmkmClusteredData,
} from "../data/loader.js";

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const idParam = request.query.get("id");
    const profiles = getClusterProfiles();
    const govPriority = getGovPriorityClusters();
    const investments = getInvestmentOpps();

    if (idParam !== null) {
      const clusterId = parseInt(idParam, 10);
      const profile = profiles.find((p) => p.cluster_id === clusterId);

      if (!profile) {
        return {
          status: 404,
          jsonBody: { success: false, error: `Cluster ${clusterId} not found` },
        };
      }

      // Get member UMKMs from clustered data
      const clusteredData = getUmkmClusteredData();
      const members = clusteredData.filter(
        (item) => item.cluster_kmeans === clusterId
      );

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
    context.error("Error in cluster handler:", error);
    return {
      status: 500,
      jsonBody: { success: false, error: "Internal server error" },
    };
  }
}

app.http("cluster", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "cluster",
  handler,
});

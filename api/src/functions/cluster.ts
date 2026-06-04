import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import {
  getClusterProfiles,
  getGovPriorityClusters,
  getInvestmentOpps,
  getUmkmClusteredData,
} from "../data/loader.js";
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

    const idParam = request.query.get("id");
    const profiles = getClusterProfiles();
    const govPriority = getGovPriorityClusters();
    const investments = getInvestmentOpps();

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


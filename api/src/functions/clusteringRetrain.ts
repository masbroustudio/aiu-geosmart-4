import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { requireAuth } from "../middleware/verifyToken.js";
import { logAudit, extractRequestInfo } from "../services/audit.js";
import { rebuildClustersFromDataset } from "../services/clustering.js";

// 1. Timer Trigger - Runs weekly on Sunday at midnight (00:00)
async function weeklyRetrainTimerHandler(myTimer: any, context: InvocationContext): Promise<void> {
  context.log("Timer trigger 'clusteringRetrainTimer' started weekly clustering retraining pipeline.");
  
  try {
    const result = await rebuildClustersFromDataset();
    if (result.success) {
      context.log(`Timer trigger success: Retrained and updated ${result.count} UMKM clusters.`);
    } else {
      context.error(`Timer trigger failed: ${result.error}`);
    }
  } catch (error) {
    context.error("Unhandled error in clustering retrain timer handler:", error);
  }
}

// 2. HTTP Developer Trigger - Allows manual trigger of retraining via Postman or admin tools
async function manualRetrainHttpHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    // Require authentication
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    // Check if user is administrator
    if (auth.role !== "administrator") {
      return {
        status: 403,
        jsonBody: {
          success: false,
          error: "Forbidden: Only administrator can run clustering retraining pipeline"
        }
      };
    }

    // Parse parameters from request body
    let k: number | undefined;
    let method: string | undefined;
    
    try {
      const body = await request.json() as any;
      if (body) {
        if (body.k) k = parseInt(body.k, 10);
        if (body.method) method = body.method;
      }
    } catch {
      // Body may be empty or invalid JSON
    }

    // Execute retraining with parameters
    const result = await rebuildClustersFromDataset(k, method);

    if (!result.success) {
      return {
        status: 500,
        jsonBody: {
          success: false,
          error: result.error || "Failed to retrain clusters"
        }
      };
    }

    await logAudit({
      userId,
      action: "clustering_manual_retrain",
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
        message: `Dynamic clustering retraining pipeline executed successfully. Recalculated ${result.count} records.`,
        data: {
          processed_count: result.count
        }
      }
    };

  } catch (error: any) {
    const isAuthError = error instanceof Error && error.message.startsWith("Unauthorized");
    const statusCode = isAuthError ? 401 : 500;
    context.error("Error in manualRetrainHttpHandler:", error);

    return {
      status: statusCode,
      jsonBody: {
        success: false,
        error: isAuthError ? error.message : "Internal server error"
      }
    };
  }
}

// Register Timer Trigger
app.timer("clusteringRetrainTimer", {
  schedule: "0 0 0 * * 0", // Run at 00:00 every Sunday
  handler: weeklyRetrainTimerHandler,
});

// Register HTTP Trigger
app.http("clusteringManualRetrain", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "developer/clustering/retrain",
  handler: manualRetrainHttpHandler,
});

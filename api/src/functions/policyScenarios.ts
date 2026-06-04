import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { requireAuth } from "../middleware/verifyToken.js";
import { createWhatIfScenario, getWhatIfScenariosByUser, deleteWhatIfScenario } from "../db/scenarios.js";

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  let userId: number | undefined;
  try {
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const method = request.method;

    if (method === "GET") {
      const scenarios = await getWhatIfScenariosByUser(auth.userId);
      return {
        status: 200,
        jsonBody: {
          success: true,
          data: scenarios
        }
      };
    } 
    
    if (method === "POST") {
      try {
        const body: any = await request.json();
        const { scenario_name, parameters, results, base_score, simulated_score, impact } = body;

        if (!scenario_name) {
          return {
            status: 400,
            jsonBody: {
              success: false,
              error: "Missing required parameter: scenario_name"
            }
          };
        }

        const scenario = await createWhatIfScenario(
          auth.userId,
          scenario_name,
          typeof parameters === "string" ? parameters : JSON.stringify(parameters || {}),
          typeof results === "string" ? results : JSON.stringify(results || {}),
          Number(base_score || 0),
          Number(simulated_score || 0),
          Number(impact || 0)
        );

        return {
          status: 201,
          jsonBody: {
            success: true,
            data: scenario
          }
        };
      } catch (err: any) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: `Invalid request payload: ${err.message || err}`
          }
        };
      }
    } 
    
    if (method === "DELETE") {
      let scenarioIdStr = request.query.get("id");
      
      if (!scenarioIdStr) {
        try {
          const body: any = await request.json();
          if (body && body.id) {
            scenarioIdStr = String(body.id);
          }
        } catch {
          // Ignore parsing error
        }
      }

      if (!scenarioIdStr) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: "Missing required parameter: id"
          }
        };
      }

      const scenarioId = parseInt(scenarioIdStr, 10);
      if (isNaN(scenarioId)) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: "Invalid parameter format: id must be a number"
          }
        };
      }

      const deleted = await deleteWhatIfScenario(scenarioId, auth.userId);
      if (!deleted) {
        return {
          status: 404,
          jsonBody: {
            success: false,
            error: "Scenario not found or not owned by user"
          }
        };
      }

      return {
        status: 200,
        jsonBody: {
          success: true,
          message: "Scenario deleted successfully"
        }
      };
    }

    return {
      status: 405,
      jsonBody: {
        success: false,
        error: `Method ${method} not allowed`
      }
    };

  } catch (error: any) {
    const isAuthError = error instanceof Error && error.message.startsWith("Unauthorized");
    const statusCode = isAuthError ? 401 : 500;
    context.error("Error in policyScenarios handler:", error);

    return {
      status: statusCode,
      jsonBody: {
        success: false,
        error: isAuthError ? error.message : "Internal server error"
      }
    };
  }
}

app.http("policyScenarios", {
  methods: ["GET", "POST", "DELETE"],
  authLevel: "anonymous",
  route: "policy/scenarios",
  handler,
});

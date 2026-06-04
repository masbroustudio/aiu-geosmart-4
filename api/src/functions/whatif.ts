import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getWhatIfResults } from "../data/loader.js";
import { requireAuth } from "../middleware/verifyToken.js";
import { logAudit, extractRequestInfo } from "../services/audit.js";

interface WhatIfRequest {
  infrastructure_improvement?: number;
  new_bank_distance?: number;
  internet_pct_increase?: number;
  target_kecamatan?: string;
  scenario?: string;
}

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    // Require authentication
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const body = (await request.json()) as WhatIfRequest;
    const allScenarios = getWhatIfResults();

    let matchedScenarios = allScenarios;

    // Try to match by target_kecamatan
    if (body.target_kecamatan) {
      const keyword = body.target_kecamatan.toLowerCase();
      const filtered = allScenarios.filter(
        (s) => s.scenario.toLowerCase().includes(keyword)
      );
      if (filtered.length > 0) {
        matchedScenarios = filtered;
      }
    }

    // Try to match by scenario text
    if (body.scenario) {
      const keyword = body.scenario.toLowerCase();
      const filtered = allScenarios.filter(
        (s) => s.scenario.toLowerCase().includes(keyword)
      );
      if (filtered.length > 0) {
        matchedScenarios = filtered;
      }
    }

    // Try to match by infrastructure improvement keywords
    if (body.infrastructure_improvement) {
      const filtered = allScenarios.filter(
        (s) => s.scenario.toLowerCase().includes("infrastructure") ||
               s.scenario.toLowerCase().includes("infra")
      );
      if (filtered.length > 0) {
        matchedScenarios = filtered;
      }
    }

    // Try to match by bank distance
    if (body.new_bank_distance) {
      const filtered = allScenarios.filter(
        (s) => s.scenario.toLowerCase().includes("bank")
      );
      if (filtered.length > 0) {
        matchedScenarios = filtered;
      }
    }

    // Try to match by internet
    if (body.internet_pct_increase) {
      const filtered = allScenarios.filter(
        (s) => s.scenario.toLowerCase().includes("internet") ||
               s.scenario.toLowerCase().includes("digital")
      );
      if (filtered.length > 0) {
        matchedScenarios = filtered;
      }
    }

    await logAudit({
      userId,
      action: "whatif_scenario",
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      statusCode: 200,
      requestBody: JSON.stringify(body),
      responseTimeMs: Date.now() - startTime,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          scenarios: matchedScenarios,
          input: body,
        },
        summary: {
          total_scenarios: allScenarios.length,
          matched: matchedScenarios.length,
        },
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message.startsWith('Unauthorized');
    const statusCode = isAuthError ? 401 : 500;
    
    context.error("Error in whatif handler:", error);

    await logAudit({
      userId,
      action: isAuthError ? "whatif_unauthorized" : "whatif_error",
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

app.http("whatif", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "whatif",
  handler,
});


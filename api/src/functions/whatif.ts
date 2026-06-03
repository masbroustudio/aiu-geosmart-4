import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getWhatIfResults } from "../data/loader.js";

interface WhatIfRequest {
  infrastructure_improvement?: number;
  new_bank_distance?: number;
  internet_pct_increase?: number;
  target_kecamatan?: string;
  scenario?: string;
}

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
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
    context.error("Error in whatif handler:", error);
    return {
      status: 500,
      jsonBody: { success: false, error: "Internal server error" },
    };
  }
}

app.http("whatif", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "whatif",
  handler,
});

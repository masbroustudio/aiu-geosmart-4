import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getCreditBands, getPDRegBuckets } from "../data/loader.js";

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const band = request.query.get("band") || undefined;
    const limit = parseInt(request.query.get("limit") || "50", 10);

    let creditBands = getCreditBands();
    const pdBuckets = getPDRegBuckets();

    if (band) {
      creditBands = creditBands.filter(
        (item) => item.Rating.toLowerCase().includes(band.toLowerCase())
      );
    }

    const results = creditBands.slice(0, limit);

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          credit_score_bands: results,
          pd_regulatory_buckets: pdBuckets,
        },
        summary: {
          total_bands: creditBands.length,
          total_pd_buckets: pdBuckets.length,
        },
      },
    };
  } catch (error) {
    context.error("Error in credit handler:", error);
    return {
      status: 500,
      jsonBody: { success: false, error: "Internal server error" },
    };
  }
}

app.http("credit", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "credit",
  handler,
});

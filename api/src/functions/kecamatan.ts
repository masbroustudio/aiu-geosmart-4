import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getKecamatanData } from "../data/loader.js";

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const kabupaten = request.query.get("kabupaten") || undefined;

    let data = getKecamatanData();

    if (kabupaten) {
      data = data.filter(
        (item) => item.kabupaten_kota.toLowerCase() === kabupaten.toLowerCase()
      );
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        data,
        summary: {
          total: data.length,
          unique_kabupaten: new Set(data.map((d) => d.kabupaten_kota)).size,
        },
      },
    };
  } catch (error) {
    context.error("Error in kecamatan handler:", error);
    return {
      status: 500,
      jsonBody: { success: false, error: "Internal server error" },
    };
  }
}

app.http("kecamatan", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "kecamatan",
  handler,
});

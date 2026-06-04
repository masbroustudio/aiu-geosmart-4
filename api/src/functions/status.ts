import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db/pool.js";
import { requireAuth } from "../middleware/verifyToken.js";

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    // Require authentication
    await requireAuth(request, context);

    const isMock = getPool().mock;
    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          dbType: isMock ? "mock" : "postgres",
          env: process.env.NODE_ENV || "development",
          version: "4.0.0"
        }
      }
    };
  } catch (error: any) {
    const isAuthError = error instanceof Error && error.message.startsWith('Unauthorized');
    const statusCode = isAuthError ? 401 : 500;
    return {
      status: statusCode,
      jsonBody: {
        success: false,
        error: isAuthError ? error.message : "Internal server error"
      }
    };
  }
}

app.http("status", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "status",
  handler,
});

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { requireAuth } from "../middleware/verifyToken.js";
import { createApiKey, getApiKeysByUser, deleteApiKey } from "../db/keys.js";
import { createHash, randomBytes } from "crypto";

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  let userId: number | undefined;
  try {
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const method = request.method;

    if (method === "GET") {
      const keys = await getApiKeysByUser(auth.userId);
      return {
        status: 200,
        jsonBody: {
          success: true,
          data: keys
        }
      };
    } 
    
    if (method === "POST") {
      // Generate a cryptographically secure random API key
      const randomHex = randomBytes(16).toString("hex");
      const rawKey = `geoumkm_live_${randomHex}`;
      
      // Hash the key using SHA-256 for secure storage
      const keyHash = createHash("sha256").update(rawKey).digest("hex");
      
      // Inherit user's role for the API key
      const apiKey = await createApiKey(auth.userId, keyHash, auth.role, 100);
      
      return {
        status: 201,
        jsonBody: {
          success: true,
          data: {
            ...apiKey,
            raw_key: rawKey // Raw key is only returned ONCE upon creation
          }
        }
      };
    } 
    
    if (method === "DELETE") {
      // Read key ID from query parameters or body
      let keyIdStr = request.query.get("id");
      
      if (!keyIdStr) {
        try {
          const body: any = await request.json();
          if (body && body.id) {
            keyIdStr = String(body.id);
          }
        } catch {
          // Ignore parsing error
        }
      }

      if (!keyIdStr) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: "Missing required parameter: id"
          }
        };
      }

      const keyId = parseInt(keyIdStr, 10);
      if (isNaN(keyId)) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: "Invalid parameter format: id must be a number"
          }
        };
      }

      const deleted = await deleteApiKey(keyId, auth.userId);
      if (!deleted) {
        return {
          status: 404,
          jsonBody: {
            success: false,
            error: "API key not found or not owned by user"
          }
        };
      }

      return {
        status: 200,
        jsonBody: {
          success: true,
          message: "API key revoked successfully"
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
    context.error("Error in developerKeys handler:", error);

    return {
      status: statusCode,
      jsonBody: {
        success: false,
        error: isAuthError ? error.message : "Internal server error"
      }
    };
  }
}

app.http("developerKeys", {
  methods: ["GET", "POST", "DELETE"],
  authLevel: "anonymous",
  route: "developer/keys",
  handler,
});

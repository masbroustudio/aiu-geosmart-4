import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getKnowledgeBase } from "../data/loader.js";
import { ChatMessage, ChatResponse, KnowledgeBaseEntry } from "../shared/types.js";
import { requireAuth } from "../middleware/verifyToken.js";
import { logAudit, extractRequestInfo } from "../services/audit.js";

function findBestMatch(message: string, examples: KnowledgeBaseEntry[]): KnowledgeBaseEntry | null {
  const messageLower = message.toLowerCase();
  const words = messageLower.split(/\s+/).filter((w) => w.length > 3);

  let bestMatch: KnowledgeBaseEntry | null = null;
  let bestScore = 0;

  for (const example of examples) {
    const queryLower = example.query.toLowerCase();
    let score = 0;

    // Check word overlap
    for (const word of words) {
      if (queryLower.includes(word)) {
        score += 1;
      }
    }

    // Check intent keywords
    const intentKeywords: Record<string, string[]> = {
      credit_assessment: ["kredit", "kur", "layak", "pinjaman"],
      portfolio_risk: ["default", "risiko", "npl", "portofolio"],
      risk_mapping: ["risiko", "area", "tinggi", "high risk"],
      portfolio_analysis: ["portofolio", "score band", "distribusi"],
      risk_factors: ["faktor", "kemampuan", "bayar", "pengaruh"],
      priority_identification: ["prioritas", "infrastruktur", "intervensi", "butuh"],
      budget_planning: ["anggaran", "budget", "digitalisasi", "biaya"],
      policy_impact: ["dampak", "kur", "ekspansi", "kebijakan"],
      cluster_prioritization: ["cluster", "prioritas", "pemberdayaan"],
      vulnerability_mapping: ["kerentanan", "distribusi", "vulnerable"],
      sector_opportunity: ["peluang", "investasi", "sektor", "makanan"],
      roi_analysis: ["roi", "return", "investasi", "tertinggi"],
      market_sizing: ["pasar", "potensi", "suburban", "market"],
      fintech_opportunity: ["fintech", "lending", "area", "digital"],
      risk_assessment: ["risiko", "investasi", "rural", "area"],
    };

    const keywords = intentKeywords[example.intent] || [];
    for (const keyword of keywords) {
      if (messageLower.includes(keyword)) {
        score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = example;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

async function handler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    // Require authentication
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const body = (await request.json()) as ChatMessage;
    const { message, persona } = body;

    if (!message) {
      await logAudit({
        userId,
        action: "chat_error",
        endpoint: requestInfo.endpoint,
        method: requestInfo.method,
        statusCode: 400,
        responseTimeMs: Date.now() - startTime,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
      });

      return {
        status: 400,
        jsonBody: { success: false, error: "Message is required" },
      };
    }

    const kb = getKnowledgeBase();

    // Select examples based on persona
    let examples: KnowledgeBaseEntry[];
    switch (persona?.toLowerCase()) {
      case "bank":
        examples = kb.bank_examples;
        break;
      case "government":
        examples = kb.government_examples;
        break;
      case "investor":
        examples = kb.investor_examples;
        break;
      default:
        // Search all personas
        examples = [
          ...kb.bank_examples,
          ...kb.government_examples,
          ...kb.investor_examples,
        ];
    }

    const match = findBestMatch(message, examples);

    let response: ChatResponse;
    if (match) {
      response = {
        response: match.expected_response,
        intent: match.intent,
        sources: match.retrieved_docs,
      };
    } else {
      response = {
        response:
          "Terima kasih atas pertanyaan Anda. Berdasarkan data yang tersedia dalam sistem GeoUMKM Intelligence, " +
          "saya dapat membantu dengan analisis lokasi UMKM, penilaian risiko kredit, profil cluster, " +
          "dan simulasi kebijakan. Silakan ajukan pertanyaan yang lebih spesifik tentang topik-topik tersebut.",
        intent: "general",
        sources: [],
      };
    }

    await logAudit({
      userId,
      action: "chat_message",
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      statusCode: 200,
      requestBody: JSON.stringify({ message, persona }),
      responseTimeMs: Date.now() - startTime,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: response,
      },
    };
  } catch (error) {
    const isAuthError = error instanceof Error && error.message === 'Unauthorized';
    const statusCode = isAuthError ? 401 : 500;
    
    context.error("Error in chat handler:", error);

    await logAudit({
      userId,
      action: isAuthError ? "chat_unauthorized" : "chat_error",
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

app.http("chat", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "chat",
  handler,
});


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

    const lowerMessage = message.toLowerCase();
    
    // Intercept menu/page queries
    if (lowerMessage.includes("halaman") || lowerMessage.includes("fitur") || lowerMessage.includes("menu") || lowerMessage.includes("dasbor") || lowerMessage.includes("dashboard")) {
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
          data: {
            response: "**Panduan Fitur & Halaman Dasbor GeoUMKM Smart v4.0:**\n\nPlatform ini menyediakan 8 modul utama di Dasbor yang dapat diakses melalui Sidebar:\n1. **Overview**: Menampilkan ringkasan metrik eksekutif, peta interaktif sebaran UMKM, status cluster, dan top kabupaten berdasarkan skor potensi.\n2. **Credit Scoring**: Menyajikan sebaran rating kredit (AAA hingga CCC), analisis Probability of Default (PD), dan faktor penjelas model SHAP (XGBoost).\n3. **Portfolio Analytics**: Memantau kinerja portofolio pembiayaan UMKM (Total disalurkan, Yield, NPL) beserta simulasi uji stres portofolio.\n4. **Location Intelligence**: Menyaring rekomendasi lokasi potensial berdasarkan jenis usaha dan menyajikan simulator kebijakan serta radar perbandingan antar wilayah.\n5. **Clustering**: Menganalisis pengelompokan UMKM ke dalam 5 profil segmentasi berdasarkan kematangan digital dan infrastruktur daerah.\n6. **Policy Simulation**: Menyimulasikan dampak alokasi anggaran daerah terhadap peningkatan skor potensi UMKM dan tingkat kelangsungan hidup.\n7. **Reports**: Mengunduh laporan PDF eksekutif komprehensif dan mengekspor dataset UMKM terklasifikasi dalam format CSV.\n8. **Settings**: Mengatur preferensi profil pengguna, tema gelap/terang, bahasa, alerting notifikasi, regenerasi API Keys developer, serta pembersihan data sesi database.",
            intent: "dashboard_features",
            sources: ["sidebar_navigation"]
          }
        }
      };
    }

    if (lowerMessage.includes("setting") || lowerMessage.includes("pengaturan")) {
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
          data: {
            response: "**Menu Settings (Pengaturan) v4.0:**\n\nHalaman Pengaturan mencakup:\n- **Profil Akun**: Menampilkan nama, email, dan peran otentikasi (viewer/administrator) Anda yang didekode langsung dari token JWT. Anda juga dapat memperbarui nama atau password.\n- **Tampilan & Preferensi**: Mengubah tema sistem (Gelap/Terang) secara real-time yang terhubung ke context, pilihan bahasa (Indonesia/Inggris), serta tombol sakelar notifikasi laporan mingguan dan log audit.\n- **Integrasi & API**: Menyediakan base URL endpoint REST API SWA dan API Key aktif yang dapat disalin atau dibuat ulang untuk integrasi eksternal.\n- **Sistem & Database**: Memberikan status database, wilayah cloud Azure East Asia, versi aplikasi, serta opsi pembersihan data sesi.",
            intent: "settings_feature",
            sources: ["settings_page"]
          }
        }
      };
    }

    if (lowerMessage.includes("report") || lowerMessage.includes("laporan")) {
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
          data: {
            response: "**Menu Reports (Laporan) v4.0:**\n\nHalaman Laporan memungkinkan Anda untuk:\n- **Download PDF Executive Summary**: Menghasilkan berkas laporan PDF berkualitas tinggi secara langsung dari browser menggunakan jsPDF, lengkap dengan ringkasan eksekutif, tabel cluster, dan analisis kredit.\n- **Export Data CSV**: Mengekspor data terkompresi dari dataset UMKM (termasuk koordinat, skor, dan kelompok cluster) ke berkas CSV.",
            intent: "reports_feature",
            sources: ["reports_page"]
          }
        }
      };
    }

    if (lowerMessage.includes("portofolio") || lowerMessage.includes("portfolio")) {
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
          data: {
            response: "**Menu Portfolio Analytics v4.0:**\n\nHalaman Portfolio memantau kesehatan pembiayaan:\n- **Metrik Utama**: Total dana disalurkan (Rp 187.5M), Yield Rata-rata (11.8%), NPL Ratio (4.2%), dan Akumulasi Penyisihan (Rp 8.2M).\n- **Analisis Stres Portofolio**: Menyediakan simulasi stress test (Skenario Ringan, Sedang, Berat) untuk melihat perkiraan lonjakan rasio NPL jika kondisi makroekonomi memburuk.",
            intent: "portfolio_feature",
            sources: ["portfolio_page"]
          }
        }
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
    
    // Check if Azure OpenAI or standard OpenAI is configured
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT || process.env.OPENAI_API_BASE;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";
    
    let response: ChatResponse;
    
    if (azureApiKey && azureEndpoint) {
      try {
        const systemPrompt = `You are the GeoUMKM Smart v4.0 AI Assistant, a powerful fullstack, AI & Cloud Azure expert.
You help answer queries about the dashboard, credit scoring, portfolio analytics, clustering, and settings of the GeoUMKM Smart v4.0 application.

Here is the context of GeoUMKM Smart v4.0 features and menus:
- Overview: Executive metrics summary, interactive mapping, cluster status, top kabupaten.
- Credit Scoring: AAA to CCC rating bands, probability of default (PD), XGBoost models, explainable AI SHAP force plots. Includes an interactive Credit Scoring Calculator.
- Portfolio Analytics: total disalurkan (Rp 187.5M), Yield (11.8%), NPL (4.2%), expected loss. Features a dynamic macroeconomic stress-testing slider.
- Location Intelligence: potential location matching based on sectors, policy simulation radar.
- Clustering: 5 segmentations of UMKM based on digital maturity & infrastructure.
- Policy Simulation: dynamic budget simulations.
- Reports: jsPDF executive summaries, CSV exports.
- Settings: Profile, JWT decoding, Light/Dark theme toggles, API key generation, database cleaning.

Persona mode: ${persona || "General User"}

Here is additional knowledge base context retrieved:
${match ? `Intent: ${match.intent}\nRetrieved Document Content: ${match.expected_response}\nSources: ${match.retrieved_docs.join(", ")}` : "No specific KB document matched."}

Guidelines:
1. Respond in Bahasa Indonesia (or match the user's language).
2. Answer concisely, professionally, and clearly using markdown formatting.
3. Be informative, citing specific metrics and pages where appropriate.
4. Keep the response friendly and expert.`;

        const requestUrl = azureEndpoint.includes("openai.azure.com")
          ? `${azureEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`
          : `${azureEndpoint}/chat/completions`;
          
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        
        if (azureEndpoint.includes("openai.azure.com")) {
          headers["api-key"] = azureApiKey;
        } else {
          headers["Authorization"] = `Bearer ${azureApiKey}`;
        }
        
        const openAiResponse = await fetch(requestUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 800
          })
        });
        
        if (!openAiResponse.ok) {
          throw new Error(`OpenAI HTTP Error: ${openAiResponse.status} - ${await openAiResponse.text()}`);
        }
        
        const resBody = (await openAiResponse.json()) as any;
        const generatedText = resBody.choices?.[0]?.message?.content || "";
        
        response = {
          response: generatedText,
          intent: match?.intent || "general_llm",
          sources: match?.retrieved_docs || ["llm_knowledge"]
        };
      } catch (err) {
        context.warn("Fallback to static QA due to Azure OpenAI error:", err);
        // Fallback to static
        response = match 
          ? { response: match.expected_response, intent: match.intent, sources: match.retrieved_docs }
          : {
              response: "Terima kasih atas pertanyaan Anda. Berdasarkan data yang tersedia dalam GeoUMKM Intelligence, saya dapat membantu dengan analisis lokasi UMKM, penilaian risiko kredit, profil cluster, dan simulasi kebijakan. Silakan ajukan pertanyaan yang lebih spesifik.",
              intent: "general",
              sources: []
            };
      }
    } else {
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


import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getKnowledgeBase, getGovPriorityKecamatan } from "../data/loader.js";
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

// Agentic AI Tools Definition
const agentTools = [
  {
    type: "function",
    function: {
      name: "calculate_credit_score",
      description: "Calculate credit risk score, rating, and Probability of Default (PD) for a specific UMKM using XGBoost ML.",
      parameters: {
        type: "object",
        properties: {
          umkm_name: { type: "string", description: "Name of the UMKM" },
          sector: { type: "string", description: "Business sector" },
          omset_bulanan: { type: "number", description: "Monthly revenue in IDR" },
          jumlah_karyawan: { type: "number", description: "Number of employees" },
          has_digital_presence: { type: "boolean", description: "Whether the UMKM has digital presence" },
          tahun_berdiri: { type: "number", description: "The year established" }
        },
        required: ["umkm_name", "sector", "omset_bulanan", "jumlah_karyawan", "has_digital_presence", "tahun_berdiri"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_portfolio_summary",
      description: "Get bank portfolio summary metrics including total exposure, average PD, NPL, and Expected Loss.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_location_recommendations",
      description: "Get top recommended location (kecamatan) for business expansion or investment based on sector.",
      parameters: {
        type: "object",
        properties: {
          sector: { type: "string", description: "The business sector" },
          kabupaten: { type: "string", description: "Optional specific regency filter" }
        },
        required: ["sector"]
      }
    }
  }
];

async function executeTool(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case "calculate_credit_score": {
        const { scoreCreditRisk } = await import("../services/ml.js");
        const res = scoreCreditRisk({
          umkm_name: args.umkm_name,
          sector: args.sector,
          omset_bulanan: args.omset_bulanan,
          jumlah_karyawan: args.jumlah_karyawan,
          has_digital_presence: args.has_digital_presence,
          tahun_berdiri: args.tahun_berdiri,
          skor_infrastruktur: 75,
          skor_potensi: 70
        });
        return JSON.stringify({
          success: true,
          score: res.credit_score,
          rating: res.rating,
          probability_of_default: `${res.predicted_pd}%`,
          risk_level: res.risk_level,
          explanation: res.explanation
        });
      }
      case "get_portfolio_summary": {
        return JSON.stringify({
          success: true,
          total_umkm: 10000,
          total_exposure: "Rp 585 Miliar",
          weighted_average_pd: "43.2%",
          npl_ratio: "4.2%",
          expected_loss: "Rp 175.5 Miliar",
          yield: "11.8%"
        });
      }
      case "get_location_recommendations": {
        const { getRecommendations } = await import("../data/loader.js");
        const list = getRecommendations();
        const matches = list
          .filter(r => r.jenis_usaha.toLowerCase().includes(args.sector.toLowerCase()) && 
                       (!args.kabupaten || r.kabupaten_kota.toLowerCase().includes(args.kabupaten.toLowerCase())))
          .slice(0, 3);
          
        return JSON.stringify({
          success: true,
          sector: args.sector,
          recommendations: matches.map(m => ({
            kecamatan: m.kecamatan,
            kabupaten: m.kabupaten_kota,
            recommendation_score: m.recommendation_score,
            survival_rate: `${(m.survival_rate * 100).toFixed(1)}%`,
            explanation: m.explanation
          }))
        });
      }
      default:
        return JSON.stringify({ error: `Tool ${name} not found.` });
    }
  } catch (err) {
    return JSON.stringify({ error: `Failed to execute tool ${name}: ${err}` });
  }
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

    const priorityKecList = getGovPriorityKecamatan();
    const matchedKec = priorityKecList.find(k => lowerMessage.includes(k.kecamatan.toLowerCase()));

    if (matchedKec) {
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
            response: `**Analisis Kewilayahan Kecamatan ${matchedKec.kecamatan} (${matchedKec.kabupaten}):**\n\nBerdasarkan data dasar GeoUMKM Smart v4.0:\n- **Peringkat Prioritas Pemerintah**: #${matchedKec.rank} dari seluruh wilayah prioritas di Jawa Barat.\n- **Rata-rata Skor Kelaikan/Potensi**: **${matchedKec.avg_skor}** (Skala 1-100).\n- **Faktor Pembatas Utama (Top Limiting Factor)**: \`${matchedKec.top_limiting_factor}\` (Ini merupakan hambatan terbesar bagi perkembangan UMKM di daerah ini).\n- **Rekomendasi Intervensi Kebijakan**: *${matchedKec.recommendation}*\n\n*Saran Tindakan:* Gunakan halaman **Location Intelligence** atau **Policy Simulation** untuk merancang alokasi anggaran intervensi guna mengatasi faktor pembatas \`${matchedKec.top_limiting_factor}\` dan meningkatkan skor potensi wilayah ini secara signifikan.`,
            intent: "kecamatan_detail",
            sources: ["government_priority_kecamatan"]
          }
        }
      };
    }

    if (lowerMessage.includes("kecamatan") || lowerMessage.includes("data dasar") || lowerMessage.includes("wilayah") || lowerMessage.includes("daerah")) {
      const topKec = priorityKecList.slice(0, 5).map(k => `- **Kec. ${k.kecamatan}** (${k.kabupaten}): Skor ${k.avg_skor}, Faktor Pembatas: \`${k.top_limiting_factor}\``).join("\n");
      
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
            response: `**Data Dasar Kecamatan & Analisis Kewilayahan GeoUMKM Smart:**\n\nSistem memantau data dasar kewilayahan di seluruh Jawa Barat dengan mengukur aspek infrastruktur, akses digital, kepadatan kompetitor, dan akses layanan keuangan.\n\nBerikut adalah **Top 5 Kecamatan Prioritas Tinggi** berdasarkan skor potensi terendah yang membutuhkan intervensi mendesak:\n${topKec}\n\n*Anda dapat menanyakan analisis spesifik untuk salah satu kecamatan di atas (misal: "Bagaimana profil Kecamatan Sagaranten?") untuk melihat detail faktor pembatas dan rekomendasi intervensinya.*`,
            intent: "kecamatan_summary",
            sources: ["government_priority_kecamatan"]
          }
        }
      };
    }

    if (lowerMessage.includes("geo umkm smart") || lowerMessage.includes("aplikasi ini") || lowerMessage.includes("tentang") || lowerMessage.includes("tujuan") || lowerMessage.includes("notebook") || lowerMessage.includes("analisis spasial")) {
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
            response: `**Tentang Aplikasi GeoUMKM Smart v4.0 (Berdasarkan Notebook & Analisis Spasial):**\n\nGeoUMKM Smart adalah platform berbasis AI & Sistem Informasi Geografis (GIS) untuk memetakan potensi bisnis, menilai kelaikan kredit UMKM, dan menyimulasikan kebijakan ekonomi daerah di Jawa Barat.\n\n**Metodologi & Temuan Kunci ML (seperti di Notebook):**\n1. **K-Means & DBSCAN Clustering**: Membagi 10.000 data UMKM menjadi 5 kluster utama. Kluster risiko tinggi (**High-Risk Underserved**) tersebar di Sukabumi selatan dan Garut selatan dengan skor infrastruktur rendah. Kluster mapan (**Urban Digital Leaders**) terkonsentrasi di wilayah Jabodetabek/Bandung Raya.\n2. **XGBoost Credit Scoring**: Model memprediksi tingkat gagal bayar (Probability of Default - PD) berdasarkan 11 fitur spasial dan bisnis. Fitur dominan (SHAP) adalah **business maturity** (umur usaha) dan **digital presence**.\n3. **Policy Simulation**: Menghubungkan alokasi anggaran infrastruktur jalan, perluasan jaringan internet, dan pendirian ATM/Bank terdekat untuk menurunkan default rate portofolio secara terukur.\n\n*Silakan tanyakan hal khusus seperti: "Bagaimana kluster Urban Digital Leaders?" atau "Apa saja fitur utama dalam XGBoost Credit Scoring?"*`,
            intent: "about_app",
            sources: ["notebooks_insights", "ml_clustering_report"]
          }
        }
      };
    }

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
            response: "**Menu Portfolio Analytics v4.0:**\n\nHalaman Portfolio memantau kesehatan pembiayaan:\n- **Metrik Utama**: Total eksposur kredit (Rp 585 Miliar), Yield Rata-rata (11.8%), NPL Ratio (4.2%), dan Expected Loss (Rp 175.5 Miliar).\n- **Analisis Stres Portofolio**: Menyediakan simulasi stress test (Skenario Ringan, Sedang, Berat) untuk melihat perkiraan lonjakan rasio NPL jika kondisi makroekonomi memburuk.",
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
You are an AGENTIC assistant who has access to backend tools to query live statistics, recommend locations, and calculate credit risk scores.

Here is the context of GeoUMKM Smart v4.0 features and menus:
- Overview: Executive metrics summary, interactive mapping, cluster status, top kabupaten.
- Credit Scoring: AAA to CCC rating bands, probability of default (PD), XGBoost models, explainable AI SHAP force plots. Includes an interactive Credit Scoring Calculator.
- Portfolio Analytics: Total eksposur kredit (Rp 585 Miliar), Yield Rata-rata (11.8%), NPL Ratio (4.2%), Expected Loss (Rp 175.5 Miliar). Features a dynamic macroeconomic stress-testing slider.
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
3. If the user asks you to calculate a credit score, check the portfolio summary, or recommend locations, DO NOT hallucinate. You MUST call the corresponding tool.
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
 
        const messages: any[] = [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ];

        // First OpenAI Call (can invoke tools)
        let openAiResponse = await fetch(requestUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages,
            tools: agentTools,
            tool_choice: "auto",
            temperature: 0.7,
            max_tokens: 800
          })
        });
        
        if (!openAiResponse.ok) {
          throw new Error(`OpenAI HTTP Error: ${openAiResponse.status} - ${await openAiResponse.text()}`);
        }
        
        let resBody = (await openAiResponse.json()) as any;
        let choice = resBody.choices?.[0];
        let assistantMessage = choice?.message;
        
        // Check for Tool Calls
        if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
          context.log(`Agentic AI triggered ${assistantMessage.tool_calls.length} tool calls`);
          messages.push(assistantMessage); // push assistant message containing tool_calls
          
          for (const toolCall of assistantMessage.tool_calls) {
            const funcName = toolCall.function.name;
            const funcArgs = JSON.parse(toolCall.function.arguments);
            context.log(`Executing tool ${funcName} with args:`, funcArgs);
            
            const toolResult = await executeTool(funcName, funcArgs);
            
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: funcName,
              content: toolResult
            });
          }
          
          // Second OpenAI Call (sends tool results back to LLM to generate final response)
          openAiResponse = await fetch(requestUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({
              messages,
              temperature: 0.7,
              max_tokens: 800
            })
          });
          
          if (!openAiResponse.ok) {
            throw new Error(`OpenAI Second-stage HTTP Error: ${openAiResponse.status} - ${await openAiResponse.text()}`);
          }
          
          resBody = (await openAiResponse.json()) as any;
          choice = resBody.choices?.[0];
          assistantMessage = choice?.message;
        }
        
        const generatedText = assistantMessage?.content || "";
        
        response = {
          response: generatedText,
          intent: match?.intent || "agentic_llm_response",
          sources: match?.retrieved_docs || ["agentic_tools"]
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
    const isAuthError = error instanceof Error && error.message.startsWith('Unauthorized');
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


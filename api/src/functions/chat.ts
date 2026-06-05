import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { 
  getKnowledgeBase, 
  getGovPriorityKecamatan,
  getClusterSummaries,
  getModelInsights,
  getLocationProfiles,
  getExecutiveSummary
} from "../data/loader.js";
import { ChatMessage, ChatResponse, KnowledgeBaseEntry } from "../shared/types.js";
import { requireAuth } from "../middleware/verifyToken.js";
import { logAudit, extractRequestInfo } from "../services/audit.js";

function normalizeSector(sector: string): string {
  const s = sector.toLowerCase();
  if (s.includes("textile") || s.includes("tekstil") || s.includes("baju") || s.includes("pakaian") || s.includes("fashion") || s.includes("kain") || s.includes("butik") || s.includes("garment") || s.includes("konveksi") || s.includes("busana")) {
    return "Fashion";
  }
  if (s.includes("makanan") || s.includes("kuliner") || s.includes("minuman") || s.includes("resto") || s.includes("kafe") || s.includes("kopi") || s.includes("warung") || s.includes("bakso") || s.includes("makan") || s.includes("dapur")) {
    return "Makanan";
  }
  if (s.includes("kerajinan") || s.includes("kriya") || s.includes("anyaman") || s.includes("kayu") || s.includes("souvenir") || s.includes("art")) {
    return "Kerajinan";
  }
  if (s.includes("jasa") || s.includes("laundry") || s.includes("salon") || s.includes("bengkel") || s.includes("service") || s.includes("kurir") || s.includes("logistik") || s.includes("transport")) {
    return "Jasa";
  }
  if (s.includes("pertanian") || s.includes("tani") || s.includes("sawah") || s.includes("kebun") || s.includes("ternak") || s.includes("ikan") || s.includes("padi") || s.includes("sayur")) {
    return "Pertanian";
  }
  return sector;
}

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
        const normSector = normalizeSector(args.sector);
        const matches = list
          .filter(r => r.jenis_usaha.toLowerCase().includes(normSector.toLowerCase()) && 
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

    if (lowerMessage.includes("data dasar kecamatan") || lowerMessage.includes("prioritas wilayah") || lowerMessage.includes("rangkuman kecamatan") || lowerMessage.includes("daftar kecamatan prioritas")) {
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

    if (lowerMessage.includes("tentang aplikasi") || lowerMessage.includes("tujuan aplikasi") || lowerMessage.includes("notebook analisis") || (lowerMessage.includes("tentang") && (lowerMessage.includes("geoumkm") || lowerMessage.includes("geo umkm")))) {
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
    if (lowerMessage.includes("daftar halaman") || lowerMessage.includes("daftar menu") || lowerMessage.includes("panduan dasbor") || lowerMessage.includes("panduan dashboard")) {
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

    if (lowerMessage.includes("halaman pengaturan") || lowerMessage.includes("menu setting") || lowerMessage.includes("halaman setting")) {
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

    if (lowerMessage.includes("halaman laporan") || lowerMessage.includes("menu report") || lowerMessage.includes("halaman report")) {
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

    if (lowerMessage.includes("ringkasan portofolio") || lowerMessage.includes("kinerja portofolio") || lowerMessage.includes("halaman portfolio")) {
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
      // Smart Fallback Parser
      let fallbackText: string | null = null;
      let usedSources: string[] = ["fallback_heuristics"];

      // 1. Search for specific Kecamatan profile
      const locProfiles = getLocationProfiles();
      const matchedProfile = locProfiles.find(p => 
        lowerMessage.includes(p.name.toLowerCase())
      );

      if (matchedProfile) {
        const stats = matchedProfile.umkm_statistics || {};
        const infra = matchedProfile.infrastructure || {};
        const risk = matchedProfile.risk_levels || {};
        const demo = matchedProfile.demographics || {};
        const cl = matchedProfile.cluster || {};
        
        // Find priority info if exists
        const priorityInfo = priorityKecList.find(k => k.kecamatan.toLowerCase() === matchedProfile.name.toLowerCase());
        
        fallbackText = `**Profil Spasial & Risiko Kredit Kecamatan ${matchedProfile.name} (${matchedProfile.kabupaten}):**\n\n` +
          `Berdasarkan data dasar GeoUMKM Smart v4.0:\n` +
          `- **Segmen Klaster**: \`${cl.cluster_name || "N/A"}\`\n` +
          `- **Total Pelaku UMKM**: **${stats.n_umkm || 0}** UMKM\n` +
          `- **Rata-rata Omset Bulanan**: **Rp ${(stats.avg_omset_juta || 0).toFixed(2)} Juta**\n` +
          `- **Rasio Akses Internet**: **${(infra.akses_internet_pct || 0).toFixed(1)}%**\n` +
          `- **Penetrasi KUR**: **${(infra.penetrasi_kur_pct || 0).toFixed(1)}%**\n` +
          `- **Jarak ke Bank Terdekat**: **${(infra.jarak_ke_bank_terdekat || 0).toFixed(2)} km**\n` +
          `- **Peringkat Kelayakan Spasial**: Rata-rata Skor Potensi **${(stats.avg_skor_potensi || 0).toFixed(1)}** (Skala 1-100)\n` +
          `- **Masa Kelangsungan Hidup 3 Tahun (Survival Rate)**: **${((stats.survival_rate || 0) * 100).toFixed(1)}%**\n` +
          `- **Demografi**: Populasi **${(demo.populasi || 0).toLocaleString()}** jiwa, Kepadatan **${(demo.kepadatan_penduduk || 0).toFixed(1)} / km²**\n` +
          `- **Tingkat Risiko Bencana**: Gempa (Skor ${(risk.risiko_gempa || 0).toFixed(2)}), Banjir (Skor ${(risk.risiko_banjir || 0).toFixed(2)})\n`;
          
        if (priorityInfo) {
          fallbackText += `- **Peringkat Prioritas Pemerintah**: #${priorityInfo.rank}\n` +
            `- **Faktor Pembatas Utama (Top Limiting Factor)**: \`${priorityInfo.top_limiting_factor}\`\n` +
            `- **Rekomendasi Intervensi**: *${priorityInfo.recommendation}*\n`;
        }

        if (matchedProfile.recommended_business_types && matchedProfile.recommended_business_types.length > 0) {
          fallbackText += `\n**Rekomendasi Sektor Usaha Potensial**: ${matchedProfile.recommended_business_types.join(", ")}\n`;
        }
        
        fallbackText += `\n*Tips:* Gunakan halaman **Location Intelligence** atau **Policy Simulation** untuk merancang alokasi anggaran intervensi guna meningkatkan skor potensi wilayah ini secara signifikan.`;
        usedSources = ["location_profiles.json", "government_priority_kecamatan.csv"];
      }

      // 2. Search for Cluster/Klaster profile
      if (!fallbackText && (lowerMessage.includes("cluster") || lowerMessage.includes("klaster"))) {
        const clusterSum = getClusterSummaries();
        let matchedCluster = clusterSum.find(c => 
          lowerMessage.includes(c.cluster_name.toLowerCase()) ||
          (c.cluster_name.includes("Urban") && lowerMessage.includes("urban")) ||
          (c.cluster_name.includes("Rural") && lowerMessage.includes("rural")) ||
          (c.cluster_name.includes("High-Risk") && (lowerMessage.includes("high-risk") || lowerMessage.includes("high risk")))
        );
        
        if (matchedCluster) {
          const char = matchedCluster.key_characteristics || {};
          const swot = matchedCluster.swot || {};
          
          fallbackText = `**Analisis Profil Segmen Klaster: ${matchedCluster.cluster_name}**\n\n` +
            `**Deskripsi**: ${matchedCluster.description}\n\n` +
            `**Karakteristik Kunci (Rata-rata)**:\n` +
            `- Jumlah UMKM dalam Klaster: **${matchedCluster.n_umkm.toLocaleString()}**\n` +
            `- Skor Infrastruktur Wilayah: **${char.avg_infrastructure_score || 0}** / 100\n` +
            `- Rata-rata Omset Bulanan: **Rp ${char.avg_omset_bulanan_juta || 0} Juta**\n` +
            `- Adopsi Layanan Digital: **${((char.digital_adoption_rate || 0) * 100).toFixed(1)}%**\n` +
            `- Penetrasi Kredit (KUR): **${char.kur_penetration_pct || 0}%**\n` +
            `- Tingkat Kelangsungan Hidup 3 Tahun (Survival Rate): **${((char.survival_rate_3yr || 0) * 100).toFixed(1)}%**\n` +
            `- Nilai Pendapatan per Kapita Area: **Rp ${char.avg_income_per_kapita || 0} Juta**\n\n` +
            `**SWOT Analysis**:\n` +
            `- *Kekuatan (Strengths)*: ${swot.strengths?.join(", ") || "-"}\n` +
            `- *Kelemahan (Weaknesses)*: ${swot.weaknesses?.join(", ") || "-"}\n` +
            `- *Peluang (Opportunities)*: ${swot.opportunities?.join(", ") || "-"}\n` +
            `- *Ancaman (Threats)*: ${swot.threats?.join(", ") || "-"}\n\n` +
            `**Rekomendasi Tindakan Pemerintah/Bank**:\n` +
            `${matchedCluster.recommended_actions?.map((a: string) => `- ${a}`).join("\n") || "-"}\n\n` +
            `*Peringkat Prioritas Intervensi Pemerintah*: #${matchedCluster.government_priority_rank || "N/A"} (Peringkat Investasi Swasta: #${matchedCluster.investment_rank || "N/A"})`;
        } else {
          const clusterLines = clusterSum.map(c => 
            `- **${c.cluster_name}** (${c.n_umkm.toLocaleString()} UMKM): ${c.description}\n` +
            `  * Rata-rata Omset: Rp ${c.key_characteristics?.avg_omset_bulanan_juta || 0} Jt/bln, Digitalisasi: ${((c.key_characteristics?.digital_adoption_rate || 0) * 100).toFixed(0)}%, Prioritas Pemda: #${c.government_priority_rank || "N/A"}`
          ).join("\n\n");
          
          fallbackText = `**Segmentasi Klaster UMKM GeoUMKM Smart v4.0 (5 Klaster Terbentuk):**\n\n` +
            `Berdasarkan algoritma K-Means & DBSCAN, pelaku UMKM di Jawa Barat dikelompokkan menjadi:\n\n` +
            `${clusterLines}\n\n` +
            `*Anda dapat menanyakan profil lengkap untuk salah satu klaster di atas (misal: "Bagaimana profil klaster Rural Developing?") untuk melihat analisis SWOT dan rekomendasi tindakan lengkap.*`;
        }
        usedSources = ["cluster_summaries.json"];
      }

      // 3. Search for Model Insights / SHAP / Features importance
      if (!fallbackText && (
        lowerMessage.includes("model") || 
        lowerMessage.includes("xgboost") || 
        lowerMessage.includes("lgbm") || 
        lowerMessage.includes("lightgbm") || 
        lowerMessage.includes("fitur") || 
        lowerMessage.includes("shap") || 
        lowerMessage.includes("feature importance")
      )) {
        const insights = getModelInsights();
        const locModel = insights.location_scoring_model || {};
        const creditModel = insights.credit_risk_model || {};
        
        fallbackText = `**Detail Teknis & Penjelasan Model Machine Learning GeoUMKM Smart:**\n\n` +
          `Sistem menggunakan dua model ML utama untuk analisis kelaikan kredit dan lokasi:\n\n` +
          `### 1. Model Skor Potensi Lokasi (${locModel.model_type || "XGBRegressor"})\n` +
          `*Deskripsi*: ${locModel.description}\n` +
          `*Fitur Paling Berpengaruh (Feature Importance)*:\n` +
          `${locModel.top_features?.slice(0, 5).map((f: any) => `- **${f.feature}** (Importance: ${(f.importance * 100).toFixed(1)}%)`).join("\n") || "-"}\n` +
          `*Temuan Kunci*:\n` +
          `${locModel.key_findings?.map((k: string) => `- ${k}`).join("\n") || "-"}\n\n` +
          `### 2. Model Risiko Kredit & Kelangsungan Hidup (${creditModel.model_type || "LGBMClassifier"})\n` +
          `*Deskripsi*: ${creditModel.description}\n` +
          `*Fitur Paling Berpengaruh (SHAP/Feature Importance)*:\n` +
          `${creditModel.top_features?.slice(0, 5).map((f: any) => `- **${f.feature}** (Importance score: ${f.importance})`).join("\n") || "-"}\n` +
          `*Temuan Kunci*:\n` +
          `${creditModel.key_findings?.map((k: string) => `- ${k}`).join("\n") || "-"}\n\n` +
          `*Informasi:* Anda dapat mengeksplorasi grafik kontribusi SHAP dan parameter kustom model langsung pada halaman **Credit Scoring** (untuk kelaikan kredit) dan **Location Intelligence** (untuk kelayakan lokasi).`;
        usedSources = ["model_insights.json"];
      }

      // 4. Policy Simulation / What-If details
      if (!fallbackText && (
        lowerMessage.includes("kebijakan") || 
        lowerMessage.includes("simulasi") || 
        lowerMessage.includes("anggaran") || 
        lowerMessage.includes("what-if") || 
        lowerMessage.includes("what if") || 
        lowerMessage.includes("intervensi")
      )) {
        const insights = getModelInsights();
        const simRes = insights.policy_simulation_results || {};
        
        const policyLines = simRes.policies_tested?.map((p: any) => 
          `- **${p.policy}** (Target: ${p.target_group})\n` +
          `  * Kenaikan Skor Rata-rata: **+${p.avg_score_improvement}**\n` +
          `  * Peningkatan Kelangsungan Hidup: **+${p.additional_survivors} UMKM**`
        ).join("\n") || "-";
        
        fallbackText = `**Hasil Simulasi Intervensi Kebijakan Daerah (What-If Simulation):**\n\n` +
          `Berdasarkan pemodelan dampak alokasi anggaran daerah di Jawa Barat:\n\n` +
          `${policyLines}\n\n` +
          `**Temuan Kunci Analisis Dampak**:\n` +
          `${simRes.key_findings?.map((k: string) => `- ${k}`).join("\n") || "-"}\n\n` +
          `*Saran:* Anda dapat menyimulasikan alokasi anggaran infrastruktur dan digital secara interaktif dengan menggeser slider pada menu **Policy Simulation** di sidebar.`;
        usedSources = ["model_insights.json"];
      }

      // 5. General Summary Statistics / Executive metrics
      if (!fallbackText && (
        lowerMessage.includes("ringkasan") || 
        lowerMessage.includes("statistik") || 
        lowerMessage.includes("jumlah umkm") || 
        lowerMessage.includes("data dasar") || 
        lowerMessage.includes("dasar data") || 
        lowerMessage.includes("metrik") || 
        lowerMessage.includes("kpi")
      )) {
        const exec = getExecutiveSummary();
        const dataSum = exec.data_summary || {};
        const perf = exec.model_performance || {};
        
        fallbackText = `**Ringkasan Metrik Eksekutif GeoUMKM Smart v4.0:**\n\n` +
          `- **Total UMKM Terdata**: **${(dataSum.total_umkm || 10000).toLocaleString()}** UMKM\n` +
          `- **Cakupan Wilayah**: **${dataSum.kecamatan_count || 595}** Kecamatan di **${dataSum.kabupaten_kota_count || 27}** Kabupaten/Kota\n` +
          `- **Tingkat Kelangsungan Hidup Rata-rata**: **${dataSum.survival_rate_pct || 67.2}%**\n` +
          `- **Rata-rata Skor Kelaikan Lokasi**: **${exec.key_metrics?.avg_location_score || 70.2} / 100**\n` +
          `- **Kesenjangan Perkotaan-Pedesaan (Urban-Rural Gap)**: **${exec.key_metrics?.urban_rural_gap || 17.4} poin**\n` +
          `- **Digital Premium (Kenaikan Skor dengan Digital Presence)**: **+${exec.key_metrics?.digital_premium || 12.8} poin**\n` +
          `- **Total Potensi Pasar Bulanan (Market Size)**: **Rp ${(exec.key_metrics?.total_market_size_miliar_annual || 58.5).toFixed(1)} Miliar / tahun**\n\n` +
          `**Kinerja Model Machine Learning**:\n` +
          `- *Location Scoring (${perf.location_scoring?.algorithm || "XGBRegressor"})*: R² Score **${perf.location_scoring?.r2 || 0.82}**\n` +
          `- *Credit Scoring (${perf.credit_risk?.algorithm || "LGBMClassifier"})*: AUC-ROC **${perf.credit_risk?.auc_roc_approx || 0.88}**\n` +
          `- *Clustering (${perf.clustering?.algorithm || "K-Means / DBSCAN"})*: Silhouette Score **${perf.clustering?.silhouette_score || 0.72}**\n\n` +
          `*Catatan:* Semua metrik di atas dihitung berdasarkan integrasi data spasial rill dan diperbarui secara berkala pada menu **Overview**.`;
        usedSources = ["executive_summary.json"];
      }

      // 6. Original Sector Recommendations fallback
      if (!fallbackText && (lowerMessage.includes("lokasi") || lowerMessage.includes("tempat") || lowerMessage.includes("kecamatan") || lowerMessage.includes("wilayah") || lowerMessage.includes("daerah") || lowerMessage.includes("usaha") || lowerMessage.includes("bisnis") || lowerMessage.includes("investasi"))) {
        let detectedSector = "";
        if (lowerMessage.includes("textile") || lowerMessage.includes("tekstil") || lowerMessage.includes("baju") || lowerMessage.includes("pakaian") || lowerMessage.includes("fashion") || lowerMessage.includes("kain") || lowerMessage.includes("butik") || lowerMessage.includes("garment") || lowerMessage.includes("konveksi")) {
          detectedSector = "Fashion";
        } else if (lowerMessage.includes("makanan") || lowerMessage.includes("kuliner") || lowerMessage.includes("minuman") || lowerMessage.includes("kopi") || lowerMessage.includes("resto") || lowerMessage.includes("kafe") || lowerMessage.includes("makan")) {
          detectedSector = "Makanan";
        } else if (lowerMessage.includes("kerajinan") || lowerMessage.includes("kriya") || lowerMessage.includes("anyaman") || lowerMessage.includes("souvenir")) {
          detectedSector = "Kerajinan";
        } else if (lowerMessage.includes("jasa") || lowerMessage.includes("laundry") || lowerMessage.includes("salon") || lowerMessage.includes("bengkel") || lowerMessage.includes("logistik")) {
          detectedSector = "Jasa";
        } else if (lowerMessage.includes("pertanian") || lowerMessage.includes("tani") || lowerMessage.includes("sawah") || lowerMessage.includes("kebun") || lowerMessage.includes("ternak")) {
          detectedSector = "Pertanian";
        }

        if (detectedSector) {
          const { getRecommendations } = await import("../data/loader.js");
          const list = getRecommendations();
          const matches = list
            .filter(r => r.jenis_usaha.toLowerCase() === detectedSector.toLowerCase())
            .slice(0, 3);
            
          if (matches.length > 0) {
            const recText = matches.map((m, idx) => 
              `${idx + 1}. **Kec. ${m.kecamatan}** (${m.kabupaten_kota}) - Skor Kelaikan Spasial: **${m.recommendation_score.toFixed(2)}**\n` +
              `   * Masa Hidup UMKM (Survival Rate): ${(m.survival_rate * 100).toFixed(1)}%\n` +
              `   * Penjelasan Spasial: ${m.explanation}`
            ).join("\n\n");
            
            fallbackText = `**Rekomendasi Lokasi Terbaik untuk Usaha ${detectedSector} di Jawa Barat:**\n\n` +
              `Berdasarkan analisis geospasial real-time GeoUMKM, berikut adalah top 3 wilayah paling direkomendasikan untuk membuka usaha **${detectedSector}** (seperti pakaian/tekstil):\n\n` +
              `${recText}\n\n` +
              `*Tips:* Anda dapat meninjau peta interaktif sebaran spasial dan menyimulasikan parameter MCDA kustom Anda pada menu **Location Intelligence** di sidebar.`;
            usedSources = ["recommendations_by_kecamatan.csv"];
          }
        }
      }

      if (fallbackText) {
        response = {
          response: fallbackText,
          intent: "smart_fallback_response",
          sources: usedSources
        };
      } else if (match) {
        response = {
          response: match.expected_response,
          intent: match.intent,
          sources: match.retrieved_docs,
        };
      } else {
        response = {
          response:
            "Halo! Saya adalah Asisten GeoUMKM Intelligence. Saya dapat membantu Anda menganalisis " +
            "lokasi potensial untuk usaha (misalnya: 'lokasi usaha textile'), menilai risiko kredit UMKM, " +
            "menganalisis kesehatan portofolio keuangan, profil klaster, serta simulasi kebijakan. Silakan tanyakan secara spesifik tentang kebutuhan analisis Anda.",
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


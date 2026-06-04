import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { requireAuth } from "../../middleware/verifyToken.js";
import { scoreCreditRisk } from "../../services/ml.js";
import { logAudit, extractRequestInfo } from "../../services/audit.js";
import { createBatchJob, getBatchJob, updateBatchJobProgress, completeBatchJob } from "../../db/jobs.js";
import Papa from "papaparse";

// Background worker processing simulation
async function processBatchJobInBackground(
  jobId: number,
  csvText: string,
  userId: number | undefined
) {
  try {
    // 1. Mark as processing
    await updateBatchJobProgress(jobId, 0, "processing");

    // 2. Parse CSV
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      await completeBatchJob(
        jobId,
        "failed",
        undefined,
        undefined,
        `Gagal memproses CSV: ${parsed.errors[0].message}`
      );
      return;
    }

    const headers = Object.keys(parsed.data[0] || {});
    const nameKey = headers.find(h => h.toLowerCase().includes('nama') || h.toLowerCase().includes('name') || h.toLowerCase().includes('umkm')) || headers[0];
    const omsetKey = headers.find(h => h.toLowerCase().includes('omset') || h.toLowerCase().includes('revenue'));
    const karyawanKey = headers.find(h => h.toLowerCase().includes('karyawan') || h.toLowerCase().includes('employee'));
    const digitalKey = headers.find(h => h.toLowerCase().includes('digital') || h.toLowerCase().includes('online'));
    const tahunKey = headers.find(h => h.toLowerCase().includes('tahun') || h.toLowerCase().includes('year') || h.toLowerCase().includes('berdiri'));

    const scoredRows: any[] = [];
    let totalScore = 0;
    let lowRiskCount = 0;
    let highRiskCount = 0;

    const dataLength = parsed.data.length;

    // Process in chunks to simulate a real queue and avoid event-loop blocking
    const chunkSize = 200;
    for (let startIdx = 0; startIdx < dataLength; startIdx += chunkSize) {
      const endIdx = Math.min(startIdx + chunkSize, dataLength);

      for (let i = startIdx; i < endIdx; i++) {
        const row: any = parsed.data[i];
        const umkmName = nameKey ? row[nameKey] : `UMKM #${i + 1}`;
        const omset = omsetKey ? parseInt(row[omsetKey], 10) || 3000000 : 3000000;
        const karyawan = karyawanKey ? parseInt(row[karyawanKey], 10) || 3 : 3;
        
        const digitalRaw = digitalKey ? String(row[digitalKey]).toLowerCase().trim() : "false";
        const digital = digitalRaw === 'true' || digitalRaw === '1' || digitalRaw === 'ya' || digitalRaw === 'yes';
        
        const tahunBerdiri = tahunKey ? parseInt(row[tahunKey], 10) || 2022 : 2022;

        const scoreResult = scoreCreditRisk({
          umkm_name: umkmName,
          omset_bulanan: omset,
          jumlah_karyawan: karyawan,
          has_digital_presence: digital,
          tahun_berdiri: tahunBerdiri,
          skor_potensi: 65,
          skor_infrastruktur: 75
        });

        scoredRows.push({
          name: umkmName,
          omset,
          karyawan,
          digital: digital ? 'Ya' : 'Tidak',
          tahunBerdiri,
          score: scoreResult.credit_score,
          rating: scoreResult.rating,
          riskLevel: scoreResult.risk_level,
          pd: scoreResult.predicted_pd
        });

        totalScore += scoreResult.credit_score;
        if (scoreResult.risk_level === 'low') {
          lowRiskCount++;
        } else if (scoreResult.risk_level === 'high' || scoreResult.risk_level === 'very_high') {
          highRiskCount++;
        }
      }

      // Update progress
      await updateBatchJobProgress(jobId, endIdx, "processing");

      // Give event loop a breather and simulate cloud processing latency
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const stats = {
      total: scoredRows.length,
      avgScore: scoredRows.length > 0 ? Math.round(totalScore / scoredRows.length) : 0,
      lowRisk: lowRiskCount,
      highRisk: highRiskCount
    };

    // Save final completion
    await completeBatchJob(
      jobId,
      "completed",
      JSON.stringify(stats),
      JSON.stringify(scoredRows)
    );

  } catch (err: any) {
    console.error(`Error in batch job ${jobId} worker:`, err);
    await completeBatchJob(
      jobId,
      "failed",
      undefined,
      undefined,
      err.message || "Internal processing error"
    );
  }
}

// 1. Upload CSV handler (asynchronous, returns 202 immediately)
async function uploadHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const body: any = await request.json();
    const { filename, csv_text } = body;

    if (!csv_text || !filename) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: "Missing required parameters: csv_text and filename"
        }
      };
    }

    // 1. Quick parse to determine row count
    const parsed = Papa.parse(csv_text, {
      header: true,
      skipEmptyLines: true
    });
    const totalRows = parsed.data.length;

    // 2. Create batch job in database (status: pending)
    const job = await createBatchJob(userId, filename, totalRows);

    // 3. Trigger processing in the background asynchronously
    // Using setImmediate so Node completes current execution stack and starts processing immediately after returning response
    setImmediate(() => {
      processBatchJobInBackground(job.id, csv_text, userId);
    });

    await logAudit({
      userId,
      action: "reports_batch_upload",
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      statusCode: 202,
      responseTimeMs: Date.now() - startTime,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
    });

    return {
      status: 202,
      jsonBody: {
        success: true,
        data: {
          jobId: job.id,
          filename: job.filename,
          status: "pending",
          totalRows: job.total_rows,
          createdAt: job.created_at
        }
      }
    };

  } catch (error: any) {
    const isAuthError = error instanceof Error && error.message.startsWith("Unauthorized");
    const statusCode = isAuthError ? 401 : 500;
    context.error("Error in uploadHandler:", error);

    return {
      status: statusCode,
      jsonBody: {
        success: false,
        error: isAuthError ? error.message : "Internal server error"
      }
    };
  }
}

// 2. Status polling handler
async function statusHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request);
  let userId: number | undefined;

  try {
    const auth = await requireAuth(request, context);
    userId = auth.userId;

    const url = new URL(request.url);
    const jobIdStr = url.searchParams.get("jobId");

    if (!jobIdStr) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: "Missing required query parameter: jobId"
        }
      };
    }

    const jobId = parseInt(jobIdStr, 10);
    const job = await getBatchJob(jobId);

    if (!job) {
      return {
        status: 404,
        jsonBody: {
          success: false,
          error: `Job with ID ${jobId} not found`
        }
      };
    }

    // Verify owner
    if (job.user_id !== userId) {
      return {
        status: 403,
        jsonBody: {
          success: false,
          error: "Access denied"
        }
      };
    }

    const responseData: any = {
      jobId: job.id,
      status: job.status,
      totalRows: job.total_rows,
      processedRows: job.processed_rows,
      createdAt: job.created_at,
      updatedAt: job.updated_at
    };

    if (job.status === "completed") {
      responseData.stats = job.result_stats ? JSON.parse(job.result_stats) : null;
      responseData.scoredRows = job.result_rows ? JSON.parse(job.result_rows) : null;
    } else if (job.status === "failed") {
      responseData.error = job.error_message || "Unknown processing failure";
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: responseData
      }
    };

  } catch (error: any) {
    const isAuthError = error instanceof Error && error.message.startsWith("Unauthorized");
    const statusCode = isAuthError ? 401 : 500;
    context.error("Error in statusHandler:", error);

    return {
      status: statusCode,
      jsonBody: {
        success: false,
        error: isAuthError ? error.message : "Internal server error"
      }
    };
  }
}

app.http("batchScoreUpload", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "reports/batch-score/upload",
  handler: uploadHandler,
});

app.http("batchScoreStatus", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "reports/batch-score/status",
  handler: statusHandler,
});

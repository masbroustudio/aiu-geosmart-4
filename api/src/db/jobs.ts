import { mockDb, BatchJob } from './mock.js';
import { query, getPool } from './pool.js';

export { BatchJob };

export const createBatchJob = async (
  userId: number,
  filename: string,
  totalRows: number
): Promise<BatchJob> => {
  const isMock = getPool().mock;
  if (isMock) {
    return mockDb.createBatchJob(userId, filename, totalRows);
  }

  const res = await query(
    `INSERT INTO batch_jobs (user_id, filename, total_rows, status) 
     VALUES ($1, $2, $3, 'pending') RETURNING *`,
    [userId, filename, totalRows]
  );
  return res.rows[0];
};

export const getBatchJob = async (jobId: number): Promise<BatchJob | null> => {
  const isMock = getPool().mock;
  if (isMock) {
    return mockDb.getBatchJob(jobId);
  }

  const res = await query(
    'SELECT * FROM batch_jobs WHERE id = $1',
    [jobId]
  );
  return res.rows[0] || null;
};

export const updateBatchJobProgress = async (
  jobId: number,
  processedRows: number,
  status: 'pending' | 'processing' | 'completed' | 'failed'
): Promise<boolean> => {
  const isMock = getPool().mock;
  if (isMock) {
    return mockDb.updateBatchJobProgress(jobId, processedRows, status);
  }

  const res = await query(
    `UPDATE batch_jobs 
     SET processed_rows = $1, status = $2, updated_at = NOW() 
     WHERE id = $3`,
    [processedRows, status, jobId]
  );
  return (res.rowCount ?? 0) > 0;
};

export const completeBatchJob = async (
  jobId: number,
  status: 'completed' | 'failed',
  stats?: string,
  resultRows?: string,
  errorMessage?: string
): Promise<boolean> => {
  const isMock = getPool().mock;
  if (isMock) {
    return mockDb.completeBatchJob(jobId, status, stats, resultRows, errorMessage);
  }

  const res = await query(
    `UPDATE batch_jobs 
     SET status = $1, result_stats = $2, result_rows = $3, error_message = $4, updated_at = NOW() 
     WHERE id = $5`,
    [status, stats || null, resultRows || null, errorMessage || null, jobId]
  );
  return (res.rowCount ?? 0) > 0;
};

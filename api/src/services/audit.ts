import { HttpRequest } from '@azure/functions';
import { query } from '../db/pool';

export interface AuditLogData {
  userId?: number;
  action: string;
  endpoint: string;
  method: string;
  statusCode: number;
  requestBody?: string;
  responseTimeMs?: number;
  ipAddress?: string;
  userAgent?: string;
}

export const logAudit = async (data: AuditLogData): Promise<void> => {
  try {
    await query(
      `INSERT INTO audit_logs (
        user_id, action, endpoint, method, status_code,
        request_body, response_time_ms, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        data.userId || null,
        data.action,
        data.endpoint,
        data.method,
        data.statusCode,
        data.requestBody || null,
        data.responseTimeMs || null,
        data.ipAddress || null,
        data.userAgent || null,
      ]
    );
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};

export const extractRequestInfo = (request: HttpRequest) => {
  return {
    method: request.method,
    url: request.url,
    endpoint: new URL(request.url).pathname,
    ipAddress:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
};

export const getRecentAuditLogs = async (
  userId?: number,
  limit: number = 100
): Promise<AuditLogData[]> => {
  const query_text = userId
    ? `SELECT user_id, action, endpoint, method, status_code,
             request_body, response_time_ms, ip_address, user_agent
      FROM audit_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2`
    : `SELECT user_id, action, endpoint, method, status_code,
             request_body, response_time_ms, ip_address, user_agent
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT $1`;

  const params = userId ? [userId, limit] : [limit];
  const result = await query(query_text, params);

  return result.rows;
};

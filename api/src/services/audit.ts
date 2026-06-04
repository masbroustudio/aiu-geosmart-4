import { HttpRequest } from '@azure/functions';
import { mockDb } from '../db/mock.js';
import { query, getPool } from '../db/pool.js';

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
    const isMock = getPool().mock;
    if (isMock) {
      await mockDb.logAudit({
        user_id: data.userId,
        action: data.action,
        endpoint: data.endpoint,
        method: data.method,
        status_code: data.statusCode,
        response_time_ms: data.responseTimeMs,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
      });
    } else {
      await query(
        `INSERT INTO audit_logs (user_id, action, endpoint, response_status, ip_address, user_agent, request_body) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          data.userId || null,
          data.action,
          data.endpoint,
          data.statusCode,
          data.ipAddress || null,
          data.userAgent || null,
          data.requestBody || null,
        ]
      );
    }
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};

export const extractRequestInfo = (request: HttpRequest) => {
  let endpoint = 'unknown';
  try {
    if (request.url) {
      if (request.url.startsWith('http://') || request.url.startsWith('https://')) {
        endpoint = new URL(request.url).pathname;
      } else {
        endpoint = request.url;
      }
    }
  } catch (e) {
    endpoint = 'error-parsing-url';
  }

  let ipAddress = 'unknown';
  let userAgent = 'unknown';
  try {
    if (request.headers) {
      ipAddress =
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';
      userAgent = request.headers.get('user-agent') || 'unknown';
    }
  } catch (e) {
    // Ignore header extraction failure
  }

  return {
    method: request.method || 'UNKNOWN',
    url: request.url || '',
    endpoint,
    ipAddress,
    userAgent,
  };
};

export const getRecentAuditLogs = async (
  userId?: number,
  limit: number = 100
): Promise<any[]> => {
  const isMock = getPool().mock;
  if (isMock) {
    return mockDb.getAuditLogs(limit);
  }
  
  const res = userId
    ? await query(
        'SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [userId, limit]
      )
    : await query(
        'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
  return res.rows;
};

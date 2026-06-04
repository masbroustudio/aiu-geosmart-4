import { mockDb } from './mock.js';
import { query, getPool } from './pool.js';

export interface ApiKey {
  id: number;
  user_id: number;
  key_hash: string;
  role: string;
  rate_limit: number;
  is_active: boolean;
  last_used?: Date;
  created_at: Date;
  updated_at: Date;
}

export const createApiKey = async (
  userId: number,
  keyHash: string,
  role: string,
  rateLimit: number = 100
): Promise<ApiKey> => {
  const isMock = getPool().mock;
  if (isMock) {
    return mockDb.createApiKey(userId, keyHash, role, rateLimit);
  }

  const res = await query(
    'INSERT INTO api_keys (user_id, key_hash, role, rate_limit) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, keyHash, role, rateLimit]
  );
  return res.rows[0];
};

export const getApiKeysByUser = async (userId: number): Promise<ApiKey[]> => {
  const isMock = getPool().mock;
  if (isMock) {
    return mockDb.getApiKeysByUser(userId);
  }

  const res = await query(
    'SELECT * FROM api_keys WHERE user_id = $1 AND is_active = TRUE ORDER BY created_at DESC',
    [userId]
  );
  return res.rows;
};

export const getApiKeyByHash = async (keyHash: string): Promise<ApiKey | null> => {
  const isMock = getPool().mock;
  if (isMock) {
    return mockDb.getApiKeyByHash(keyHash);
  }

  const res = await query(
    'SELECT * FROM api_keys WHERE key_hash = $1 AND is_active = TRUE',
    [keyHash]
  );
  return res.rows[0] || null;
};

export const deleteApiKey = async (keyId: number, userId: number): Promise<boolean> => {
  const isMock = getPool().mock;
  if (isMock) {
    return mockDb.deleteApiKey(keyId, userId);
  }

  const res = await query(
    'UPDATE api_keys SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
    [keyId, userId]
  );
  return (res.rowCount ?? 0) > 0;
};

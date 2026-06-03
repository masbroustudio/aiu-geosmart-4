import { mockDb } from './mock.js';
import { query, getPool } from './pool.js';

export interface User {
  id: number;
  email: string;
  password_hash?: string;
  full_name?: string;
  role: string;
  organization?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const createUser = async (
  email: string,
  passwordHash: string,
  fullName?: string,
  role?: string
): Promise<User> => {
  const isMock = getPool().mock;
  if (isMock) {
    return mockDb.createUser(email, passwordHash, fullName, role);
  }

  const res = await query(
    'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [email, passwordHash, fullName, role || 'viewer']
  );
  return res.rows[0];
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const isMock = getPool().mock;
  if (isMock) {
    return mockDb.getUserByEmail(email);
  }

  const res = await query('SELECT * FROM users WHERE email = $1 AND is_active = TRUE', [email]);
  return res.rows[0] || null;
};

export const getUserById = async (id: number): Promise<User | null> => {
  const isMock = getPool().mock;
  if (isMock) {
    return mockDb.getUserById(id);
  }

  const res = await query('SELECT * FROM users WHERE id = $1 AND is_active = TRUE', [id]);
  return res.rows[0] || null;
};

export const updateUser = async (
  id: number,
  updates: Partial<User>
): Promise<User | null> => {
  const isMock = getPool().mock;
  if (isMock) {
    // Return mock simulated updates (or just search user)
    const user = await mockDb.getUserById(id);
    if (!user) return null;
    return { ...user, ...updates };
  }

  const keys = Object.keys(updates);
  if (keys.length === 0) {
    return getUserById(id);
  }

  const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
  const values = keys.map((key) => (updates as any)[key]);
  
  const res = await query(
    `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return res.rows[0] || null;
};

export const deactivateUser = async (id: number): Promise<boolean> => {
  const isMock = getPool().mock;
  if (isMock) {
    return true;
  }

  const res = await query('UPDATE users SET is_active = FALSE WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
};

export const listUsers = async (
  limit: number = 50,
  offset: number = 0
): Promise<User[]> => {
  const isMock = getPool().mock;
  if (isMock) {
    return [];
  }

  const res = await query('SELECT * FROM users ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]);
  return res.rows;
};


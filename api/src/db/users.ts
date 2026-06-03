import { query } from './pool.js';

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
  const result = await query(
    `INSERT INTO users (email, password_hash, full_name, role, is_active)
     VALUES ($1, $2, $3, $4, true)
     RETURNING id, email, full_name, role, is_active, created_at, updated_at`,
    [email, passwordHash, fullName || null, role || 'viewer']
  );

  return result.rows[0];
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query(
    `SELECT id, email, password_hash, full_name, role, organization, is_active, created_at, updated_at
     FROM users WHERE email = $1 AND is_active = true`,
    [email]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
};

export const getUserById = async (id: number): Promise<User | null> => {
  const result = await query(
    `SELECT id, email, full_name, role, organization, is_active, created_at, updated_at
     FROM users WHERE id = $1 AND is_active = true`,
    [id]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
};

export const updateUser = async (
  id: number,
  updates: Partial<User>
): Promise<User | null> => {
  const fields: string[] = [];
  const values: (string | number | boolean | null)[] = [];
  let paramCount = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (
      key !== 'id' &&
      key !== 'created_at' &&
      key !== 'password_hash' &&
      value !== undefined
    ) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value as string | number | boolean | null);
      paramCount++;
    }
  }

  if (fields.length === 0) {
    return getUserById(id);
  }

  values.push(id);

  const result = await query(
    `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, email, full_name, role, organization, is_active, created_at, updated_at`,
    values
  );

  return result.rows.length > 0 ? result.rows[0] : null;
};

export const deactivateUser = async (id: number): Promise<boolean> => {
  const result = await query(`UPDATE users SET is_active = false WHERE id = $1`, [
    id,
  ]);

  return result.rowCount! > 0;
};

export const listUsers = async (
  limit: number = 50,
  offset: number = 0
): Promise<User[]> => {
  const result = await query(
    `SELECT id, email, full_name, role, organization, is_active, created_at, updated_at
     FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows;
};

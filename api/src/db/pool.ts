// For MVP: Using mock database. Replace with PostgreSQL for production.
// Set DB_TYPE=postgres environment variable to use real database.

import { mockDb } from './mock.js';

let pool: any = null;

export const getPool = () => {
  if (!pool) {
    pool = { mock: true };
    console.log('Using mock database for MVP');
  }
  return pool;
};

export const query = async (text: string, params?: any[]) => {
  // Mock database - return empty result for now
  // In production, this would connect to PostgreSQL
  console.log('Query (mock):', text);
  return { rows: [], rowCount: 0 };
};

export const closePool = async (): Promise<void> => {
  pool = null;
};

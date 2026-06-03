import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

const getPoolConfig = (): PoolConfig => {
  const config: PoolConfig = {
    user: process.env.DB_USER || 'geoumkm_admin',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'geoumkm',
    max: parseInt(process.env.DB_POOL_SIZE || '10', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || '2000',
      10
    ),
    ssl:
      process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
  };

  return config;
};

export const getPool = (): Pool => {
  if (!pool) {
    const config = getPoolConfig();
    pool = new Pool(config);

    pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
    });

    pool.on('connect', () => {
      console.log('New database connection established');
    });

    pool.on('remove', () => {
      console.log('Database connection removed from pool');
    });
  }

  return pool;
};

export const query = async (
  text: string,
  params?: (string | number | boolean | null)[]
) => {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

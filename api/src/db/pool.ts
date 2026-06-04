import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const { Pool } = pg;
let pool: any = null;
let initPromise: Promise<void> | null = null;
let dbInitialized = false;

export const getPool = () => {
  if (!pool) {
    const dbType = process.env.DB_TYPE || '';
    const dbHost = process.env.DB_HOST || process.env.PGHOST;
    const hasPostgres = dbType.toLowerCase() === 'postgres' || !!process.env.DATABASE_URL || !!dbHost;

    if (hasPostgres) {
      console.log('Initializing real PostgreSQL Connection Pool');
      const connectionString = process.env.DATABASE_URL;
      
      const config: any = connectionString 
        ? { connectionString }
        : {
            host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
            user: process.env.DB_USER || process.env.PGUSER || 'postgres',
            password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
            database: process.env.DB_NAME || process.env.PGDATABASE || 'geoumkm',
            port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
          };
      
      // Azure Database for PostgreSQL usually requires SSL
      if (process.env.DB_SSL === 'true' || process.env.PGSSLMODE !== 'disable') {
        config.ssl = { rejectUnauthorized: false };
      }
      
      pool = new Pool(config);
      
      // Trigger schema initialization asynchronously and store the promise
      initPromise = initializeDatabase().catch((err) => {
        console.error('Async initializeDatabase failed:', err);
      });
    } else {
      pool = { mock: true };
      console.log('Using mock database for MVP');
    }
  }
  return pool;
};

export const query = async (text: string, params?: any[]) => {
  const p = getPool();
  if (p.mock) {
    console.log('Query (mock):', text);
    return { rows: [], rowCount: 0 };
  }

  // Prevent deadlock: bypass initialization await if the query call stack
  // originates from initializeDatabase or seedDatabase.
  const stack = new Error().stack || '';
  const isInitCall = stack.includes('seedDatabase') || stack.includes('initializeDatabase');

  if (initPromise && !isInitCall && !dbInitialized) {
    console.log('Awaiting database schema initialization for query...');
    await initPromise;
  }

  return p.query(text, params);
};

export const closePool = async (): Promise<void> => {
  if (pool && typeof pool.end === 'function') {
    await pool.end();
  }
  pool = null;
};

export const initializeDatabase = async () => {
  const p = getPool();
  if (p.mock) {
    console.log('Database initialization skipped in mock mode');
    return;
  }
  
  // Try multiple paths to find schema.sql
  const possiblePaths = [
    path.resolve(__dirname, 'schema.sql'),
    path.resolve(__dirname, '../../../src/db/schema.sql'),
    path.resolve(__dirname, '../../src/db/schema.sql'),
    path.resolve(process.cwd(), 'src/db/schema.sql'),
    path.resolve(process.cwd(), 'db/schema.sql'),
  ];
  
  let schemaSql = '';
  for (const schemaPath of possiblePaths) {
    if (fs.existsSync(schemaPath)) {
      try {
        schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log(`Found schema.sql at: ${schemaPath}`);
        break;
      } catch (err) {
        console.warn(`Failed to read schema.sql at ${schemaPath}:`, err);
      }
    }
  }
  
  if (schemaSql) {
    try {
      await p.query(schemaSql);
      console.log('PostgreSQL schema initialized successfully');
      
      // Seeding dataset tables
      try {
        const { seedDatabase } = await import('./seed.js');
        await seedDatabase();
      } catch (seedErr) {
        console.error('Failed to seed tables after schema initialization:', seedErr);
      }
    } catch (error) {
      console.error('Failed to initialize PostgreSQL schema:', error);
    }
  } else {
    console.warn('Could not locate schema.sql in any of the search paths:', possiblePaths);
  }
  dbInitialized = true;
};


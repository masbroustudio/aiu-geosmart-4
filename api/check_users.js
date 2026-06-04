const { Client } = require('pg');

async function main() {
  const config = {
    host: 'pg-geoumkm-05bea5200.postgres.database.azure.com',
    user: 'geoumkm_admin',
    password: 'GeoUMKM@SecurePass2026#',
    database: 'geoumkm',
    port: 5432,
    ssl: { rejectUnauthorized: false }
  };

  const client = new Client(config);

  try {
    await client.connect();
    const res = await client.query('SELECT id, email, role, is_active FROM users');
    console.log('Users in PostgreSQL:', res.rows);
    
    const resAudit = await client.query('SELECT * FROM audit_logs');
    console.log('Audit logs in PostgreSQL:', resAudit.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();

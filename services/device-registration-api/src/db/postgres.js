import pg from 'pg';
const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'devicesdb',
  user: process.env.POSTGRES_USER || 'appuser',
  password: process.env.POSTGRES_PASSWORD || 'apppassword123',
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Initialize connection (test connectivity)
async function initPostgres() {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL connected successfully');
    client.release();
  } catch (err) {
    console.error('PostgreSQL connection error:', err.message);
    throw err;
  }
}

// Close all connections
async function closePostgres() {
  await pool.end();
  console.log('PostgreSQL connections closed');
}

// Insert a device registration
async function insertDeviceRegistration(userKey, deviceType) {
  const query = `
    INSERT INTO device_registrations (user_key, device_type)
    VALUES ($1, $2)
    RETURNING id, created_at
  `;

  const result = await pool.query(query, [userKey, deviceType]);
  return result.rows[0];
}

export { pool, initPostgres, closePostgres, insertDeviceRegistration };

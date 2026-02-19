import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'devicesdb',
  user: process.env.POSTGRES_USER || 'appuser',
  password: process.env.POSTGRES_PASSWORD || 'apppassword123',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

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

async function closePostgres() {
  await pool.end();
  console.log('PostgreSQL connections closed');
}

async function getDeviceTypeCount(deviceType) {
  const query = `
    SELECT COUNT(*) as count
    FROM device_registrations
    WHERE device_type = $1
  `;

  const result = await pool.query(query, [deviceType]);
  return parseInt(result.rows[0].count, 10);
}

async function getAllDeviceTypeCounts() {
  const query = `
    SELECT device_type, COUNT(*)::int as count
    FROM device_registrations
    GROUP BY device_type
  `;

  const result = await pool.query(query);

  const statistics = {
    iOS: 0,
    Android: 0,
    Watch: 0,
    TV: 0
  };

  let total = 0;
  result.rows.forEach(row => {
    statistics[row.device_type] = row.count;
    total += row.count;
  });

  return { statistics, total };
}

export { pool, initPostgres, closePostgres, getDeviceTypeCount, getAllDeviceTypeCounts };

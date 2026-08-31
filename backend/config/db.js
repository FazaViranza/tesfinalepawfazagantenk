const { Pool } = require('pg');
const config = require('./env');

let poolConfig;

if (config.db.connectionString) {
  poolConfig = {
    connectionString: config.db.connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
} else {
  poolConfig = {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Execute single query
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get dedicated client for transactions
 */
const getClient = () => pool.connect();

/**
 * Test PostgreSQL database connection
 */
const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW() as current_time');
    console.log('✅ PostgreSQL Database terhubung sukses pada:', res.rows[0].current_time);
    return true;
  } catch (err) {
    console.error('⚠️ Peringatan: Gagal terhubung ke database PostgreSQL.');
    console.error('   Detail:', err.message);
    console.error('   Pastikan PostgreSQL service sedang aktif dan database "' + config.db.database + '" sudah dibuat.');
    return false;
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};

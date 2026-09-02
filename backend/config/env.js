require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;

if (isProduction && (!jwtSecret || jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET wajib diatur dan minimal 32 karakter pada production.');
}

const config = {
  port: Number(process.env.PORT) || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: jwtSecret || 'umkm-ai-secret-key-2024-jwt-token-very-secure',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Database PostgreSQL config
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'umkm_ai',
    connectionString: process.env.DATABASE_URL || undefined,
  },

  // Optional AI API Key (fallback to intelligent local heuristic if not provided)
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};

module.exports = config;

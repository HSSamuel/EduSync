const { Pool } = require('pg');
const { logger } = require('./utils/logger');

const isProduction = process.env.NODE_ENV === 'production';
const shouldUseSsl = String(process.env.DB_SSL || '').toLowerCase() === 'true';

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_DATABASE,
  max: Number(process.env.DB_POOL_MAX || 20),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30_000),
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10_000),
  maxUses: Number(process.env.DB_MAX_USES || 7_500),
  allowExitOnIdle: !isProduction,
  ssl: shouldUseSsl
    ? {
        rejectUnauthorized: String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() === 'true',
      }
    : false,
});

pool.on('error', (error) => {
  logger.error('Unexpected PostgreSQL pool error', { error });
});

module.exports = pool;

const { Pool } = require('pg');
require('dotenv').config();
const logger = require('../src/utils/logger');

// Force IPv4 DNS resolution to avoid ENETUNREACH errors
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Supabase/Render connections usually
    },
    // Force IPv4 to avoid ENETUNREACH errors with IPv6
    host: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : undefined,
    connectionTimeoutMillis: 5000,
    query_timeout: 10000,
    // Node.js net.connect options - force IPv4
    options: '-c search_path=public'
});

// Test connection
pool.on('connect', () => {
    logger.debug('Database connection established');
});

pool.on('error', (err) => {
    logger.error('Unexpected database error on idle client', { error: err.message, code: err.code });
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};

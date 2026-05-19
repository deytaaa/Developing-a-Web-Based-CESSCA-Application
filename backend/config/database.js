const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

const requiredEnv = (name, fallback = '') => {
    const value = process.env[name] || fallback;

    if (isProduction && !connectionString && !process.env[name]) {
        throw new Error(`Missing required environment variable: ${name}. Set Supabase DATABASE_URL or the individual PostgreSQL settings.`);
    }

    return value;
};

const poolConfig = connectionString
    ? {
        connectionString,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: requiredEnv('DB_HOST', 'localhost'),
        user: requiredEnv('DB_USER', 'root'),
        password: requiredEnv('DB_PASSWORD', ''),
        database: requiredEnv('DB_NAME', 'cessca_db'),
        port: parseInt(process.env.DB_PORT || '5432', 10),
        ssl: process.env.DB_SSL === 'true' || isProduction ? { rejectUnauthorized: false } : false,
      };

const pgPool = new Pool(poolConfig);

const convertSql = (sql) => {
    let text = String(sql);
    let placeholderIndex = 0;

    text = text.replace(/ON DUPLICATE KEY UPDATE content = VALUES\(content\), updated_at = NOW\(\)/i, 'ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()');
    text = text.replace(/DATE_SUB\(NOW\(\),\s*INTERVAL\s+(\d+)\s+MONTH\)/gi, "NOW() - INTERVAL '$1 months'");
    text = text.replace(/CURDATE\(\)/gi, 'CURRENT_DATE');
    text = text.replace(/DATEDIFF\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/gi, "DATE_PART('day', $1::timestamp - $2::timestamp)");
    text = text.replace(/YEAR\(\s*([^)]+?)\s*\)/gi, 'EXTRACT(YEAR FROM $1)');
    text = text.replace(/MONTH\(\s*([^)]+?)\s*\)/gi, 'EXTRACT(MONTH FROM $1)');
    text = text.replace(/LIMIT\s+\$(\d+)\s*,\s*\$(\d+)/i, 'LIMIT $2 OFFSET $1');

    text = text.replace(/\?/g, () => {
        placeholderIndex += 1;
        return `$${placeholderIndex}`;
    });

    text = text.replace(/LIMIT\s+\$(\d+)\s*,\s*\$(\d+)/i, 'LIMIT $2 OFFSET $1');

    return text;
};

const getInsertId = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) {
        return undefined;
    }

    const row = rows[0];
    const idKey = Object.keys(row).find((key) => /(^id$|_id$)/i.test(key));
    return idKey ? row[idKey] : undefined;
};

const buildResult = (payload, meta = {}) => {
    const response = [payload, undefined];
    Object.assign(response, meta);
    return response;
};

const query = async (sql, params = []) => {
    const text = convertSql(sql);
    const values = Array.isArray(params) ? params : [params];
    const command = text.trim().split(/\s+/)[0].toUpperCase();
    const result = await pgPool.query(text, values);

    if (command === 'SELECT' || command === 'WITH' || command === 'SHOW') {
        return buildResult(result.rows, { rows: result.rows, rowCount: result.rowCount, command });
    }

    if (command === 'INSERT') {
        const insertId = getInsertId(result.rows);
        return buildResult({ insertId, affectedRows: result.rowCount, rows: result.rows }, {
            insertId,
            affectedRows: result.rowCount,
            rows: result.rows,
            rowCount: result.rowCount,
            command,
        });
    }

    return buildResult({ affectedRows: result.rowCount, rows: result.rows }, {
        affectedRows: result.rowCount,
        rows: result.rows,
        rowCount: result.rowCount,
        command,
    });
};

const getConnection = async () => {
    return pgPool.connect();
};

const end = async () => {
    return pgPool.end();
};

const pool = { query, getConnection, end };

// Test connection
const testConnection = async () => {
    try {
        const connection = await getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

module.exports = { pool, testConnection };

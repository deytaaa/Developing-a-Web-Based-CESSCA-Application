const mysql = require('mysql2/promise');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const requiredEnv = (name, fallback = '') => {
    const value = process.env[name] || fallback;

    if (isProduction && !process.env[name]) {
        throw new Error(`Missing required environment variable: ${name}. Render must use an external MySQL database; localhost will not work.`);
    }

    return value;
};

// Create connection pool
const pool = mysql.createPool({
    host: requiredEnv('DB_HOST', 'localhost'),
    user: requiredEnv('DB_USER', 'root'),
    password: requiredEnv('DB_PASSWORD', ''),
    database: requiredEnv('DB_NAME', 'cessca_db'),
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

module.exports = { pool, testConnection };

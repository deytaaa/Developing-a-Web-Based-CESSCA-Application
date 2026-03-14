const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigrations() {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'cessca_db',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('✓ Connected to database');

        // Migration files
        const migrations = [];

        for (const migrationFile of migrations) {
            const migrationPath = path.join(__dirname, migrationFile);
            console.log(`\n📄 Running migration: ${path.basename(migrationFile)}`);

            try {
                const sql = await fs.readFile(migrationPath, 'utf8');
                await connection.query(sql);
                console.log(`✓ Successfully executed ${path.basename(migrationFile)}`);
            } catch (error) {
                console.error(`✗ Error in ${path.basename(migrationFile)}:`, error.message);
                // Continue with next migration
            }
        }

        if (migrations.length === 0) {
            console.log('\nℹ No pending migrations to run.');
        } else {
            console.log('\n✓ All migrations completed!');
        }

    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✓ Database connection closed');
        }
    }
}

runMigrations();

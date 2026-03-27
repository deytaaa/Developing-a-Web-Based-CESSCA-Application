const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAdminPassword() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    const newPassword = await bcrypt.hash('admin123', 10);
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [newPassword, 'admin@ptc.edu.ph']
    );
    console.log('Admin password reset result:', result);
    await connection.end();
    console.log('✅ Admin password has been reset to "admin123"');
  } catch (error) {
    console.error('❌ Error resetting admin password:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();

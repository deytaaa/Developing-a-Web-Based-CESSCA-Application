const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAdminPassword() {
  try {
    const newPassword = await bcrypt.hash('admin123', 10);
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [newPassword, 'admin@ptc.edu.ph']
    );
    console.log('Admin password reset result:', result);
    console.log('✅ Admin password has been reset to "admin123"');
  } catch (error) {
    console.error('❌ Error resetting admin password:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();

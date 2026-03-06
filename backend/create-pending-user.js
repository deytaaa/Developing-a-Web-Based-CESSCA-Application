const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createPendingUser() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cessca_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database\n');
    
    const password = await bcrypt.hash('test123', 10);
    
    // Create a pending user for testing approval
    const [result] = await connection.execute(
      'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
      ['pending.student@ptc.edu.ph', password, 'student', 'pending']
    );
    
    await connection.execute(
      'INSERT INTO user_profiles (user_id, first_name, last_name, student_id, course, contact_number) VALUES (?, ?, ?, ?, ?, ?)',
      [result.insertId, 'Test', 'Pending', '2024-099', 'BS Information Technology', '09123456789']
    );
    
    console.log('✅ Pending user created for testing!\n');
    console.log('📝 This user is awaiting approval:');
    console.log('   Email: pending.student@ptc.edu.ph');
    console.log('   Password: test123');
    console.log('   Status: PENDING\n');
    console.log('🔐 Login as admin to approve this user:');
    console.log('   Admin: admin@ptc.edu.ph / admin123\n');

    await connection.end();
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('⚠️  User already exists');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

createPendingUser();

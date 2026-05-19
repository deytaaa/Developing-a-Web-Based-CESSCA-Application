const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createPendingUser() {
  try {
    console.log('Using Postgres pool for database operations');
    
    const password = await bcrypt.hash('test123', 10);
    
    // Create a pending user for testing approval
    const [result] = await pool.query(
      'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?) RETURNING user_id',
      ['pending.student@ptc.edu.ph', password, 'student', 'pending']
    );

    await pool.query(
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

    // pool shared; no explicit end required
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
      console.log('⚠️  User already exists');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

createPendingUser();

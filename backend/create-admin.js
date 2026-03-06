const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdminUser() {
  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cessca_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const cesscaPassword = await bcrypt.hash('cessca123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);

    console.log('✅ Generated password hashes');

    // Delete existing users (to avoid duplicates)
    await connection.execute('DELETE FROM users WHERE email IN (?, ?, ?)', 
      ['admin@ptc.edu.ph', 'cessca@ptc.edu.ph', 'student@ptc.edu.ph']
    );

    // Insert admin user
    const [adminResult] = await connection.execute(
      'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
      ['admin@ptc.edu.ph', adminPassword, 'admin', 'active']
    );
    const adminId = adminResult.insertId;

    // Insert cessca staff user
    const [cesscaResult] = await connection.execute(
      'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
      ['cessca@ptc.edu.ph', cesscaPassword, 'cessca_staff', 'active']
    );
    const cesscaId = cesscaResult.insertId;

    // Insert test student user
    const [studentResult] = await connection.execute(
      'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
      ['student@ptc.edu.ph', studentPassword, 'student', 'active']
    );
    const studentId = studentResult.insertId;

    console.log('✅ Created users');

    // Insert user profiles
    await connection.execute(
      'INSERT INTO user_profiles (user_id, first_name, last_name, contact_number) VALUES (?, ?, ?, ?)',
      [adminId, 'System', 'Administrator', '09123456789']
    );

    await connection.execute(
      'INSERT INTO user_profiles (user_id, first_name, last_name, contact_number) VALUES (?, ?, ?, ?)',
      [cesscaId, 'CESSCA', 'Staff', '09123456790']
    );

    await connection.execute(
      'INSERT INTO user_profiles (user_id, first_name, middle_name, last_name, student_id, course, contact_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [studentId, 'Juan', 'Santos', 'Dela Cruz', '2024-001', 'BS Information Technology', '09123456791']
    );

    console.log('✅ Created user profiles');

    console.log('\n🎉 Success! You can now login with:');
    console.log('\n📝 Admin Account:');
    console.log('   Email: admin@ptc.edu.ph');
    console.log('   Password: admin123');
    console.log('\n📝 CESSCA Staff Account:');
    console.log('   Email: cessca@ptc.edu.ph');
    console.log('   Password: cessca123');
    console.log('\n📝 Student Account:');
    console.log('   Email: student@ptc.edu.ph');
    console.log('   Password: student123');
    console.log('\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();

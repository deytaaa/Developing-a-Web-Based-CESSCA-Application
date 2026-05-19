const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdminUser() {
  try {
    console.log('Using Postgres pool for database operations');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const cesscaPassword = await bcrypt.hash('cessca123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);

    console.log('✅ Generated password hashes');


    // Remove all users except cessca staff and admin
    await pool.query('DELETE FROM users WHERE email NOT IN (?, ?)', ['admin@ptc.edu.ph', 'cessca@ptc.edu.ph']);

    // Upsert admin user
    let adminId, cesscaId, studentId;
    // Admin
    const [adminRows] = await pool.query('SELECT user_id FROM users WHERE email = ?', ['admin@ptc.edu.ph']);
    if (adminRows.length > 0) {
      adminId = adminRows[0].user_id;
      await pool.query('UPDATE users SET password = ?, role = ?, status = ? WHERE user_id = ?', [adminPassword, 'admin', 'active', adminId]);
    } else {
      const [adminResult] = await pool.query('INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?) RETURNING user_id', ['admin@ptc.edu.ph', adminPassword, 'admin', 'active']);
      adminId = adminResult.insertId;
    }
    // CESSCA Staff
    const [cesscaRows] = await pool.query('SELECT user_id FROM users WHERE email = ?', ['cessca@ptc.edu.ph']);
    if (cesscaRows.length > 0) {
      cesscaId = cesscaRows[0].user_id;
      await pool.query('UPDATE users SET password = ?, role = ?, status = ? WHERE user_id = ?', [cesscaPassword, 'cessca_staff', 'active', cesscaId]);
    } else {
      const [cesscaResult] = await pool.query('INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?) RETURNING user_id', ['cessca@ptc.edu.ph', cesscaPassword, 'cessca_staff', 'active']);
      cesscaId = cesscaResult.insertId;
    }
    // Student
    const [studentRows] = await pool.query('SELECT user_id FROM users WHERE email = ?', ['student@ptc.edu.ph']);
    if (studentRows.length > 0) {
      studentId = studentRows[0].user_id;
      await pool.query('UPDATE users SET password = ?, role = ?, status = ? WHERE user_id = ?', [studentPassword, 'student', 'active', studentId]);
    } else {
      const [studentResult] = await pool.query('INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?) RETURNING user_id', ['student@ptc.edu.ph', studentPassword, 'student', 'active']);
      studentId = studentResult.insertId;
    }

    console.log('✅ Created or updated users');


    // Upsert user profiles
    // Admin
    const [adminProfileRows] = await pool.query('SELECT user_id FROM user_profiles WHERE user_id = ?', [adminId]);
    if (adminProfileRows.length > 0) {
      await pool.query('UPDATE user_profiles SET first_name = ?, last_name = ?, contact_number = ? WHERE user_id = ?', ['System', 'Administrator', '09123456789', adminId]);
    } else {
      await pool.query('INSERT INTO user_profiles (user_id, first_name, last_name, contact_number) VALUES (?, ?, ?, ?)', [adminId, 'System', 'Administrator', '09123456789']);
    }
    // CESSCA Staff
    const [cesscaProfileRows] = await pool.query('SELECT user_id FROM user_profiles WHERE user_id = ?', [cesscaId]);
    if (cesscaProfileRows.length > 0) {
      await pool.query('UPDATE user_profiles SET first_name = ?, last_name = ?, contact_number = ? WHERE user_id = ?', ['CESSCA', 'Staff', '09123456790', cesscaId]);
    } else {
      await pool.query('INSERT INTO user_profiles (user_id, first_name, last_name, contact_number) VALUES (?, ?, ?, ?)', [cesscaId, 'CESSCA', 'Staff', '09123456790']);
    }
    // Student
    const [studentProfileRows] = await pool.query('SELECT user_id FROM user_profiles WHERE user_id = ?', [studentId]);
    if (studentProfileRows.length > 0) {
      await pool.query('UPDATE user_profiles SET first_name = ?, middle_name = ?, last_name = ?, student_id = ?, course = ?, contact_number = ? WHERE user_id = ?', ['Juan', 'Santos', 'Dela Cruz', '2024-001', 'BS Information Technology', '09123456791', studentId]);
    } else {
      await pool.query('INSERT INTO user_profiles (user_id, first_name, middle_name, last_name, student_id, course, contact_number) VALUES (?, ?, ?, ?, ?, ?, ?)', [studentId, 'Juan', 'Santos', 'Dela Cruz', '2024-001', 'BS Information Technology', '09123456791']);
    }

    console.log('✅ Created or updated user profiles');

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

    // Pool is shared; no need to explicitly end here
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();

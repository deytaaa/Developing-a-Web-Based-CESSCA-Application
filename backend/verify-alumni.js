const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function verifyAccount() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cessca_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database\n');

    // Check for john.alumni@gmail.com
    const [users] = await connection.execute(
      'SELECT user_id, email, role, status, password FROM users WHERE email = ?',
      ['john.alumni@gmail.com']
    );

    if (users.length === 0) {
      console.log('❌ User john.alumni@gmail.com NOT FOUND in database');
      console.log('\n🔧 Creating alumni account now...\n');
      
      // Create the alumni account
      const alumniPassword = await bcrypt.hash('alumni123', 10);
      
      const [result] = await connection.execute(
        'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
        ['john.alumni@gmail.com', alumniPassword, 'alumni', 'active']
      );
      
      await connection.execute(
        'INSERT INTO user_profiles (user_id, first_name, last_name, contact_number) VALUES (?, ?, ?, ?)',
        [result.insertId, 'John', 'Dela Cruz', '09171234567']
      );
      
      await connection.execute(
        'INSERT INTO alumni_profiles (user_id, graduation_year, degree_program, current_employment_status, company_name, job_position, industry, employment_start_date, contact_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [result.insertId, 2023, 'BS Information Technology', 'employed', 'Accenture', 'Software Engineer', 'Information Technology', '2023-07-01', 'john.alumni@gmail.com']
      );
      
      console.log('✅ Alumni account created successfully!');
    } else {
      console.log('✅ User FOUND in database:');
      console.log(`   Email: ${users[0].email}`);
      console.log(`   Role: ${users[0].role}`);
      console.log(`   Status: ${users[0].status}`);
      
      // Test password
      const passwordMatch = await bcrypt.compare('alumni123', users[0].password);
      console.log(`   Password Check: ${passwordMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);
      
      if (!passwordMatch) {
        console.log('\n🔧 Resetting password to: alumni123');
        const newPassword = await bcrypt.hash('alumni123', 10);
        await connection.execute(
          'UPDATE users SET password = ? WHERE email = ?',
          [newPassword, 'john.alumni@gmail.com']
        );
        console.log('✅ Password reset successfully!');
      }
    }

    console.log('\n📝 You can now login with:');
    console.log('   Email: john.alumni@gmail.com');
    console.log('   Password: alumni123\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyAccount();

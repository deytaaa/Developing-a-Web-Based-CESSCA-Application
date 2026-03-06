const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAlumniAccounts() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cessca_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database\n');
    
    const alumniPassword = await bcrypt.hash('alumni123', 10);
    
    const alumniAccounts = [
      { 
        email: 'john.alumni@ptc.edu.ph',
        firstName: 'John',
        lastName: 'Dela Cruz',
        graduationYear: 2023,
        degree: 'BS Information Technology',
        company: 'Accenture',
        position: 'Software Engineer'
      },
      {
        email: 'jane.alumni@ptc.edu.ph',
        firstName: 'Jane',
        lastName: 'Santos',
        graduationYear: 2022,
        degree: 'BS Public Administration',
        company: 'Pateros Municipal Government',
        position: 'Administrative Officer'
      }
    ];

    for (const alumni of alumniAccounts) {
      // Check if already exists
      const [existing] = await connection.execute(
        'SELECT user_id FROM users WHERE email = ?',
        [alumni.email]
      );

      if (existing.length > 0) {
        console.log(`⚠️  ${alumni.email} already exists - updating password...`);
        await connection.execute(
          'UPDATE users SET password = ?, status = ? WHERE email = ?',
          [alumniPassword, 'active', alumni.email]
        );
        console.log(`✅ Password updated for ${alumni.email}`);
      } else {
        // Create new alumni account
        const [result] = await connection.execute(
          'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
          [alumni.email, alumniPassword, 'alumni', 'active']
        );

        await connection.execute(
          'INSERT INTO user_profiles (user_id, first_name, last_name, contact_number) VALUES (?, ?, ?, ?)',
          [result.insertId, alumni.firstName, alumni.lastName, `0917${Math.floor(Math.random() * 10000000)}`]
        );

        await connection.execute(
          'INSERT INTO alumni_profiles (user_id, graduation_year, degree_program, current_employment_status, company_name, job_position, industry, employment_start_date, contact_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [result.insertId, alumni.graduationYear, alumni.degree, 'employed', alumni.company, alumni.position, 'Information Technology', `${alumni.graduationYear}-07-01`, alumni.email]
        );

        console.log(`✅ Created alumni account: ${alumni.email}`);
      }
    }

    console.log('\n🎉 Alumni accounts are ready!\n');
    console.log('📝 You can now login with:');
    console.log('\n1. Alumni Account (PTC Email):');
    console.log('   Email: john.alumni@ptc.edu.ph');
    console.log('   Password: alumni123');
    console.log('\n2. Alumni Account (PTC Email):');
    console.log('   Email: jane.alumni@ptc.edu.ph');
    console.log('   Password: alumni123\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAlumniAccounts();

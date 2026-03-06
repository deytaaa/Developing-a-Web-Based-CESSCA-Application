const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugLogin() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cessca_db',
      port: process.env.DB_PORT || 3306
    });

    const testEmail = 'john.alumni@gmail.com';
    const testPassword = 'alumni123';

    console.log('🔍 Debugging login for:', testEmail);
    console.log('');

    // Get user from database
    const [users] = await connection.execute(
      'SELECT user_id, email, password, role, status FROM users WHERE email = ?',
      [testEmail]
    );

    if (users.length === 0) {
      console.log('❌ User not found in database');
      await connection.end();
      return;
    }

    const user = users[0];
    console.log('✅ User found:');
    console.log('   ID:', user.user_id);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Status:', user.status);
    console.log('   Password hash:', user.password.substring(0, 20) + '...');
    console.log('');

    // Check status
    if (user.status !== 'active') {
      console.log('❌ Account status is:', user.status);
      console.log('   Updating to active...');
      await connection.execute(
        'UPDATE users SET status = ? WHERE user_id = ?',
        ['active', user.user_id]
      );
      console.log('✅ Status updated to active');
    } else {
      console.log('✅ Account status: active');
    }

    // Test password
    console.log('');
    console.log('🔐 Testing password...');
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('   Password match:', isMatch ? '✅ YES' : '❌ NO');

    if (!isMatch) {
      console.log('');
      console.log('🔧 Password mismatch! Hashing new password...');
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('   New hash:', newHash.substring(0, 20) + '...');
      
      await connection.execute(
        'UPDATE users SET password = ? WHERE user_id = ?',
        [newHash, user.user_id]
      );
      console.log('✅ Password updated in database');
      
      // Verify again
      const verifyMatch = await bcrypt.compare(testPassword, newHash);
      console.log('   Verification:', verifyMatch ? '✅ SUCCESS' : '❌ FAILED');
    }

    // Check for profile
    const [profiles] = await connection.execute(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [user.user_id]
    );

    console.log('');
    if (profiles.length === 0) {
      console.log('⚠️  No user profile found - creating one...');
      await connection.execute(
        'INSERT INTO user_profiles (user_id, first_name, last_name) VALUES (?, ?, ?)',
        [user.user_id, 'John', 'Alumni']
      );
      console.log('✅ Profile created');
    } else {
      console.log('✅ User profile exists');
    }

    console.log('');
    console.log('✅ All checks complete! Try logging in now:');
    console.log('   Email: john.alumni@gmail.com');
    console.log('   Password: alumni123');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugLogin();

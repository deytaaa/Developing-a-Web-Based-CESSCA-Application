const axios = require('axios');

async function testLogin() {
  try {
    console.log('🧪 Testing login API...\n');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'john.alumni@gmail.com',
      password: 'alumni123'
    });

    console.log('✅ Login successful!');
    console.log('\n📄 Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Login failed');
      console.log('\n📄 Error response:');
      console.log(JSON.stringify(error.response.data, null, 2));
      console.log('\nStatus:', error.response.status);
    } else {
      console.log('❌ Request failed:', error.message);
    }
  }
}

testLogin();

// Test the authentication endpoints
async function testAuth() {
  try {
    console.log('🧪 Testing authentication endpoints...\n');
    
    // Test 1: Login with new user
    console.log('1. Testing login (auto-registration)...');
    const loginResponse = await fetch('http://localhost:3004/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'person1',
        password: 'demo123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login result:', loginData);
    
    if (loginData.success) {
      const sessionToken = loginData.data.user.sessionToken;
      console.log('✅ Login successful! Session token:', sessionToken.substring(0, 20) + '...');
      
      // Test 2: Validate session
      console.log('\n2. Testing session validation...');
      const validateResponse = await fetch('http://localhost:3004/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken })
      });
      
      const validateData = await validateResponse.json();
      console.log('Validation result:', validateData);
      
      if (validateData.success) {
        console.log('✅ Session validation successful!');
        
        // Test 3: Logout
        console.log('\n3. Testing logout...');
        const logoutResponse = await fetch('http://localhost:3004/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken })
        });
        
        const logoutData = await logoutResponse.json();
        console.log('Logout result:', logoutData);
        
        if (logoutData.success) {
          console.log('✅ Logout successful!');
          
          // Test 4: Try to validate expired session
          console.log('\n4. Testing expired session validation...');
          const expiredResponse = await fetch('http://localhost:3004/api/auth/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionToken })
          });
          
          const expiredData = await expiredResponse.json();
          console.log('Expired validation result:', expiredData);
          
          if (!expiredData.success) {
            console.log('✅ Expired session properly rejected!');
            console.log('\n🎉 All authentication tests passed!');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running: node simple-server.js');
  }
}

testAuth();
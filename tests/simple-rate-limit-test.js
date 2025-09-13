/**
 * Simple Rate Limiting Test
 * Quick test to verify rate limiting is working
 */

console.log('Starting Simple Rate Limit Test...');

// Test 1: Login Rate Limiting
const testLoginRateLimit = async () => {
  console.log('\nTesting Login Rate Limiting...');
  
  const loginData = {
    email: 'wrong@email.com',
    password: 'wrongpassword'
  };

  let attempts = 0;
  let rateLimited = false;

  // Make 7 login attempts
  for (let i = 1; i <= 7; i++) {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });

      const status = response.status;
      console.log(`  Attempt ${i}: Status ${status}`);

      if (status === 429) {
        console.log(`  Rate limited at attempt ${i}!`);
        rateLimited = true;
        break;
      }

      attempts++;
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.log(`  Request ${i} failed:`, error.message);
    }
  }

  if (rateLimited) {
    console.log('  Login rate limiting is working!');
  } else {
    console.log('  Login rate limiting may not be working');
  }
};

// Test 2: API Rate Limiting (simpler version)
const testApiRateLimit = async () => {
  console.log('\nTesting API Rate Limiting...');
  console.log('  Note: This test requires authentication, skipping for now');
  console.log('  To test manually: Make 100+ requests to /api/funds with a valid token');
};

// Main test function
const runTests = async () => {
  try {
    // Check if server is running
    console.log('Checking if server is running...');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test', password: 'test' })
      });
      console.log('Server is reachable');
    } catch (error) {
      console.log('Server not reachable. Please start the server first.');
      console.log('   Run: yarn dev');
      return;
    }

    await testLoginRateLimit();
    await testApiRateLimit();

    console.log('\nRate Limits Configured:');
    console.log('  - Login: 5 attempts per minute per IP');
    console.log('  - API: 100 requests per minute per user');
    console.log('  - Portfolio: 10 updates per minute per user');

  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
runTests();

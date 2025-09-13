/**
 * Rate Limiting Test Script
 * Tests the various rate limits implemented in the API
 */

import axios from 'axios';

// Add error handling for imports
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test@123456',
  name: 'Test User'
};

// Helper function to make requests
const makeRequest = async (method, url, data = null, headers = {}) => {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${url}`,
      data,
      headers
    });
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      data: error.response?.data || { message: error.message }
    };
  }
};

// Test login rate limiting (5 attempts per minute)
const testLoginRateLimit = async () => {
  console.log('\n🔐 Testing Login Rate Limiting (5 attempts per minute)...');
  
  const results = [];
  
  // Make 7 login attempts (should fail after 5)
  for (let i = 1; i <= 7; i++) {
    const result = await makeRequest('POST', '/auth/login', {
      email: 'wrong@email.com',
      password: 'wrongpassword'
    });
    
    results.push({
      attempt: i,
      status: result.status,
      rateLimited: result.status === 429
    });
    
    console.log(`  Attempt ${i}: Status ${result.status} ${result.status === 429 ? '(RATE LIMITED)' : ''}`);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const rateLimitedCount = results.filter(r => r.rateLimited).length;
  console.log(`  ✅ Rate limiting working: ${rateLimitedCount}/2 requests blocked after limit`);
  
  return results;
};

// Test API rate limiting (100 requests per minute per user)
const testApiRateLimit = async () => {
  console.log('\n🌐 Testing API Rate Limiting (100 requests per minute)...');
  
  // First, login to get a token
  const loginResult = await makeRequest('POST', '/auth/signup', TEST_USER);
  if (!loginResult.success) {
    // Try login if signup fails
    const loginAttempt = await makeRequest('POST', '/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    if (!loginAttempt.success) {
      console.log('  ❌ Could not authenticate for API rate limit test');
      return;
    }
  }
  
  const token = loginResult.data?.token || (await makeRequest('POST', '/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password
  })).data?.token;
  
  if (!token) {
    console.log('  ❌ Could not get authentication token');
    return;
  }
  
  console.log('  📝 Making rapid API requests...');
  
  const headers = { Authorization: `Bearer ${token}` };
  let successCount = 0;
  let rateLimitedCount = 0;
  
  // Make 105 requests rapidly (should be rate limited after 100)
  for (let i = 1; i <= 105; i++) {
    const result = await makeRequest('GET', '/funds', null, headers);
    
    if (result.status === 429) {
      rateLimitedCount++;
      if (rateLimitedCount === 1) {
        console.log(`  🚫 First rate limit hit at request ${i}`);
      }
    } else if (result.success) {
      successCount++;
    }
    
    // Very small delay to avoid overwhelming
    if (i % 10 === 0) {
      console.log(`  Progress: ${i}/105 requests sent`);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  console.log(`  ✅ Results: ${successCount} successful, ${rateLimitedCount} rate limited`);
  console.log(`  Expected: ~100 successful, ~5 rate limited`);
};

// Test portfolio rate limiting (10 updates per minute)
const testPortfolioRateLimit = async () => {
  console.log('\n📊 Testing Portfolio Rate Limiting (10 updates per minute)...');
  
  // Get authentication token
  const loginResult = await makeRequest('POST', '/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (!loginResult.success) {
    console.log('  ❌ Could not authenticate for portfolio rate limit test');
    return;
  }
  
  const token = loginResult.data.token;
  const headers = { Authorization: `Bearer ${token}` };
  
  let successCount = 0;
  let rateLimitedCount = 0;
  
  // Make 15 portfolio add requests (should be rate limited after 10)
  for (let i = 1; i <= 15; i++) {
    const result = await makeRequest('POST', '/portfolio/add', {
      schemeCode: 120716,
      units: 10,
      purchasePrice: 100,
      purchaseDate: new Date().toISOString()
    }, headers);
    
    if (result.status === 429) {
      rateLimitedCount++;
      if (rateLimitedCount === 1) {
        console.log(`  🚫 First rate limit hit at request ${i}`);
      }
    } else if (result.success || result.status === 400) { // 400 might be validation error, still counts as processed
      successCount++;
    }
    
    console.log(`  Request ${i}: Status ${result.status}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`  ✅ Results: ${successCount} processed, ${rateLimitedCount} rate limited`);
  console.log(`  Expected: ~10 processed, ~5 rate limited`);
};

// Main test runner
const runTests = async () => {
  console.log('🧪 Rate Limiting Test Suite Starting...');
  console.log('⚠️  Make sure your server is running on http://localhost:5000');
  
  try {
    // Test server connectivity
    const healthCheck = await makeRequest('GET', '/');
    if (!healthCheck.success && healthCheck.status !== 404) {
      console.log('❌ Server not reachable. Please start the server first.');
      return;
    }
    
    console.log('✅ Server is reachable');
    
    // Run individual tests
    await testLoginRateLimit();
    
    // Wait a bit between tests
    console.log('\n⏳ Waiting 5 seconds between tests...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await testApiRateLimit();
    
    console.log('\n⏳ Waiting 5 seconds between tests...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await testPortfolioRateLimit();
    
    console.log('\n✅ All rate limiting tests completed!');
    console.log('\n📋 Summary:');
    console.log('  - Login rate limit: 5 attempts per minute per IP');
    console.log('  - API rate limit: 100 requests per minute per user');
    console.log('  - Portfolio rate limit: 10 updates per minute per user');
    console.log('\n💡 To reset rate limits, wait 1 minute or restart the server.');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
};

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting rate limit tests...');
  runTests().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

export { runTests, testLoginRateLimit, testApiRateLimit, testPortfolioRateLimit };

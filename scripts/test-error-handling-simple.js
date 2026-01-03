/**
 * Simple Error Handling Test
 * 
 * Quick test to verify error handling is working
 */

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, endpoint, options = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    console.log(`\n${name}:`);
    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, JSON.stringify(data, null, 2).split('\n').slice(0, 20).join('\n'));
    
    return { status: response.status, data };
  } catch (error) {
    console.log(`\n${name}: ERROR - ${error.message}`);
    return { status: 0, error: error.message };
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SIMPLE ERROR HANDLING TEST');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Test 1: Validation error (should return 400 with standard format)
  await testEndpoint(
    '1. Validation Error (admin auth - missing password)',
    '/api/admin/auth',
    {
      method: 'POST',
      body: JSON.stringify({ username: 'test' })
    }
  );
  
  // Test 2: Invalid MongoDB ID (should return 400)
  await testEndpoint(
    '2. Invalid MongoDB ID',
    '/api/quests/invalid-id-format'
  );
  
  // Test 3: Valid format but non-existent ID (should return 404)
  await testEndpoint(
    '3. Not Found (valid ID format)',
    '/api/quests/000000000000000000000000'
  );
  
  // Test 4: Success response format
  await testEndpoint(
    '4. Success Response Format',
    '/api/quests'
  );
  
  // Test 5: Authentication error
  await testEndpoint(
    '5. Authentication Error',
    '/api/admin/quests'
  );
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

runTests().catch(console.error);


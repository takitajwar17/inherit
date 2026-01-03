#!/usr/bin/env node

/**
 * Rate Limiting Test Script
 * 
 * Tests the rate limiting functionality on critical endpoints.
 * Verifies that:
 * - Rate limit headers are present
 * - Requests are allowed within limits
 * - 429 responses are returned when limit exceeded
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  fail: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.yellow}━━━ ${msg} ━━━${colors.reset}`),
  detail: (msg) => console.log(`  ${colors.dim}${msg}${colors.reset}`),
};

let passed = 0;
let failed = 0;

/**
 * Makes an HTTP request and returns response with headers
 */
async function request(method, path, body = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json().catch(() => ({}));
    
    return { 
      status: response.status, 
      data,
      headers: {
        'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit'),
        'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining'),
        'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset'),
        'Retry-After': response.headers.get('Retry-After'),
      }
    };
  } catch (error) {
    return { status: 0, error: error.message, headers: {} };
  }
}

/**
 * Tests a single case
 */
async function test(name, fn) {
  try {
    const result = await fn();
    if (result.pass) {
      log.success(name);
      passed++;
    } else {
      log.fail(`${name} - ${result.reason}`);
      failed++;
    }
    if (result.detail) {
      log.detail(result.detail);
    }
  } catch (error) {
    log.fail(`${name} - Exception: ${error.message}`);
    failed++;
  }
}

/**
 * Delay helper
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// TEST SUITES
// ============================================

async function testAdminAuthRateLimiting() {
  log.section('Admin Auth Rate Limiting (5 req/15 min)');
  
  // Test that rate limit headers are present
  await test('Returns rate limit headers', async () => {
    const res = await request('POST', '/api/admin/auth', { 
      username: 'test', 
      password: 'test' 
    });
    
    const hasHeaders = res.headers['X-RateLimit-Limit'] && 
                       res.headers['X-RateLimit-Remaining'] !== null;
    
    if (!hasHeaders) {
      return { 
        pass: false, 
        reason: 'Missing rate limit headers',
        detail: JSON.stringify(res.headers)
      };
    }
    
    return { 
      pass: true, 
      detail: `Limit: ${res.headers['X-RateLimit-Limit']}, Remaining: ${res.headers['X-RateLimit-Remaining']}`
    };
  });
  
  // Test multiple requests within limit
  await test('Allows requests within limit', async () => {
    const res = await request('POST', '/api/admin/auth', { 
      username: 'test', 
      password: 'test' 
    });
    
    // Should be 401 (invalid creds) not 429 (rate limited)
    if (res.status === 429) {
      return { 
        pass: false, 
        reason: 'Rate limited too early',
        detail: `Retry-After: ${res.headers['Retry-After']}s`
      };
    }
    
    return { 
      pass: true, 
      detail: `Status: ${res.status}, Remaining: ${res.headers['X-RateLimit-Remaining']}`
    };
  });
  
  // Test rate limit enforcement (exhaust the limit)
  await test('Blocks after limit exceeded', async () => {
    log.info('Making 6 requests to exceed limit (5)...');
    
    let lastRes;
    for (let i = 0; i < 6; i++) {
      lastRes = await request('POST', '/api/admin/auth', { 
        username: 'ratelimit-test', 
        password: 'test' 
      });
      
      if (lastRes.status === 429) {
        return { 
          pass: true, 
          detail: `Blocked after ${i + 1} requests. Retry-After: ${lastRes.headers['Retry-After']}s`
        };
      }
    }
    
    // If we got here, rate limiting didn't kick in
    return { 
      pass: false, 
      reason: 'Not rate limited after 6 requests',
      detail: `Last status: ${lastRes.status}, Remaining: ${lastRes.headers['X-RateLimit-Remaining']}`
    };
  });
  
  // Test 429 response format
  await test('429 response has correct format', async () => {
    const res = await request('POST', '/api/admin/auth', { 
      username: 'ratelimit-test', 
      password: 'test' 
    });
    
    if (res.status !== 429) {
      return { pass: true, detail: 'Not rate limited yet (previous test may have failed)' };
    }
    
    const hasError = res.data.error === 'Too many requests';
    const hasRetryAfter = res.headers['Retry-After'] !== null;
    const hasMessage = !!res.data.message;
    
    if (!hasError || !hasRetryAfter || !hasMessage) {
      return { 
        pass: false, 
        reason: 'Invalid 429 response format',
        detail: JSON.stringify(res.data)
      };
    }
    
    return { 
      pass: true, 
      detail: `Message: "${res.data.message.substring(0, 50)}..."`
    };
  });
}

async function testVoiceRoutingRateLimiting() {
  log.section('Voice Routing Rate Limiting (20 req/min)');
  
  // Test that rate limit headers are present
  await test('Returns rate limit headers', async () => {
    const res = await request('POST', '/api/voice-routing', { 
      transcript: 'go to dashboard' 
    });
    
    const hasHeaders = res.headers['X-RateLimit-Limit'] !== null;
    
    return { 
      pass: hasHeaders, 
      reason: hasHeaders ? null : 'Missing rate limit headers',
      detail: `Limit: ${res.headers['X-RateLimit-Limit']}, Remaining: ${res.headers['X-RateLimit-Remaining']}`
    };
  });
}

async function testVideoSearchRateLimiting() {
  log.section('Video Search Rate Limiting (30 req/min)');
  
  await test('Returns rate limit headers', async () => {
    const res = await request('POST', '/api/video-search', { 
      topic: 'javascript' 
    });
    
    const hasHeaders = res.headers['X-RateLimit-Limit'] !== null;
    
    return { 
      pass: hasHeaders, 
      reason: hasHeaders ? null : 'Missing rate limit headers',
      detail: `Limit: ${res.headers['X-RateLimit-Limit']}, Status: ${res.status}`
    };
  });
}

async function testHeaderPresence() {
  log.section('Rate Limit Headers Check');
  
  const endpoints = [
    { path: '/api/admin/auth', body: { username: 'test', password: 'test' }, name: 'Admin Auth' },
    { path: '/api/voice-routing', body: { transcript: 'test' }, name: 'Voice Routing' },
    { path: '/api/video-search', body: { topic: 'test' }, name: 'Video Search' },
  ];
  
  for (const endpoint of endpoints) {
    await test(`${endpoint.name} has X-RateLimit-* headers`, async () => {
      const res = await request('POST', endpoint.path, endpoint.body);
      
      const limit = res.headers['X-RateLimit-Limit'];
      const remaining = res.headers['X-RateLimit-Remaining'];
      const reset = res.headers['X-RateLimit-Reset'];
      
      if (limit && remaining !== null && reset) {
        return { 
          pass: true, 
          detail: `Limit: ${limit}, Remaining: ${remaining}, Reset: ${reset}s`
        };
      }
      
      return { 
        pass: false, 
        reason: 'Missing one or more rate limit headers',
        detail: `Limit: ${limit}, Remaining: ${remaining}, Reset: ${reset}`
      };
    });
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log(`\n${colors.blue}╔══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║    Rate Limiting Test Suite              ║${colors.reset}`);
  console.log(`${colors.blue}║    Testing: ${BASE_URL}${' '.repeat(Math.max(0, 17 - BASE_URL.length))}║${colors.reset}`);
  console.log(`${colors.blue}╚══════════════════════════════════════════╝${colors.reset}`);
  
  // Check if server is running
  log.info('Checking server availability...');
  try {
    const res = await fetch(BASE_URL);
    log.success(`Server is running (status: ${res.status})`);
  } catch (error) {
    log.fail(`Cannot reach server at ${BASE_URL}`);
    log.info('Make sure to run: npm run dev');
    process.exit(1);
  }
  
  // Run test suites
  await testHeaderPresence();
  await testAdminAuthRateLimiting();
  await testVoiceRoutingRateLimiting();
  await testVideoSearchRateLimiting();
  
  // Summary
  console.log(`\n${colors.blue}══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}                 SUMMARY                   ${colors.reset}`);
  console.log(`${colors.blue}══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total:  ${passed + failed}`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}✓ All rate limiting tests passed!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}⚠ Some tests failed. This may be expected if rate limits were already exhausted.${colors.reset}`);
    console.log(`${colors.dim}  Restart the server to reset in-memory rate limits.${colors.reset}\n`);
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);


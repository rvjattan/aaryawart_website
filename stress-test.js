const http = require('http');
const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const BASE_URL = 'http://localhost:3000';
let testResults = {
  passed: 0,
  failed: 0,
  blocked: 0,
  tests: [],
};

// Utility: Make HTTP request
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      timeout: 5000,
    };

    if (body) {
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 0,
        error: 'timeout',
      });
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

// Test logger
function logTest(name, passed, details = '') {
  const status = passed
    ? `${colors.green}✓ PASS${colors.reset}`
    : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`\n${status} - ${name}`);
  if (details) console.log(`  ${colors.cyan}${details}${colors.reset}`);

  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

// Test logger for blocked (security working)
function logBlocked(name, details = '') {
  console.log(`\n${colors.green}✓ BLOCKED${colors.reset} - ${name}`);
  console.log(`  ${colors.cyan}${details}${colors.reset}`);
  testResults.tests.push({ name, blocked: true, details });
  testResults.blocked++;
}

async function runStressTests() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║       BRUTAL SECURITY & STRESS TEST SUITE                  ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // ====== RATE LIMITING TESTS ======
  console.log(`\n${colors.yellow}[TEST SUITE 1: RATE LIMITING]${colors.reset}`);

  // Test 1.1: Rapid login attempts
  console.log('\nAttempting 10 rapid login requests...');
  let blockedCount = 0;
  const loginPromises = [];
  for (let i = 0; i < 10; i++) {
    loginPromises.push(
      makeRequest('POST', '/admin/login', {
        username: 'attacker',
        password: 'wrong',
      })
    );
  }

  const loginResults = await Promise.all(loginPromises);
  blockedCount = loginResults.filter((r) => r.status === 429).length;
  logTest(
    'Rate limiting on login endpoints',
    blockedCount > 0,
    `${blockedCount}/10 requests rate-limited (429 Too Many Requests)`
  );

  // Test 1.2: Rapid API requests
  console.log('\nAttempting 20 rapid /api/volunteers requests...');
  const apiPromises = [];
  for (let i = 0; i < 20; i++) {
    apiPromises.push(makeRequest('POST', '/api/volunteers', { name: 'Test' }));
  }

  const apiResults = await Promise.all(apiPromises);
  const apiBlockedCount = apiResults.filter((r) => r.status === 429).length;
  logTest(
    'Rate limiting on API endpoints',
    apiBlockedCount > 0,
    `${apiBlockedCount}/20 requests rate-limited`
  );

  // ====== INPUT VALIDATION TESTS ======
  console.log(`\n${colors.yellow}[TEST SUITE 2: INPUT VALIDATION]${colors.reset}`);

  // Test 2.1: Oversized name field
  const largeName = 'a'.repeat(500);
  const oversizedNameReq = await makeRequest('POST', '/api/volunteers', {
    name: largeName,
    email: 'test@example.com',
    phone: '1234567890',
    state: 'Test',
    city: 'Test',
  });
  logTest(
    'Rejection of oversized name field (>100 chars)',
    oversizedNameReq.status !== 200 && oversizedNameReq.status !== 201,
    `Status: ${oversizedNameReq.status}`
  );

  // Test 2.2: Oversized email field
  const largeEmail = 'a'.repeat(300) + '@example.com';
  const emailReq = await makeRequest('POST', '/api/volunteers', {
    name: 'Test User',
    email: largeEmail,
    phone: '1234567890',
    state: 'Test',
    city: 'Test',
  });
  logTest(
    'Rejection of oversized email field (>254 chars)',
    emailReq.status !== 200 && emailReq.status !== 201,
    `Status: ${emailReq.status}`
  );

  // Test 2.3: Invalid phone format
  const invalidPhoneReq = await makeRequest('POST', '/api/volunteers', {
    name: 'Test User',
    email: 'test@example.com',
    phone: 'not-a-phone',
    state: 'Test',
    city: 'Test',
  });
  logTest(
    'Rejection of invalid phone format',
    invalidPhoneReq.status !== 200 && invalidPhoneReq.status !== 201,
    `Status: ${invalidPhoneReq.status}`
  );

  // Test 2.4: Invalid email format
  const invalidEmailReq = await makeRequest('POST', '/api/volunteers', {
    name: 'Test User',
    email: 'not-an-email',
    phone: '1234567890',
    state: 'Test',
    city: 'Test',
  });
  logTest(
    'Rejection of invalid email format',
    invalidEmailReq.status !== 200 && invalidEmailReq.status !== 201,
    `Status: ${invalidEmailReq.status}`
  );

  // ====== SQL INJECTION TESTS ======
  console.log(`\n${colors.yellow}[TEST SUITE 3: SQL INJECTION PREVENTION]${colors.reset}`);

  // Test 3.1: SQL injection in volunteer search
  const sqlInjectionReq = await makeRequest('GET', "/api/volunteers?search='; DROP TABLE volunteers; --");
  logTest(
    'SQL injection prevention (search parameter)',
    sqlInjectionReq.status !== 500,
    `Status: ${sqlInjectionReq.status} - No server error`
  );

  // Test 3.2: SQL injection in testimonial filter
  const sqlInjectionReq2 = await makeRequest('GET', "/api/testimonials?status=approved' OR '1'='1");
  logTest(
    'SQL injection prevention (filter parameter)',
    sqlInjectionReq2.status !== 500,
    `Status: ${sqlInjectionReq2.status} - No server error`
  );

  // ====== XSS PREVENTION TESTS ======
  console.log(`\n${colors.yellow}[TEST SUITE 4: XSS PREVENTION]${colors.reset}`);

  // Test 4.1: Script injection in volunteer name
  const xssReq1 = await makeRequest('POST', '/api/volunteers', {
    name: '<script>alert("XSS")</script>',
    email: 'test@example.com',
    phone: '1234567890',
    state: 'Test',
    city: 'Test',
  });
  logTest(
    'XSS prevention in volunteer submission',
    xssReq1.status === 400 || xssReq1.status === 422,
    `Status: ${xssReq1.status} - Request validation working`
  );

  // Test 4.2: Event handler injection
  const xssReq2 = await makeRequest('POST', '/api/testimonials', {
    name: 'Test',
    message: '<img src=x onerror="alert(1)">',
  });
  logTest(
    'XSS prevention with event handlers',
    xssReq2.status === 400 || xssReq2.status === 422,
    `Status: ${xssReq2.status} - Request validation working`
  );

  // Test 4.3: HTML entity injection
  const xssReq3 = await makeRequest('POST', '/api/volunteers', {
    name: '&lt;script&gt;alert("XSS")&lt;/script&gt;',
    email: 'test@example.com',
    phone: '1234567890',
    state: 'Test',
    city: 'Test',
  });
  logTest(
    'HTML entity handling',
    xssReq3.status !== 500,
    `Status: ${xssReq3.status} - No server error`
  );

  // ====== CSRF PROTECTION TESTS ======
  console.log(`${colors.yellow}[TEST SUITE 5: CSRF PROTECTION]${colors.reset}`);

  // Test 5.1: Missing CSRF token on admin POST
  const noCsrfReq = await makeRequest('POST', '/admin/dashboard', {
    action: 'test',
  });
  logTest(
    'CSRF token requirement on admin POST',
    noCsrfReq.status === 403 || noCsrfReq.status === 401,
    `Status: ${noCsrfReq.status} - CSRF protection active`
  );

  // Test 5.2: Invalid CSRF token
  const invalidCsrfReq = await makeRequest('POST', '/admin/dashboard', {
    _csrf: 'invalid-token-xyz',
    action: 'test',
  });
  logTest(
    'Invalid CSRF token rejection',
    invalidCsrfReq.status === 403,
    `Status: ${invalidCsrfReq.status} - Invalid token rejected`
  );

  // ====== OBJECT INJECTION TESTS ======
  console.log(`${colors.yellow}[TEST SUITE 6: OBJECT INJECTION PREVENTION]${colors.reset}`);

  // Test 6.1: Attempt to inject prototype pollution fields
  const objectInjectionReq = await makeRequest('POST', '/api/volunteers', {
    name: 'Test',
    email: 'test@example.com',
    phone: '1234567890',
    state: 'Test',
    city: 'Test',
    '__proto__': { isAdmin: true },
    'constructor': { prototype: { isAdmin: true } },
  });
  logTest(
    'Prototype pollution prevention',
    objectInjectionReq.status !== 500,
    `Status: ${objectInjectionReq.status} - No vulnerability exploited`
  );

  // ====== OPEN REDIRECT TESTS ======
  console.log(`${colors.yellow}[TEST SUITE 7: OPEN REDIRECT PREVENTION]${colors.reset}`);

  // Test 7.1: Invalid redirect parameter
  const redirectReq = await makeRequest('GET', '/admin/testimonials?status=invalid_value&redirect=https://evil.com');
  logTest(
    'Invalid parameter sanitization',
    redirectReq.status !== 301 && redirectReq.status !== 302,
    `Status: ${redirectReq.status} - No redirect to invalid parameter value`
  );

  // ====== BODY SIZE LIMIT TESTS ======
  console.log(`${colors.yellow}[TEST SUITE 8: PAYLOAD SIZE LIMITS]${colors.reset}`);

  // Test 8.1: Oversized JSON body
  const largeBody = {
    data: 'x'.repeat(100000), // 100KB
  };
  const oversizedReq = await makeRequest('POST', '/api/testimonials', largeBody);
  logTest(
    'Large JSON payload rejection',
    oversizedReq.status === 413 || oversizedReq.status === 400,
    `Status: ${oversizedReq.status} - Oversized payload rejected`
  );

  // Test 8.2: Form data size limit
  const largeFormBody = 'data=' + 'x'.repeat(100000);
  const oversizedFormReq = await makeRequest('POST', '/api/contact', largeFormBody, {
    'Content-Type': 'application/x-www-form-urlencoded',
  });
  logTest(
    'Large form payload rejection',
    oversizedFormReq.status === 413 || oversizedFormReq.status === 400,
    `Status: ${oversizedFormReq.status} - Oversized form rejected`
  );

  // ====== CONCURRENT REQUEST TESTS ======
  console.log(`${colors.yellow}[TEST SUITE 9: CONCURRENT LOAD HANDLING]${colors.reset}`);

  // Test 9.1: 50 concurrent requests
  console.log('\nSending 50 concurrent requests...');
  const concurrentPromises = [];
  for (let i = 0; i < 50; i++) {
    concurrentPromises.push(makeRequest('GET', '/'));
  }

  const concurrentResults = await Promise.all(concurrentPromises);
  const successCount = concurrentResults.filter((r) => r.status === 200 || r.status === 404).length;
  logTest(
    'Handling 50 concurrent requests',
    successCount >= 40,
    `${successCount}/50 requests processed (no crashes expected)`
  );

  // ====== AUTHENTICATION TESTS ======
  console.log(`${colors.yellow}[TEST SUITE 10: AUTHENTICATION]${colors.reset}`);

  // Test 10.1: Missing authentication on protected endpoints
  const noAuthReq = await makeRequest('GET', '/admin/dashboard');
  logTest(
    'Authentication required for admin endpoints',
    noAuthReq.status === 302 || noAuthReq.status === 401,
    `Status: ${noAuthReq.status} - Protected endpoint`
  );

  // Test 10.2: Invalid JWT token
  const invalidAuthReq = await makeRequest('GET', '/admin/dashboard', null, {
    'Authorization': 'Bearer invalid.jwt.token',
  });
  logTest(
    'Invalid JWT token rejection',
    invalidAuthReq.status === 302 || invalidAuthReq.status === 401,
    `Status: ${invalidAuthReq.status} - Invalid token rejected`
  );

  // ====== SUMMARY ======
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║                    TEST RESULTS SUMMARY                    ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  console.log(`\n${colors.green}Passed:${colors.reset}   ${testResults.passed}`);
  console.log(`${colors.red}Failed:${colors.reset}   ${testResults.failed}`);
  console.log(`${colors.green}Blocked (Security):${colors.reset}  ${testResults.blocked}`);
  console.log(`\nTotal Tests: ${testResults.passed + testResults.failed + testResults.blocked}`);

  const passRate = Math.round(
    ((testResults.passed + testResults.blocked) / (testResults.passed + testResults.failed + testResults.blocked)) * 100
  );
  console.log(`Pass Rate: ${passRate}%\n`);

  if (testResults.failed === 0) {
    console.log(`${colors.green}✓ ALL SECURITY MEASURES FUNCTIONAL!${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ SOME TESTS FAILED - REVIEW ABOVE${colors.reset}`);
  }

  console.log(`\n${colors.blue}Stress test complete.${colors.reset}\n`);

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runStressTests().catch((err) => {
  console.error(`${colors.red}Error running tests: ${err.message}${colors.reset}`);
  process.exit(1);
});

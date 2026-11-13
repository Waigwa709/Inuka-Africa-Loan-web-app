/**
 * API-level integration tests for the Inuka Africa backend.
 *
 * These tests run against an ISOLATED test database (`inukaloanapp_test`),
 * never against the assessment database. The test database is created from
 * database/schema.sql and dropped again when the suite finishes.
 *
 * Covered scenarios include the three mandatory assessment tests:
 *   1. Successful repayment balance math (10,000 -> 3,000 -> 7,000 outstanding)
 *   2. Duplicate payment reference rejection
 *   3. Overpayment rejection
 * plus validation, authentication, transaction/concurrency, and AI fallback tests.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const TEST_DB = 'inukaloanapp_test';

// ---------------------------------------------------------------------------
// Environment must be configured BEFORE importing the app (db.ts reads env).
// ---------------------------------------------------------------------------
function testDatabaseUrl(): string {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error('DATABASE_URL is required to run API tests.');
  const u = new URL(base);
  u.pathname = `/${TEST_DB}`;
  return u.toString();
}

function adminDatabaseUrl(): string {
  const u = new URL(process.env.DATABASE_URL as string);
  u.pathname = '/';
  return u.toString();
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

async function main() {
  console.log('\n======================================================');
  console.log(' INUKA AFRICA - API INTEGRATION TEST SUITE');
  console.log(' (isolated test database: ' + TEST_DB + ')');
  console.log('======================================================\n');

  // 1. Create the isolated test database.
  const mysql = await import('mysql2/promise');
  const admin = mysql.createPool(adminDatabaseUrl());
  await admin.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
  await admin.query(`CREATE DATABASE \`${TEST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.end();

  // 2. Point the app at the test database and import it.
  process.env.DATABASE_URL = testDatabaseUrl();
  process.env.NODE_ENV = 'test';
  process.env.AUTH_SECRET = 'test-secret-key-for-api-tests';

  const { app } = await import('../server');
  const { ensureUsersTable } = await import('../src/lib/server-auth');
  const pool = (await import('../src/lib/db')).default;

  // 3. Apply schema (strip CREATE DATABASE / USE statements).
  const schemaSql = fs.readFileSync(path.join(process.cwd(), 'database', 'schema.sql'), 'utf8');
  const withoutComments = schemaSql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
  const statements = withoutComments
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^CREATE DATABASE/i.test(s) && !/^USE /i.test(s));
  for (const stmt of statements) {
    await pool.query(stmt);
  }
  await ensureUsersTable();

  // 4. Start the app on an ephemeral port.
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const port = (server.address() as any).port;
  const base = `http://127.0.0.1:${port}`;

  const api = async (method: string, p: string, body?: any, token?: string) => {
    const res = await fetch(`${base}${p}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      /* no body */
    }
    return { status: res.status, body: json };
  };

  try {
    // ------------------------------------------------------------------
    // Authentication
    // ------------------------------------------------------------------
    console.log('1. Authentication:');

    const noAuth = await api('GET', '/api/clients');
    assert(noAuth.status === 401, 'Unauthenticated request to /api/clients is rejected with 401');

    const badLogin = await api('POST', '/api/auth/login', { email: 'a@b.com', password: 'wrongpass1' });
    assert(badLogin.status === 401, 'Login with wrong password returns 401');

    const reg = await api('POST', '/api/auth/register', {
      email: 'admin@test.local',
      password: 'testpassword123',
      fullName: 'Test Admin',
    });
    assert(reg.status === 201 && !!reg.body.token, 'First-run registration creates admin and returns token');
    const token: string = reg.body.token;

    const regAgain = await api('POST', '/api/auth/register', {
      email: 'second@test.local',
      password: 'testpassword123',
      fullName: 'Second User',
    });
    assert(regAgain.status === 403, 'Registration is closed after the first admin exists');

    const me = await api('GET', '/api/auth/me', undefined, token);
    assert(me.status === 200 && me.body.user.email === 'admin@test.local', 'Authenticated /api/auth/me returns the user');

    // ------------------------------------------------------------------
    // Fixtures: client + loan with total amount due KES 10,000
    // ------------------------------------------------------------------
    console.log('\n2. Fixtures:');

    const clientRes = await api('POST', '/api/clients', {
      clientNumber: 'TST-C-001',
      fullName: 'Test Borrower',
      phone: '+254700000001',
      email: 'borrower@test.local',
    }, token);
    assert(clientRes.status === 201, 'Client registration succeeds');
    const clientId = clientRes.body.id;

    const dupClient = await api('POST', '/api/clients', {
      clientNumber: 'TST-C-001',
      fullName: 'Duplicate',
    }, token);
    assert(dupClient.status === 409, 'Duplicate client number rejected with 409');

    const badEmail = await api('POST', '/api/clients', {
      clientNumber: 'TST-C-002',
      fullName: 'Bad Email',
      email: 'not-an-email',
    }, token);
    assert(badEmail.status === 400, 'Invalid email format rejected with 400');

    const loanRes = await api('POST', '/api/loans', {
      clientId,
      loanAmount: 10000,
      totalAmountDue: 10000,
      purpose: 'Test loan',
    }, token);
    assert(loanRes.status === 201, 'Loan creation succeeds');
    const loanId = loanRes.body.id;

    const negLoan = await api('POST', '/api/loans', {
      clientId,
      loanAmount: -500,
      totalAmountDue: -400,
    }, token);
    assert(negLoan.status === 400, 'Loan with negative amounts rejected with 400');

    const lowDue = await api('POST', '/api/loans', {
      clientId,
      loanAmount: 5000,
      totalAmountDue: 4000,
    }, token);
    assert(lowDue.status === 400, 'Loan where total due < principal rejected with 400');

    const badClientLoan = await api('POST', '/api/loans', {
      clientId: 'cli-does-not-exist',
      loanAmount: 1000,
      totalAmountDue: 1100,
    }, token);
    assert(badClientLoan.status === 404, 'Loan for non-existent client returns 404');

    // ------------------------------------------------------------------
    // MANDATORY TEST 1: Successful repayment (10,000 -> 3,000 -> 7,000)
    // ------------------------------------------------------------------
    console.log('\n3. Mandatory Test 1 - Successful repayment:');

    const rep1 = await api('POST', '/api/repayments', {
      loanId,
      amount: 3000,
      paymentReference: 'PAY-001',
      paymentDate: '2026-11-01',
      paymentMethod: 'M-Pesa',
    }, token);
    assert(rep1.status === 201, 'Repayment of KES 3,000 accepted with 201');
    assert(Math.abs(rep1.body.outstanding_balance - 7000) < 0.01, 'Outstanding balance after repayment is KES 7,000', `got ${rep1.body.outstanding_balance}`);

    const loanAfter1 = await api('GET', `/api/loans/${loanId}`, undefined, token);
    assert(Math.abs(loanAfter1.body.outstanding_balance - 7000) < 0.01, 'GET /api/loans/:id confirms outstanding KES 7,000');
    assert(loanAfter1.body.status === 'Partially Paid', 'Loan status is Partially Paid');

    // ------------------------------------------------------------------
    // MANDATORY TEST 2: Duplicate payment reference
    // ------------------------------------------------------------------
    console.log('\n4. Mandatory Test 2 - Duplicate reference:');

    const repsBefore = (await api('GET', '/api/repayments', undefined, token)).body.length;
    const dupRep = await api('POST', '/api/repayments', {
      loanId,
      amount: 100,
      paymentReference: 'PAY-001',
      paymentDate: '2026-11-02',
    }, token);
    assert(dupRep.status === 409, 'Duplicate payment reference rejected with 409');
    const repsAfter = (await api('GET', '/api/repayments', undefined, token)).body.length;
    assert(repsAfter === repsBefore, 'No additional repayment inserted for duplicate reference');
    const loanAfterDup = await api('GET', `/api/loans/${loanId}`, undefined, token);
    assert(Math.abs(loanAfterDup.body.outstanding_balance - 7000) < 0.01, 'Outstanding balance unchanged after duplicate attempt');

    // ------------------------------------------------------------------
    // MANDATORY TEST 3: Overpayment rejection
    // ------------------------------------------------------------------
    console.log('\n5. Mandatory Test 3 - Overpayment rejection:');

    const overpay = await api('POST', '/api/repayments', {
      loanId,
      amount: 8000,
      paymentReference: 'PAY-OVER',
      paymentDate: '2026-11-03',
    }, token);
    assert(overpay.status === 400, 'Overpayment (8,000 > 7,000 outstanding) rejected with 400');
    const loanAfterOver = await api('GET', `/api/loans/${loanId}`, undefined, token);
    assert(Math.abs(loanAfterOver.body.outstanding_balance - 7000) < 0.01, 'Outstanding balance remains KES 7,000 after overpayment attempt');

    // ------------------------------------------------------------------
    // Additional validation tests
    // ------------------------------------------------------------------
    console.log('\n6. Repayment validation:');

    const cases: Array<[string, any, number]> = [
      ['zero amount', { loanId, amount: 0, paymentReference: 'V-1', paymentDate: '2026-11-01' }, 400],
      ['negative amount', { loanId, amount: -100, paymentReference: 'V-2', paymentDate: '2026-11-01' }, 400],
      ['non-numeric amount', { loanId, amount: 'abc', paymentReference: 'V-3', paymentDate: '2026-11-01' }, 400],
      ['missing amount', { loanId, paymentReference: 'V-4', paymentDate: '2026-11-01' }, 400],
      ['missing reference', { loanId, amount: 100, paymentDate: '2026-11-01' }, 400],
      ['empty reference', { loanId, amount: 100, paymentReference: '   ', paymentDate: '2026-11-01' }, 400],
      ['invalid date', { loanId, amount: 100, paymentReference: 'V-5', paymentDate: 'not-a-date' }, 400],
      ['missing loan id', { amount: 100, paymentReference: 'V-6', paymentDate: '2026-11-01' }, 400],
    ];
    for (const [name, body, expected] of cases) {
      const r = await api('POST', '/api/repayments', body, token);
      assert(r.status === expected, `${name} rejected with ${expected}`, `got ${r.status}`);
    }

    const badLoan = await api('POST', '/api/repayments', {
      loanId: 'loan-nope',
      amount: 100,
      paymentReference: 'V-7',
      paymentDate: '2026-11-01',
    }, token);
    assert(badLoan.status === 404, 'Repayment for non-existent loan returns 404');

    // ------------------------------------------------------------------
    // Multiple repayments + fully repaid loan
    // ------------------------------------------------------------------
    console.log('\n7. Multiple repayments and full settlement:');

    const rep2 = await api('POST', '/api/repayments', {
      loanId, amount: 4000, paymentReference: 'PAY-002', paymentDate: '2026-11-05',
    }, token);
    assert(rep2.status === 201 && Math.abs(rep2.body.outstanding_balance - 3000) < 0.01, 'Second repayment of 4,000 leaves KES 3,000 outstanding');

    const rep3 = await api('POST', '/api/repayments', {
      loanId, amount: 3000, paymentReference: 'PAY-003', paymentDate: '2026-11-10',
    }, token);
    assert(rep3.status === 201 && Math.abs(rep3.body.outstanding_balance - 0) < 0.01, 'Final repayment settles the loan (outstanding 0)');

    const loanFull = await api('GET', `/api/loans/${loanId}`, undefined, token);
    assert(loanFull.body.status === 'Fully Paid', 'Loan status is Fully Paid');

    const repAfterFull = await api('POST', '/api/repayments', {
      loanId, amount: 1, paymentReference: 'PAY-004', paymentDate: '2026-11-11',
    }, token);
    assert(repAfterFull.status === 400, 'Repayment on fully paid loan rejected with 400');

    // ------------------------------------------------------------------
    // Concurrency: two simultaneous repayments cannot overpay
    // ------------------------------------------------------------------
    console.log('\n8. Transaction concurrency:');

    // New loan with 5,000 outstanding; two concurrent 4,000 repayments.
    const loan2Res = await api('POST', '/api/loans', {
      clientId, loanAmount: 5000, totalAmountDue: 5000, purpose: 'Concurrency test',
    }, token);
    const loan2Id = loan2Res.body.id;

    const [c1, c2] = await Promise.all([
      api('POST', '/api/repayments', { loanId: loan2Id, amount: 4000, paymentReference: 'CONC-1', paymentDate: '2026-11-12' }, token),
      api('POST', '/api/repayments', { loanId: loan2Id, amount: 4000, paymentReference: 'CONC-2', paymentDate: '2026-11-12' }, token),
    ]);
    const successes = [c1, c2].filter((r) => r.status === 201).length;
    const failures = [c1, c2].filter((r) => r.status === 400).length;
    assert(successes === 1 && failures === 1, 'Exactly one of two concurrent overpayments succeeds', `statuses: ${c1.status}, ${c2.status}`);

    const loan2After = await api('GET', `/api/loans/${loan2Id}`, undefined, token);
    assert(Math.abs(loan2After.body.outstanding_balance - 1000) < 0.01, 'Outstanding balance is exactly KES 1,000 (never negative)', `got ${loan2After.body.outstanding_balance}`);

    // ------------------------------------------------------------------
    // AI fallback with server-side context
    // ------------------------------------------------------------------
    console.log('\n9. AI fallback (server-side verified context):');

    const aiChat = await api('POST', '/api/ai/chat', {
      question: 'What is the total outstanding loan balance?',
    }, token);
    assert(aiChat.status === 200, 'AI chat endpoint responds');
    const answer: string = aiChat.body.answer || '';
    // Outstanding = loan2 (1,000) + loan1 (0) = 1,000
    assert(answer.includes('1,000') || answer.includes('1000'), 'AI answer cites the verified outstanding balance of KES 1,000', answer.slice(0, 120));
    assert(!answer.toLowerCase().includes('zero outstanding'), 'AI answer does NOT falsely claim zero outstanding balance');

    const aiChatNoAuth = await api('POST', '/api/ai/chat', { question: 'test?' });
    assert(aiChatNoAuth.status === 401, 'AI endpoint requires authentication');

    // ------------------------------------------------------------------
    // Portfolio consistency
    // ------------------------------------------------------------------
    console.log('\n10. Portfolio consistency:');

    const portfolio = await api('GET', '/api/portfolio', undefined, token);
    assert(portfolio.status === 200, 'Portfolio endpoint responds');
    assert(Number(portfolio.body.total_clients) === 1, 'Portfolio counts 1 client');
    assert(Number(portfolio.body.total_loans) === 2, 'Portfolio counts 2 loans');
    assert(Math.abs(Number(portfolio.body.total_repaid) - 14000) < 0.01, 'Portfolio total repaid is KES 14,000', `got ${portfolio.body.total_repaid}`);
    assert(Math.abs(Number(portfolio.body.total_outstanding) - 1000) < 0.01, 'Portfolio outstanding is KES 1,000', `got ${portfolio.body.total_outstanding}`);

    console.log('\n======================================================');
    console.log(` TEST SUMMARY: ${passedTests} PASSED / ${failedTests} FAILED (${totalTests} total)`);
    console.log('======================================================\n');
  } finally {
    server.close();
    await pool.end();
    // Drop the isolated test database.
    const admin2 = mysql.createPool(adminDatabaseUrl());
    await admin2.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
    await admin2.end();
    console.log(`Test database ${TEST_DB} dropped.`);
  }

  if (failedTests > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error during API test execution:', err);
  process.exit(1);
});

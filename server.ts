import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { aiService } from './src/lib/ai/ai-service';
import pool from './src/lib/db';
import {
  authenticate,
  countUsers,
  createUser,
  ensureUsersTable,
  issueToken,
  verifyToken,
  AuthUser,
} from './src/lib/server-auth';
import { buildFinancialContext, buildLoanRiskAssessment } from './src/lib/ai-context';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

// ---------------------------------------------------------------------------
// Security middleware
// ---------------------------------------------------------------------------

app.disable('x-powered-by');

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(express.json({ limit: '1mb' }));

// Simple in-memory sliding-window rate limiter (per client IP).
function rateLimit(windowMs: number, max: number) {
  const hits = new Map<string, number[]>();
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }
    arr.push(now);
    hits.set(key, arr);
    next();
  };
}

const authRateLimit = rateLimit(15 * 60 * 1000, 20); // 20 auth attempts / 15 min
const aiRateLimit = rateLimit(60 * 1000, 30); // 30 AI calls / min
const apiRateLimit = rateLimit(60 * 1000, 300); // 300 API calls / min

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isNonEmptyString = (v: any): v is string => typeof v === 'string' && v.trim().length > 0;

const isValidAmount = (v: any): boolean => {
  if (v === null || v === undefined || v === '') return false;
  const n = Number(v);
  return Number.isFinite(n) && n > 0;
};

const isValidDateString = (v: any): boolean => typeof v === 'string' && v.trim().length > 0 && !isNaN(Date.parse(v));

// Financial comparisons are done in integer cents to avoid floating-point drift.
const toCents = (v: any): number => Math.round(Number(v) * 100);

const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

// Sanitized error responses: details are logged server-side only.
function serverError(res: Response, context: string, err: any) {
  console.error(`[${context}]`, err);
  res.status(500).json({ error: 'An unexpected server error occurred. Please try again.' });
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = token ? verifyToken(token) : null;
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  (req as any).user = user as AuthUser;
  next();
}

app.post('/api/auth/login', authRateLimit, asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }
  const result = await authenticate(email, password);
  if (!result) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }
  res.json({ user: result.user, token: result.token });
}));

// First-run setup: registration is only open while no users exist.
app.post('/api/auth/register', authRateLimit, asyncHandler(async (req, res) => {
  const { email, password, fullName, phone } = req.body || {};
  if ((await countUsers()) > 0) {
    res.status(403).json({ error: 'Registration is closed. Contact your administrator.' });
    return;
  }
  if (!isNonEmptyString(email) || !EMAIL_RE.test(email.trim())) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }
  if (!isNonEmptyString(password) || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters.' });
    return;
  }
  if (!isNonEmptyString(fullName)) {
    res.status(400).json({ error: 'Full name is required.' });
    return;
  }
  const user = await createUser(email, password, fullName, phone, 'admin');
  res.status(201).json({ user, token: issueToken(user) });
}));

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: (req as any).user });
});

app.post('/api/auth/logout', requireAuth, (_req, res) => {
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    institution: 'Inuka Africa Limited',
    system: 'Microfinance Loan Repayment Tracker with AI Integration',
    aiProvider: aiService.activeProviderName,
    aiModel: aiService.activeModelName,
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// AI endpoints — financial context is ALWAYS built server-side from MySQL.
// Client-supplied contextData is ignored for financial totals.
// ---------------------------------------------------------------------------

app.post('/api/ai/chat', requireAuth, aiRateLimit, asyncHandler(async (req, res) => {
  const { question, history } = req.body || {};
  if (!isNonEmptyString(question)) {
    res.status(400).json({ error: 'Question is required as a string.' });
    return;
  }
  const context = await buildFinancialContext();
  const response = await aiService.askQuestion({
    question,
    history,
    contextData: { metrics: context.metrics, insights: context.insights },
  });
  // Best-effort audit logging into ai_interactions (never blocks the response).
  pool.query(
    'INSERT INTO ai_interactions (id, question, intent, response, model, verified_data_json) VALUES (?, ?, ?, ?, ?, ?)',
    [
      `ai-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      question.slice(0, 2000),
      response.intent || null,
      response.answer.slice(0, 8000),
      response.model || aiService.activeModelName,
      JSON.stringify(response.verifiedMetricsUsed || {}),
    ]
  ).catch((e) => console.warn('[ai_interactions log failed]', e.message));
  res.json(response);
}));

app.post('/api/ai/reports', requireAuth, aiRateLimit, asyncHandler(async (req, res) => {
  const { reportType, period } = req.body || {};
  const allowedReportTypes = ['portfolio-performance', 'monthly-collections', 'outstanding-loans', 'executive-summary'];
  if (!isNonEmptyString(reportType) || !allowedReportTypes.includes(reportType)) {
    res.status(400).json({ error: `reportType must be one of: ${allowedReportTypes.join(', ')}.` });
    return;
  }
  if (!isNonEmptyString(period)) {
    res.status(400).json({ error: 'period is required.' });
    return;
  }
  const context = await buildFinancialContext();
  const report = await aiService.generateReport({
    reportType: reportType as any,
    period,
    contextData: {
      metrics: context.metrics,
      insights: context.insights,
      flaggedLoansCount: context.riskSummary.highAttentionCount + context.riskSummary.mediumAttentionCount,
    },
  });
  pool.query(
    'INSERT INTO ai_reports (id, report_type, period, title, content_json) VALUES (?, ?, ?, ?, ?)',
    [
      `rep-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      reportType,
      period,
      report.title,
      JSON.stringify(report),
    ]
  ).catch((e) => console.warn('[ai_reports log failed]', e.message));
  res.json(report);
}));

app.post('/api/ai/risk-analysis', requireAuth, aiRateLimit, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const loanId = isNonEmptyString(body.loanId) ? body.loanId : body.assessment?.loanId;
  if (!isNonEmptyString(loanId)) {
    res.status(400).json({ error: 'loanId is required.' });
    return;
  }
  // Recompute the assessment from the database — never trust client payloads.
  const assessment = await buildLoanRiskAssessment(loanId);
  if (!assessment) {
    res.status(404).json({ error: 'Loan not found.' });
    return;
  }
  const explanation = await aiService.explainRisk({ assessment });
  res.json(explanation);
}));

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

app.get('/api/clients', requireAuth, apiRateLimit, asyncHandler(async (_req, res) => {
  const [clients] = await pool.query(`
    SELECT
      c.*,
      COUNT(DISTINCT l.id) as loans_count,
      COALESCE(SUM(l.loan_amount), 0) as total_borrowed,
      COALESCE(SUM(r.total_repaid), 0) as total_repaid,
      COALESCE(SUM(GREATEST(0, l.total_amount_due - COALESCE(r.total_repaid, 0))), 0) as outstanding_balance
    FROM clients c
    LEFT JOIN loans l ON c.id = l.client_id
    LEFT JOIN (
      SELECT loan_id, SUM(amount) as total_repaid
      FROM repayments
      GROUP BY loan_id
    ) r ON l.id = r.loan_id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `);
  res.json(clients);
}));

app.post('/api/clients', requireAuth, apiRateLimit, asyncHandler(async (req, res) => {
  const { clientNumber, fullName, phone, email, location, notes } = req.body || {};

  if (!isNonEmptyString(clientNumber)) {
    res.status(400).json({ error: 'Client number is required.' });
    return;
  }
  if (!isNonEmptyString(fullName)) {
    res.status(400).json({ error: 'Full name is required.' });
    return;
  }
  if (email !== undefined && email !== null && email !== '' && !EMAIL_RE.test(String(email).trim())) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }
  if (phone !== undefined && phone !== null && phone !== '') {
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length < 7) {
      res.status(400).json({ error: 'Phone number must contain at least 7 digits.' });
      return;
    }
  }

  const id = `cli-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  try {
    await pool.query(
      `INSERT INTO clients (id, client_number, full_name, phone, email, location, notes, date_registered)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [
        id,
        clientNumber.trim(),
        fullName.trim(),
        isNonEmptyString(phone) ? phone.trim() : null,
        isNonEmptyString(email) ? email.trim() : null,
        isNonEmptyString(location) ? location.trim() : null,
        isNonEmptyString(notes) ? notes.trim() : null,
      ]
    );
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Client number already exists.' });
      return;
    }
    throw err;
  }

  const [client] = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
  res.status(201).json((client as any)[0]);
}));

app.get('/api/clients/:id', requireAuth, apiRateLimit, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [client] = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
  if ((client as any[]).length === 0) {
    res.status(404).json({ error: 'Client not found.' });
    return;
  }
  const [loans] = await pool.query(`
    SELECT l.*,
      COALESCE(r.total_repaid, 0) as total_repaid,
      GREATEST(0, l.total_amount_due - COALESCE(r.total_repaid, 0)) as outstanding_balance,
      CASE
        WHEN COALESCE(r.total_repaid, 0) >= l.total_amount_due THEN 'Fully Paid'
        WHEN COALESCE(r.total_repaid, 0) > 0 THEN 'Partially Paid'
        ELSE 'Outstanding'
      END as status
    FROM loans l
    LEFT JOIN (
      SELECT loan_id, SUM(amount) as total_repaid
      FROM repayments
      GROUP BY loan_id
    ) r ON l.id = r.loan_id
    WHERE l.client_id = ?
  `, [id]);
  res.json({ ...(client as any)[0], loans });
}));

// ---------------------------------------------------------------------------
// Loans
// ---------------------------------------------------------------------------

app.get('/api/loans', requireAuth, apiRateLimit, asyncHandler(async (_req, res) => {
  const [loans] = await pool.query(`
    SELECT
      l.*,
      c.client_number,
      c.full_name as client_name,
      COALESCE(r.total_repaid, 0) as total_repaid,
      GREATEST(0, l.total_amount_due - COALESCE(r.total_repaid, 0)) as outstanding_balance,
      CASE
        WHEN COALESCE(r.total_repaid, 0) >= l.total_amount_due THEN 'Fully Paid'
        WHEN COALESCE(r.total_repaid, 0) > 0 THEN 'Partially Paid'
        ELSE 'Outstanding'
      END as status
    FROM loans l
    JOIN clients c ON l.client_id = c.id
    LEFT JOIN (
      SELECT loan_id, SUM(amount) as total_repaid
      FROM repayments
      GROUP BY loan_id
    ) r ON l.id = r.loan_id
    ORDER BY l.created_at DESC
  `);
  res.json(loans);
}));

app.post('/api/loans', requireAuth, apiRateLimit, asyncHandler(async (req, res) => {
  const { clientId, loanAmount, totalAmountDue, purpose, dueDate } = req.body || {};

  if (!isNonEmptyString(clientId)) {
    res.status(400).json({ error: 'Client ID is required.' });
    return;
  }
  if (!isValidAmount(loanAmount)) {
    res.status(400).json({ error: 'Loan amount must be a number greater than zero.' });
    return;
  }
  if (!isValidAmount(totalAmountDue)) {
    res.status(400).json({ error: 'Total amount due must be a number greater than zero.' });
    return;
  }
  if (toCents(totalAmountDue) < toCents(loanAmount)) {
    res.status(400).json({ error: 'Total amount due cannot be less than the loan principal.' });
    return;
  }
  if (dueDate !== undefined && dueDate !== null && dueDate !== '' && !isValidDateString(dueDate)) {
    res.status(400).json({ error: 'Due date must be a valid date.' });
    return;
  }

  const [client] = await pool.query('SELECT * FROM clients WHERE id = ?', [clientId]);
  if ((client as any[]).length === 0) {
    res.status(404).json({ error: 'Client not found.' });
    return;
  }

  const id = `loan-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const year = new Date().getFullYear();

  // Loan reference generation retries on the unique constraint, which remains
  // the final authority against collisions.
  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const [maxRef] = await pool.query(
      'SELECT MAX(CAST(SUBSTRING_INDEX(loan_reference, "-", -1) AS UNSIGNED)) as max_num FROM loans WHERE loan_reference LIKE ?',
      [`LN-${year}-%`]
    );
    const nextNum = (Number((maxRef as any)[0].max_num) || 0) + 1;
    const loanReference = `LN-${year}-${String(nextNum).padStart(3, '0')}`;
    try {
      await pool.query(
        `INSERT INTO loans (id, loan_reference, client_id, loan_amount, total_amount_due, purpose, loan_date, due_date)
         VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
        [id, loanReference, clientId, Number(loanAmount).toFixed(2), Number(totalAmountDue).toFixed(2), isNonEmptyString(purpose) ? purpose.trim() : null, isNonEmptyString(dueDate) ? dueDate : null]
      );
      lastError = null;
      break;
    } catch (err: any) {
      lastError = err;
      if (err.code !== 'ER_DUP_ENTRY') throw err;
    }
  }
  if (lastError) throw lastError;

  const [loan] = await pool.query('SELECT * FROM loans WHERE id = ?', [id]);
  res.status(201).json({ ...(loan as any)[0], client_name: (client as any)[0].full_name, client_number: (client as any)[0].client_number });
}));

app.get('/api/loans/:id', requireAuth, apiRateLimit, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [loan] = await pool.query(`
    SELECT l.*, c.client_number, c.full_name as client_name
    FROM loans l
    JOIN clients c ON l.client_id = c.id
    WHERE l.id = ?
  `, [id]);
  if ((loan as any[]).length === 0) {
    res.status(404).json({ error: 'Loan not found.' });
    return;
  }
  const [repayments] = await pool.query(
    'SELECT * FROM repayments WHERE loan_id = ? ORDER BY payment_date DESC',
    [id]
  );
  const totalRepaid = (repayments as any[]).reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const outstandingBalance = Math.max(0, parseFloat((loan as any)[0].total_amount_due) - totalRepaid);
  const status = totalRepaid >= parseFloat((loan as any)[0].total_amount_due) ? 'Fully Paid' : totalRepaid > 0 ? 'Partially Paid' : 'Outstanding';
  res.json({ ...(loan as any)[0], total_repaid: totalRepaid, outstanding_balance: outstandingBalance, status, repayments });
}));

// ---------------------------------------------------------------------------
// Repayments
// ---------------------------------------------------------------------------

app.get('/api/repayments', requireAuth, apiRateLimit, asyncHandler(async (_req, res) => {
  const [repayments] = await pool.query(`
    SELECT r.*, l.loan_reference, c.full_name as client_name
    FROM repayments r
    JOIN loans l ON r.loan_id = l.id
    JOIN clients c ON r.client_id = c.id
    ORDER BY r.payment_date DESC, r.created_at DESC
  `);
  res.json(repayments);
}));

app.post('/api/repayments', requireAuth, apiRateLimit, asyncHandler(async (req, res) => {
  const { loanId, amount, paymentReference, paymentDate, paymentMethod, notes } = req.body || {};

  // --- Input validation (before touching the database) ---
  if (!isNonEmptyString(loanId)) {
    res.status(400).json({ error: 'Loan ID is required.' });
    return;
  }
  if (!isValidAmount(amount)) {
    res.status(400).json({ error: 'Repayment amount must be a number greater than zero.' });
    return;
  }
  if (!isNonEmptyString(paymentReference)) {
    res.status(400).json({ error: 'Payment reference is required.' });
    return;
  }
  if (!isValidDateString(paymentDate)) {
    res.status(400).json({ error: 'A valid payment date is required.' });
    return;
  }

  const amountCents = toCents(amount);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the loan row so concurrent repayments cannot both pass the balance check.
    const [loanRows] = await conn.query(
      `SELECT l.*, c.id as client_id
       FROM loans l
       JOIN clients c ON l.client_id = c.id
       WHERE l.id = ?
       FOR UPDATE`,
      [loanId]
    );
    if ((loanRows as any[]).length === 0) {
      await conn.rollback();
      res.status(404).json({ error: 'Loan not found.' });
      return;
    }
    const loan = (loanRows as any[])[0];

    const [repRows] = await conn.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM repayments WHERE loan_id = ?',
      [loanId]
    );
    const outstandingCents = toCents(loan.total_amount_due) - toCents((repRows as any)[0].total);

    if (amountCents > outstandingCents) {
      await conn.rollback();
      res.status(400).json({
        error: `Amount exceeds outstanding balance of KES ${(outstandingCents / 100).toLocaleString('en-KE', { minimumFractionDigits: 2 })}.`,
      });
      return;
    }

    const [dup] = await conn.query('SELECT id FROM repayments WHERE payment_reference = ?', [paymentReference.trim()]);
    if ((dup as any[]).length > 0) {
      await conn.rollback();
      res.status(409).json({ error: 'Payment reference already exists.' });
      return;
    }

    const id = `rep-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    await conn.query(
      `INSERT INTO repayments (id, payment_reference, loan_id, client_id, amount, payment_date, payment_method, notes, date_recorded)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        paymentReference.trim(),
        loanId,
        loan.client_id,
        (amountCents / 100).toFixed(2),
        paymentDate,
        isNonEmptyString(paymentMethod) ? paymentMethod : 'M-Pesa',
        isNonEmptyString(notes) ? notes.trim() : null,
      ]
    );

    await conn.commit();

    const [repayment] = await pool.query('SELECT * FROM repayments WHERE id = ?', [id]);
    const newOutstanding = Math.max(0, outstandingCents - amountCents) / 100;
    res.status(201).json({ ...(repayment as any)[0], outstanding_balance: newOutstanding });
  } catch (err: any) {
    await conn.rollback().catch(() => {});
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Payment reference already exists.' });
      return;
    }
    throw err;
  } finally {
    conn.release();
  }
}));

// ---------------------------------------------------------------------------
// Portfolio summary
// ---------------------------------------------------------------------------

app.get('/api/portfolio', requireAuth, apiRateLimit, asyncHandler(async (_req, res) => {
  const [summary] = await pool.query(`
    SELECT
      COUNT(DISTINCT c.id) as total_clients,
      COUNT(DISTINCT l.id) as total_loans,
      COALESCE(SUM(l.loan_amount), 0) as total_disbursed,
      COALESCE(SUM(l.total_amount_due), 0) as total_amount_due,
      COALESCE(SUM(r.total_repaid), 0) as total_repaid,
      COALESCE(SUM(GREATEST(0, l.total_amount_due - COALESCE(r.total_repaid, 0))), 0) as total_outstanding
    FROM clients c
    LEFT JOIN loans l ON c.id = l.client_id
    LEFT JOIN (
      SELECT loan_id, SUM(amount) as total_repaid
      FROM repayments
      GROUP BY loan_id
    ) r ON l.id = r.loan_id
  `);
  const [loanStatus] = await pool.query(`
    SELECT
      CASE
        WHEN COALESCE(r.total_repaid, 0) >= l.total_amount_due THEN 'Fully Paid'
        WHEN COALESCE(r.total_repaid, 0) > 0 THEN 'Partially Paid'
        ELSE 'Outstanding'
      END as status,
      COUNT(*) as count
    FROM loans l
    LEFT JOIN (
      SELECT loan_id, SUM(amount) as total_repaid
      FROM repayments
      GROUP BY loan_id
    ) r ON l.id = r.loan_id
    GROUP BY status
  `);
  res.json({
    ...(summary as any)[0],
    loanStatus: (loanStatus as any[]).reduce((acc: any, item: any) => {
      acc[item.status] = item.count;
      return acc;
    }, {}),
  });
}));

// ---------------------------------------------------------------------------
// Central error handler (sanitized)
// ---------------------------------------------------------------------------

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  serverError(res, 'unhandled', err);
});

// ---------------------------------------------------------------------------
// Server startup
// ---------------------------------------------------------------------------

export { app };

async function startServer() {
  await ensureUsersTable();

  // Optional first-admin seeding from environment (never logged).
  if ((await countUsers()) === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await createUser(
      process.env.ADMIN_EMAIL,
      process.env.ADMIN_PASSWORD,
      process.env.ADMIN_NAME || 'System Administrator',
      undefined,
      'admin'
    );
    console.log(`[auth] Initial administrator account created for ${process.env.ADMIN_EMAIL}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Inuka Africa Server] running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

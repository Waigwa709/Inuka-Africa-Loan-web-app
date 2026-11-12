import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { aiService } from './src/lib/ai/ai-service';
import pool from './src/lib/db';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    institution: 'Inuka Africa Limited',
    system: 'Microfinance Loan Repayment Tracker with AI Integration',
    aiProvider: aiService.activeProviderName,
    aiModel: aiService.activeModelName,
    timestamp: new Date().toISOString(),
  });
});

// AI Chat Assistant Endpoint (Feature 1)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { question, history, contextData } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required as a string.' });
    }

    const response = await aiService.askQuestion({
      question,
      history,
      contextData,
    });

    res.json(response);
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({
      error: 'Failed to process AI chat query.',
      details: error.message || String(error),
    });
  }
});

// AI Management Reports Generator Endpoint (Feature 2)
app.post('/api/ai/reports', async (req, res) => {
  try {
    const { reportType, period, contextData } = req.body;

    if (!reportType || !period || !contextData) {
      return res.status(400).json({ error: 'reportType, period, and contextData are required.' });
    }

    const report = await aiService.generateReport({
      reportType,
      period,
      contextData,
    });

    res.json(report);
  } catch (error: any) {
    console.error('Error in /api/ai/reports:', error);
    res.status(500).json({
      error: 'Failed to generate AI management report.',
      details: error.message || String(error),
    });
  }
});

// AI Repayment Risk Explanation Endpoint (Feature 3)
app.post('/api/ai/risk-analysis', async (req, res) => {
  try {
    const { assessment } = req.body;

    if (!assessment) {
      return res.status(400).json({ error: 'Loan risk assessment payload is required.' });
    }

    const explanation = await aiService.explainRisk({
      assessment,
    });

    res.json(explanation);
  } catch (error: any) {
    console.error('Error in /api/ai/risk-analysis:', error);
    res.status(500).json({
      error: 'Failed to explain loan risk.',
      details: error.message || String(error),
    });
  }
});

// ==================== DATABASE API ENDPOINTS ====================

// Get all clients with loan statistics
app.get('/api/clients', async (req, res) => {
  try {
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
    `) as any;
    res.json(clients);
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients', details: error.message });
  }
});

// Create new client
app.post('/api/clients', async (req, res) => {
  try {
    const { clientNumber, fullName, phone, email, location, notes } = req.body;
    
    if (!clientNumber || !fullName) {
      return res.status(400).json({ error: 'Client number and full name are required' });
    }

    const id = `cli-${Date.now()}`;
    await pool.query(
      `INSERT INTO clients (id, client_number, full_name, phone, email, location, notes, date_registered)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [id, clientNumber, fullName, phone, email, location, notes]
    );

    const [client] = await pool.query('SELECT * FROM clients WHERE id = ?', [id]) as any;
    res.status(201).json(client[0]);
  } catch (error: any) {
    console.error('Error creating client:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Client number already exists' });
    }
    res.status(500).json({ error: 'Failed to create client', details: error.message });
  }
});

// Get client by ID with loans
app.get('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [client] = await pool.query('SELECT * FROM clients WHERE id = ?', [id]) as any;
    
    if (client.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
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
    `, [id]) as any;

    res.json({ ...client[0], loans });
  } catch (error: any) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client', details: error.message });
  }
});

// Get all loans with client info
app.get('/api/loans', async (req, res) => {
  try {
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
    `) as any;
    res.json(loans);
  } catch (error: any) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: 'Failed to fetch loans', details: error.message });
  }
});

// Create new loan
app.post('/api/loans', async (req, res) => {
  try {
    const { clientId, loanAmount, totalAmountDue, purpose, dueDate } = req.body;
    
    if (!clientId || !loanAmount || !totalAmountDue) {
      return res.status(400).json({ error: 'Client ID, loan amount, and total amount due are required' });
    }

    // Get client info
    const [client] = await pool.query('SELECT * FROM clients WHERE id = ?', [clientId]) as any;
    if (client.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Generate loan reference
    const [maxRef] = await pool.query(
      'SELECT MAX(CAST(SUBSTRING_INDEX(loan_reference, "-", -1) AS UNSIGNED)) as max_num FROM loans WHERE loan_reference LIKE ?',
      [`LN-${new Date().getFullYear()}-%`]
    ) as any;
    const nextNum = (maxRef[0].max_num || 0) + 1;
    const loanReference = `LN-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;

    const id = `loan-${Date.now()}`;
    await pool.query(
      `INSERT INTO loans (id, loan_reference, client_id, loan_amount, total_amount_due, purpose, loan_date, due_date)
       VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
      [id, loanReference, clientId, loanAmount, totalAmountDue, purpose, dueDate]
    );

    const [loan] = await pool.query('SELECT * FROM loans WHERE id = ?', [id]) as any;
    res.status(201).json({ ...loan[0], client_name: client[0].full_name, client_number: client[0].client_number });
  } catch (error: any) {
    console.error('Error creating loan:', error);
    res.status(500).json({ error: 'Failed to create loan', details: error.message });
  }
});

// Get loan by ID with repayments
app.get('/api/loans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [loan] = await pool.query(`
      SELECT l.*, c.client_number, c.full_name as client_name
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      WHERE l.id = ?
    `, [id]) as any;

    if (loan.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const [repayments] = await pool.query(
      'SELECT * FROM repayments WHERE loan_id = ? ORDER BY payment_date DESC',
      [id]
    ) as any;

    const totalRepaid = repayments.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0);
    const outstandingBalance = Math.max(0, parseFloat(loan[0].total_amount_due) - totalRepaid);
    const status = totalRepaid >= parseFloat(loan[0].total_amount_due) ? 'Fully Paid' : totalRepaid > 0 ? 'Partially Paid' : 'Outstanding';

    res.json({ ...loan[0], total_repaid: totalRepaid, outstanding_balance: outstandingBalance, status, repayments });
  } catch (error: any) {
    console.error('Error fetching loan:', error);
    res.status(500).json({ error: 'Failed to fetch loan', details: error.message });
  }
});

// Get all repayments
app.get('/api/repayments', async (req, res) => {
  try {
    const [repayments] = await pool.query(`
      SELECT r.*, l.loan_reference, c.full_name as client_name
      FROM repayments r
      JOIN loans l ON r.loan_id = l.id
      JOIN clients c ON r.client_id = c.id
      ORDER BY r.payment_date DESC, r.created_at DESC
    `) as any;
    res.json(repayments);
  } catch (error: any) {
    console.error('Error fetching repayments:', error);
    res.status(500).json({ error: 'Failed to fetch repayments', details: error.message });
  }
});

// Record new repayment
app.post('/api/repayments', async (req, res) => {
  try {
    const { loanId, amount, paymentReference, paymentDate, paymentMethod, notes } = req.body;
    
    if (!loanId || !amount || !paymentReference || !paymentDate) {
      return res.status(400).json({ error: 'Loan ID, amount, payment reference, and payment date are required' });
    }

    // Get loan info
    const [loan] = await pool.query(`
      SELECT l.*, c.id as client_id, c.full_name as client_name
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      WHERE l.id = ?
    `, [loanId]) as any;

    if (loan.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Check if payment reference already exists
    const [existing] = await pool.query('SELECT id FROM repayments WHERE payment_reference = ?', [paymentReference]) as any;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Payment reference already exists' });
    }

    // Calculate current outstanding
    const [currentRepaid] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM repayments WHERE loan_id = ?', [loanId]) as any;
    const currentTotalRepaid = parseFloat(currentRepaid[0].total);
    const outstanding = parseFloat(loan[0].total_amount_due) - currentTotalRepaid;

    if (amount > outstanding) {
      return res.status(400).json({ error: `Amount exceeds outstanding balance of ${outstanding}` });
    }

    const id = `rep-${Date.now()}`;
    await pool.query(
      `INSERT INTO repayments (id, payment_reference, loan_id, client_id, amount, payment_date, payment_method, notes, date_recorded)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, paymentReference, loanId, loan[0].client_id, amount, paymentDate, paymentMethod || 'M-Pesa', notes]
    );

    const [repayment] = await pool.query('SELECT * FROM repayments WHERE id = ?', [id]) as any;
    res.status(201).json(repayment[0]);
  } catch (error: any) {
    console.error('Error recording repayment:', error);
    res.status(500).json({ error: 'Failed to record repayment', details: error.message });
  }
});

// Get portfolio summary
app.get('/api/portfolio', async (req, res) => {
  try {
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
    `) as any;

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
    `) as any;

    res.json({
      ...summary[0],
      loanStatus: loanStatus.reduce((acc: any, item: any) => {
        acc[item.status] = item.count;
        return acc;
      }, {}),
    });
  } catch (error: any) {
    console.error('Error fetching portfolio summary:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio summary', details: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Inuka Africa Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

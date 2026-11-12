import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { aiService } from './src/lib/ai/ai-service';

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

// Database Schema Viewer Endpoint
app.get('/api/database/schema', (req, res) => {
  try {
    const schemaSqlPath = path.resolve(process.cwd(), 'prisma/schema.sql');
    const schemaPrismaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');

    const sqlContent = fs.existsSync(schemaSqlPath)
      ? fs.readFileSync(schemaSqlPath, 'utf-8')
      : '-- Schema SQL not found';

    const prismaContent = fs.existsSync(schemaPrismaPath)
      ? fs.readFileSync(schemaPrismaPath, 'utf-8')
      : '// Prisma schema not found';

    res.json({
      engine: 'MySQL 8.0+ / InnoDB',
      database: 'inuka_microfinance',
      sqlSchema: sqlContent,
      prismaSchema: prismaContent,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Could not read database schema.' });
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

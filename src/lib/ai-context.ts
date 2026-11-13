import pool from './db';
import { mapLoanRow, mapRepaymentRow, mapClientWithStats } from './mappers';
import { calculatePortfolioMetrics } from './analytics/portfolio-analytics';
import { calculateRepaymentInsights } from './analytics/repayment-analytics';
import { assessPortfolioRisk } from './analytics/risk-analysis';
import { Loan } from '../types/loan';
import { Repayment } from '../types/repayment';
import { ClientWithStats } from '../types/client';

/**
 * Builds the verified financial context for AI features.
 *
 * IMPORTANT: All figures are computed server-side from MySQL using the same
 * deterministic analytics functions the frontend uses. The AI provider never
 * receives client-supplied totals, and the language model never performs
 * financial arithmetic itself.
 */

export interface AIFinancialContext {
  metrics: ReturnType<typeof calculatePortfolioMetrics>;
  insights: ReturnType<typeof calculateRepaymentInsights>;
  riskSummary: ReturnType<typeof assessPortfolioRisk>;
}

export async function buildFinancialContext(): Promise<AIFinancialContext> {
  const [clientsRes, loansRes, repaymentsRes] = await Promise.all([
    pool.query(`
      SELECT c.*,
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
    `),
    pool.query(`
      SELECT l.*, c.client_number, c.full_name as client_name,
        COALESCE(r.total_repaid, 0) as total_repaid,
        GREATEST(0, l.total_amount_due - COALESCE(r.total_repaid, 0)) as outstanding_balance
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      LEFT JOIN (
        SELECT loan_id, SUM(amount) as total_repaid
        FROM repayments
        GROUP BY loan_id
      ) r ON l.id = r.loan_id
    `),
    pool.query(`
      SELECT r.*, l.loan_reference, c.full_name as client_name
      FROM repayments r
      JOIN loans l ON r.loan_id = l.id
      JOIN clients c ON r.client_id = c.id
    `),
  ]);

  const clients = (clientsRes[0] as any[]).map(mapClientWithStats);
  const loans: Loan[] = (loansRes[0] as any[]).map(mapLoanRow);
  const repayments: Repayment[] = (repaymentsRes[0] as any[]).map(mapRepaymentRow);

  const metrics = calculatePortfolioMetrics(loans, repayments, clients.length);
  const insights = calculateRepaymentInsights(loans, repayments, clients);
  const riskSummary = assessPortfolioRisk(loans, repayments);

  return { metrics, insights, riskSummary };
}

/**
 * Recomputes the risk assessment for a single loan directly from the database,
 * so AI risk explanations are always based on verified records rather than
 * client-supplied assessment payloads.
 */
export async function buildLoanRiskAssessment(loanId: string) {
  const [loanRows] = await pool.query(`
    SELECT l.*, c.client_number, c.full_name as client_name,
      COALESCE(r.total_repaid, 0) as total_repaid,
      GREATEST(0, l.total_amount_due - COALESCE(r.total_repaid, 0)) as outstanding_balance
    FROM loans l
    JOIN clients c ON l.client_id = c.id
    LEFT JOIN (
      SELECT loan_id, SUM(amount) as total_repaid
      FROM repayments
      GROUP BY loan_id
    ) r ON l.id = r.loan_id
    WHERE l.id = ?
  `, [loanId]) as any;

  if (!loanRows.length) return null;

  const [repRows] = await pool.query(`
    SELECT r.*, l.loan_reference, c.full_name as client_name
    FROM repayments r
    JOIN loans l ON r.loan_id = l.id
    JOIN clients c ON r.client_id = c.id
    WHERE r.loan_id = ?
  `, [loanId]) as any;

  const loan: Loan = mapLoanRow(loanRows[0]);
  const repayments: Repayment[] = (repRows as any[]).map(mapRepaymentRow);
  const summary = assessPortfolioRisk([loan], repayments);
  return summary.assessments[0] ?? null;
}

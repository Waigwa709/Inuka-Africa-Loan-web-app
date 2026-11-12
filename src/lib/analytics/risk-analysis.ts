import { Loan } from '../../types/loan';
import { Repayment } from '../../types/repayment';
import { roundCurrency } from '../currency';

export type AttentionCategory = 'High Attention' | 'Medium Attention' | 'Low Attention';

export interface RiskIndicatorRule {
  id: 'NO_RECENT_PAYMENT' | 'HIGH_OUTSTANDING_RATIO' | 'NO_PAYMENT_HISTORY' | 'OVERDUE_MATURITY' | 'UNUSUAL_GAP';
  label: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface LoanRiskAssessment {
  loanId: string;
  loanReference: string;
  clientId: string;
  clientName: string;
  clientNumber: string;
  loanAmount: number;
  totalAmountDue: number;
  totalRepaid: number;
  outstandingBalance: number;
  outstandingRatio: number; // %
  lastRepaymentDate: string | null;
  daysSinceLastRepayment: number | null;
  daysSinceDisbursement: number;
  dueDate: string | null;
  isOverdue: boolean;
  detectedIndicators: RiskIndicatorRule[];
  attentionCategory: AttentionCategory;
  suggestedAction: string;
  aiExplanation?: string;
}

export interface PortfolioRiskSummary {
  totalAssessedLoans: number;
  highAttentionCount: number;
  mediumAttentionCount: number;
  lowAttentionCount: number;
  flaggedPortfolioBalance: number; // Sum of outstanding on High & Medium attention loans
  assessments: LoanRiskAssessment[];
}

/**
 * Analyzes repayment risks across all loans using deterministic, transparent rules.
 */
export function assessPortfolioRisk(
  loans: Loan[],
  repayments: Repayment[],
  thresholds = {
    noRepaymentDays: 30,
    highOutstandingRatio: 75,
  }
): PortfolioRiskSummary {
  const now = new Date();

  const assessments: LoanRiskAssessment[] = loans.map((loan) => {
    // If loan is fully settled, it is strictly Low Attention with 0 risk
    if (loan.status === 'Fully Paid' || loan.outstandingBalance <= 0) {
      return {
        loanId: loan.id,
        loanReference: loan.loanReference,
        clientId: loan.clientId,
        clientName: loan.clientName,
        clientNumber: loan.clientNumber,
        loanAmount: loan.loanAmount,
        totalAmountDue: loan.totalAmountDue,
        totalRepaid: loan.totalRepaid,
        outstandingBalance: 0,
        outstandingRatio: 0,
        lastRepaymentDate: null,
        daysSinceLastRepayment: null,
        daysSinceDisbursement: 0,
        dueDate: loan.dueDate || null,
        isOverdue: false,
        detectedIndicators: [],
        attentionCategory: 'Low Attention',
        suggestedAction: 'Facility fully settled in good standing.',
      };
    }

    const loanReps = repayments
      .filter((r) => r.loanId === loan.id)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    const loanDate = new Date(loan.loanDate);
    const daysSinceDisbursement = Math.max(
      0,
      Math.floor((now.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    let lastRepaymentDate: string | null = null;
    let daysSinceLastRepayment: number | null = null;

    if (loanReps.length > 0 && loanReps[0].paymentDate) {
      lastRepaymentDate = loanReps[0].paymentDate;
      const lastDate = new Date(lastRepaymentDate);
      daysSinceLastRepayment = Math.max(
        0,
        Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    const outstandingRatio = roundCurrency(
      loan.totalAmountDue > 0 ? (loan.outstandingBalance / loan.totalAmountDue) * 100 : 0
    );

    const isOverdue = !!(loan.dueDate && new Date(loan.dueDate) < now && loan.outstandingBalance > 0);

    // Evaluate explainable indicator rules
    const detectedIndicators: RiskIndicatorRule[] = [];

    // Rule A: No Recent Repayment (> 30 days)
    if (daysSinceLastRepayment !== null && daysSinceLastRepayment > thresholds.noRepaymentDays) {
      detectedIndicators.push({
        id: 'NO_RECENT_PAYMENT',
        label: `No repayment in ${daysSinceLastRepayment} days`,
        description: `Last collection recorded on ${lastRepaymentDate}, exceeding the standard ${thresholds.noRepaymentDays}-day monitoring threshold.`,
        severity: 'high',
      });
    }

    // Rule B: High Outstanding Balance (> 75% of total due)
    if (outstandingRatio >= thresholds.highOutstandingRatio) {
      detectedIndicators.push({
        id: 'HIGH_OUTSTANDING_RATIO',
        label: `High balance ratio (${outstandingRatio}%)`,
        description: `Remaining balance of KES ${loan.outstandingBalance.toLocaleString('en-KE')} constitutes ${outstandingRatio}% of the total facility obligation.`,
        severity: 'medium',
      });
    }

    // Rule C: No Repayment History
    if (loanReps.length === 0) {
      if (daysSinceDisbursement > 21) {
        detectedIndicators.push({
          id: 'NO_PAYMENT_HISTORY',
          label: 'Zero payments since disbursement',
          description: `Disbursed ${daysSinceDisbursement} days ago with no repayments received to date.`,
          severity: 'high',
        });
      } else {
        detectedIndicators.push({
          id: 'NO_PAYMENT_HISTORY',
          label: 'Initial cycle pending',
          description: `Recently issued facility (${daysSinceDisbursement} days old) awaiting initial scheduled installment.`,
          severity: 'low',
        });
      }
    }

    // Rule D: Overdue Maturity
    if (isOverdue) {
      detectedIndicators.push({
        id: 'OVERDUE_MATURITY',
        label: 'Past maturity due date',
        description: `Scheduled loan maturity expired on ${loan.dueDate} with an active balance.`,
        severity: 'high',
      });
    }

    // Classification Logic
    let attentionCategory: AttentionCategory = 'Low Attention';
    let suggestedAction = 'Monitor on routine schedule; borrower repayments are currently in order.';

    const hasHighSeverity = detectedIndicators.some((i) => i.severity === 'high');
    const indicatorCount = detectedIndicators.length;

    if (isOverdue || (hasHighSeverity && indicatorCount >= 2)) {
      attentionCategory = 'High Attention';
      suggestedAction =
        'Immediate branch officer outreach required. Verify business continuity and establish restructured payment plan.';
    } else if (hasHighSeverity || indicatorCount >= 1) {
      attentionCategory = 'Medium Attention';
      suggestedAction =
        'Schedule courtesy SMS / phone follow-up before the next repayment cycle to prevent delinquency.';
    }

    return {
      loanId: loan.id,
      loanReference: loan.loanReference,
      clientId: loan.clientId,
      clientName: loan.clientName,
      clientNumber: loan.clientNumber,
      loanAmount: loan.loanAmount,
      totalAmountDue: loan.totalAmountDue,
      totalRepaid: loan.totalRepaid,
      outstandingBalance: loan.outstandingBalance,
      outstandingRatio,
      lastRepaymentDate,
      daysSinceLastRepayment,
      daysSinceDisbursement,
      dueDate: loan.dueDate || null,
      isOverdue,
      detectedIndicators,
      attentionCategory,
      suggestedAction,
    };
  });

  const highAttentionCount = assessments.filter((a) => a.attentionCategory === 'High Attention').length;
  const mediumAttentionCount = assessments.filter((a) => a.attentionCategory === 'Medium Attention').length;
  const lowAttentionCount = assessments.filter((a) => a.attentionCategory === 'Low Attention').length;

  const flaggedPortfolioBalance = roundCurrency(
    assessments
      .filter((a) => a.attentionCategory !== 'Low Attention')
      .reduce((sum, a) => sum + a.outstandingBalance, 0)
  );

  return {
    totalAssessedLoans: loans.length,
    highAttentionCount,
    mediumAttentionCount,
    lowAttentionCount,
    flaggedPortfolioBalance,
    assessments,
  };
}

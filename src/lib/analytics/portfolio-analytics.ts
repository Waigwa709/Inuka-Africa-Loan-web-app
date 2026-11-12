import { Loan } from '../../types/loan';
import { Repayment } from '../../types/repayment';
import { ClientWithStats } from '../../types/client';
import { roundCurrency } from '../currency';

export interface PortfolioMetrics {
  totalClientsCount: number;
  totalLoansCount: number;
  activeLoansCount: number;
  fullyPaidLoansCount: number;
  partiallyPaidLoansCount: number;
  outstandingLoansCount: number; // 0 repayments
  totalDisbursed: number; // Principal
  totalAmountDue: number; // Principal + Interest/Fees
  totalRepaid: number; // Actual collections
  totalOutstandingBalance: number; // Remaining
  collectionRate: number; // % (totalRepaid / totalAmountDue) * 100
  averageLoanSize: number;
  averageRepaymentAmount: number;
  portfolioAtRisk30: number; // Estimated PAR30 %
}

export interface MonthlyCollectionSummary {
  monthKey: string; // "YYYY-MM"
  monthLabel: string; // e.g. "Nov 2024"
  amount: number;
  transactionCount: number;
}

/**
 * Calculates authoritative, deterministic portfolio metrics.
 * Financial arithmetic uses roundCurrency to maintain 2-decimal precision.
 */
export function calculatePortfolioMetrics(
  loans: Loan[],
  repayments: Repayment[],
  clientsCount: number
): PortfolioMetrics {
  const totalLoansCount = loans.length;
  const fullyPaidLoansCount = loans.filter((l) => l.status === 'Fully Paid').length;
  const partiallyPaidLoansCount = loans.filter((l) => l.status === 'Partially Paid').length;
  const outstandingLoansCount = loans.filter((l) => l.totalRepaid === 0).length;
  const activeLoansCount = loans.filter((l) => l.status !== 'Fully Paid').length;

  const totalDisbursed = roundCurrency(loans.reduce((sum, l) => sum + l.loanAmount, 0));
  const totalAmountDue = roundCurrency(loans.reduce((sum, l) => sum + l.totalAmountDue, 0));
  const totalRepaid = roundCurrency(repayments.reduce((sum, r) => sum + r.amount, 0));
  const totalOutstandingBalance = roundCurrency(loans.reduce((sum, l) => sum + l.outstandingBalance, 0));

  const collectionRate =
    totalAmountDue > 0
      ? roundCurrency((totalRepaid / totalAmountDue) * 100)
      : 0;

  const averageLoanSize =
    totalLoansCount > 0 ? roundCurrency(totalDisbursed / totalLoansCount) : 0;

  const averageRepaymentAmount =
    repayments.length > 0 ? roundCurrency(totalRepaid / repayments.length) : 0;

  // PAR 30 estimate: percentage of active loans with no repayment in last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const parLoans = loans.filter((l) => {
    if (l.status === 'Fully Paid') return false;
    const loanReps = repayments.filter((r) => r.loanId === l.id);
    if (loanReps.length === 0) {
      const loanDate = new Date(l.loanDate);
      return loanDate < thirtyDaysAgo;
    }
    const lastPayment = loanReps.sort(
      (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    )[0];
    return new Date(lastPayment.paymentDate) < thirtyDaysAgo;
  });

  const parBalance = parLoans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const portfolioAtRisk30 =
    totalOutstandingBalance > 0
      ? roundCurrency((parBalance / totalOutstandingBalance) * 100)
      : 0;

  return {
    totalClientsCount: clientsCount,
    totalLoansCount,
    activeLoansCount,
    fullyPaidLoansCount,
    partiallyPaidLoansCount,
    outstandingLoansCount,
    totalDisbursed,
    totalAmountDue,
    totalRepaid,
    totalOutstandingBalance,
    collectionRate,
    averageLoanSize,
    averageRepaymentAmount,
    portfolioAtRisk30,
  };
}

/**
 * Aggregates monthly collections over the specified number of months.
 */
export function getMonthlyRepaymentHistory(
  repayments: Repayment[],
  monthCount = 6
): MonthlyCollectionSummary[] {
  const result: MonthlyCollectionSummary[] = [];
  const now = new Date();

  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;
    const monthLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });

    const monthReps = repayments.filter((r) => r.paymentDate && r.paymentDate.startsWith(monthKey));
    const amount = roundCurrency(monthReps.reduce((sum, r) => sum + r.amount, 0));

    result.push({
      monthKey,
      monthLabel,
      amount,
      transactionCount: monthReps.length,
    });
  }

  return result;
}

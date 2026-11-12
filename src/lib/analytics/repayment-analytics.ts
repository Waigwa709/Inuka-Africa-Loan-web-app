import { Loan } from '../../types/loan';
import { Repayment } from '../../types/repayment';
import { ClientWithStats } from '../../types/client';
import { roundCurrency } from '../currency';

export interface RepaymentInsights {
  collectedThisMonth: number;
  countThisMonth: number;
  collectedPreviousMonth: number;
  monthOverMonthGrowth: number; // percentage
  collectedThisWeek: number;
  countThisWeek: number;
  topOutstandingLoans: Loan[];
  topClientsByBalance: {
    clientName: string;
    clientNumber: string;
    outstandingBalance: number;
    loansCount: number;
  }[];
  topRepayingClients: {
    clientName: string;
    totalRepaid: number;
    paymentCount: number;
  }[];
  channelDistribution: {
    channel: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
}

export function calculateRepaymentInsights(
  loans: Loan[],
  repayments: Repayment[],
  clientsWithStats: ClientWithStats[]
): RepaymentInsights {
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthPrefix = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // This month
  const thisMonthReps = repayments.filter((r) => r.paymentDate?.startsWith(currentMonthPrefix));
  const collectedThisMonth = roundCurrency(thisMonthReps.reduce((sum, r) => sum + r.amount, 0));
  const countThisMonth = thisMonthReps.length;

  // Previous month
  const prevMonthReps = repayments.filter((r) => r.paymentDate?.startsWith(prevMonthPrefix));
  const collectedPreviousMonth = roundCurrency(prevMonthReps.reduce((sum, r) => sum + r.amount, 0));

  const monthOverMonthGrowth =
    collectedPreviousMonth > 0
      ? roundCurrency(((collectedThisMonth - collectedPreviousMonth) / collectedPreviousMonth) * 100)
      : collectedThisMonth > 0
      ? 100
      : 0;

  // Last 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekReps = repayments.filter((r) => {
    if (!r.paymentDate) return false;
    const d = new Date(r.paymentDate);
    return d >= sevenDaysAgo && d <= now;
  });
  const collectedThisWeek = roundCurrency(thisWeekReps.reduce((sum, r) => sum + r.amount, 0));
  const countThisWeek = thisWeekReps.length;

  // Top outstanding loans
  const topOutstandingLoans = [...loans]
    .filter((l) => l.outstandingBalance > 0)
    .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
    .slice(0, 5);

  // Top clients by balance
  const topClientsByBalance = [...clientsWithStats]
    .filter((c) => c.outstandingBalance > 0)
    .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
    .slice(0, 5)
    .map((c) => ({
      clientName: c.fullName,
      clientNumber: c.clientNumber,
      outstandingBalance: c.outstandingBalance,
      loansCount: c.loansCount,
    }));

  // Top clients by repayments
  const clientRepMap = new Map<string, { totalRepaid: number; count: number }>();
  repayments.forEach((r) => {
    const cur = clientRepMap.get(r.clientName) || { totalRepaid: 0, count: 0 };
    cur.totalRepaid = roundCurrency(cur.totalRepaid + r.amount);
    cur.count += 1;
    clientRepMap.set(r.clientName, cur);
  });

  const topRepayingClients = Array.from(clientRepMap.entries())
    .map(([clientName, data]) => ({
      clientName,
      totalRepaid: data.totalRepaid,
      paymentCount: data.count,
    }))
    .sort((a, b) => b.totalRepaid - a.totalRepaid)
    .slice(0, 5);

  // Channel distribution
  const channelMap = new Map<string, { amount: number; count: number }>();
  const totalRepsAmount = repayments.reduce((sum, r) => sum + r.amount, 0);

  repayments.forEach((r) => {
    const channel = r.paymentMethod || 'M-Pesa';
    const cur = channelMap.get(channel) || { amount: 0, count: 0 };
    cur.amount = roundCurrency(cur.amount + r.amount);
    cur.count += 1;
    channelMap.set(channel, cur);
  });

  const channelDistribution = Array.from(channelMap.entries()).map(([channel, val]) => ({
    channel,
    amount: val.amount,
    count: val.count,
    percentage: totalRepsAmount > 0 ? roundCurrency((val.amount / totalRepsAmount) * 100) : 0,
  }));

  return {
    collectedThisMonth,
    countThisMonth,
    collectedPreviousMonth,
    monthOverMonthGrowth,
    collectedThisWeek,
    countThisWeek,
    topOutstandingLoans,
    topClientsByBalance,
    topRepayingClients,
    channelDistribution,
  };
}

import { Loan, deriveLoanStatus } from '../types/loan';
import { Repayment } from '../types/repayment';
import { Client, ClientWithStats } from '../types/client';

/**
 * Maps raw MySQL rows (snake_case) to the application's domain types (camelCase).
 * Shared by the API layer and server-side AI context generation so both use
 * identical financial calculations.
 */

const toNum = (v: any): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? 0));
  return isNaN(n) ? 0 : n;
};

const toDateStr = (v: any): string => {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
};

export function mapClientRow(row: any): Client {
  return {
    id: row.id,
    clientNumber: row.client_number,
    fullName: row.full_name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    location: row.location ?? undefined,
    dateRegistered: toDateStr(row.date_registered),
    notes: row.notes ?? undefined,
  };
}

export function mapLoanRow(row: any): Loan {
  const totalAmountDue = toNum(row.total_amount_due);
  const totalRepaid = toNum(row.total_repaid ?? 0);
  const outstandingBalance = Math.max(0, totalAmountDue - totalRepaid);
  return {
    id: row.id,
    loanReference: row.loan_reference,
    clientId: row.client_id,
    clientName: row.client_name ?? '',
    clientNumber: row.client_number ?? '',
    loanAmount: toNum(row.loan_amount),
    totalAmountDue,
    totalRepaid,
    outstandingBalance,
    loanDate: toDateStr(row.loan_date),
    dueDate: row.due_date ? toDateStr(row.due_date) : undefined,
    purpose: row.purpose ?? undefined,
    status: deriveLoanStatus(totalAmountDue, totalRepaid),
  };
}

export function mapRepaymentRow(row: any): Repayment {
  return {
    id: row.id,
    paymentReference: row.payment_reference,
    loanId: row.loan_id,
    loanReference: row.loan_reference ?? '',
    clientId: row.client_id,
    clientName: row.client_name ?? '',
    paymentDate: toDateStr(row.payment_date),
    amount: toNum(row.amount),
    dateRecorded: row.date_recorded ? new Date(row.date_recorded).toISOString() : '',
    notes: row.notes ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
  };
}

export function mapClientWithStats(row: any): ClientWithStats {
  return {
    ...mapClientRow(row),
    loansCount: toNum(row.loans_count),
    totalBorrowed: toNum(row.total_borrowed),
    totalRepaid: toNum(row.total_repaid),
    outstandingBalance: toNum(row.outstanding_balance),
  };
}

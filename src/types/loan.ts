export type LoanStatus = 'Outstanding' | 'Partially Paid' | 'Fully Paid';

export interface Loan {
  id: string;
  loanReference: string; // e.g. "LN-2024-001"
  clientId: string;
  clientName: string;
  clientNumber: string;
  loanAmount: number; // Principal (KES)
  totalAmountDue: number; // Total due with interest/fees (KES)
  totalRepaid: number; // Sum of repayments (KES)
  outstandingBalance: number; // totalAmountDue - totalRepaid (KES)
  loanDate: string; // ISO date string "YYYY-MM-DD"
  dueDate?: string;
  purpose?: string;
  status: LoanStatus;
}

export function deriveLoanStatus(totalAmountDue: number, totalRepaid: number): LoanStatus {
  if (totalRepaid <= 0) return 'Outstanding';
  if (totalRepaid >= totalAmountDue) return 'Fully Paid';
  return 'Partially Paid';
}

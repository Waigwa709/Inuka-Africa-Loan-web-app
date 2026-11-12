export interface Repayment {
  id: string;
  paymentReference: string; // e.g. "MPX789104" or "RCP-9821"
  loanId: string;
  loanReference: string;
  clientId: string;
  clientName: string;
  paymentDate: string; // "YYYY-MM-DD"
  amount: number; // KES
  dateRecorded: string; // ISO datetime or date
  notes?: string;
  paymentMethod?: 'M-Pesa' | 'Bank Transfer' | 'Cash / Cheque';
}

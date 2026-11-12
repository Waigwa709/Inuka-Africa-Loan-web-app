export interface Client {
  id: string;
  clientNumber: string; // e.g. "INK-C-1001"
  fullName: string;
  phone?: string;
  email?: string;
  location?: string;
  dateRegistered: string; // ISO date string "YYYY-MM-DD"
  notes?: string;
}

export interface ClientWithStats extends Client {
  loansCount: number;
  totalBorrowed: number;
  totalRepaid: number;
  outstandingBalance: number;
}

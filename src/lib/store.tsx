import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Client, ClientWithStats } from '../types/client';
import { Loan } from '../types/loan';
import { Repayment } from '../types/repayment';
import { roundCurrency } from './currency';
import { apiFetch, getAuthToken } from './api';

interface AddClientParams {
  clientNumber: string;
  fullName: string;
  phone?: string;
  email?: string;
  location?: string;
  notes?: string;
}

interface AddLoanParams {
  clientId: string;
  loanAmount: number;
  totalAmountDue: number;
  purpose?: string;
  dueDate?: string;
}

interface RecordRepaymentParams {
  loanId: string;
  amount: number;
  paymentReference: string;
  paymentDate: string;
  paymentMethod?: 'M-Pesa' | 'Bank Transfer' | 'Cash / Cheque';
  notes?: string;
}

interface StoreContextType {
  clients: Client[];
  clientsWithStats: ClientWithStats[];
  loans: Loan[];
  repayments: Repayment[];
  totalClientsCount: number;
  activeLoansCount: number;
  totalDisbursed: number;
  totalRepaidAll: number;
  totalOutstandingBalance: number;
  loading: boolean;
  error: string | null;
  addClient: (params: AddClientParams) => Promise<{ success: boolean; error?: string; client?: Client }>;
  addLoan: (params: AddLoanParams) => Promise<{ success: boolean; error?: string; loan?: Loan }>;
  recordRepayment: (params: RecordRepaymentParams) => Promise<{ success: boolean; error?: string; repayment?: Repayment }>;
  getClientById: (id: string) => ClientWithStats | undefined;
  getLoanById: (id: string) => Loan | undefined;
  getClientLoans: (clientId: string) => Loan[];
  getLoanRepayments: (loanId: string) => Repayment[];
  getNextLoanReference: () => string;
  getNextClientNumber: () => string;
  refreshData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

const transformClient = (apiClient: any): Client => ({
  id: apiClient.id,
  clientNumber: apiClient.client_number,
  fullName: apiClient.full_name,
  phone: apiClient.phone,
  email: apiClient.email,
  location: apiClient.location,
  dateRegistered: apiClient.date_registered?.split('T')[0] || apiClient.date_registered,
  notes: apiClient.notes,
});

const transformLoan = (apiLoan: any): Loan => ({
  id: apiLoan.id,
  loanReference: apiLoan.loan_reference,
  clientId: apiLoan.client_id,
  clientName: apiLoan.client_name,
  clientNumber: apiLoan.client_number,
  loanAmount: parseFloat(apiLoan.loan_amount),
  totalAmountDue: parseFloat(apiLoan.total_amount_due),
  totalRepaid: parseFloat(apiLoan.total_repaid || 0),
  outstandingBalance: parseFloat(apiLoan.outstanding_balance || 0),
  loanDate: apiLoan.loan_date?.split('T')[0] || apiLoan.loan_date,
  dueDate: apiLoan.due_date?.split('T')[0] || apiLoan.due_date,
  purpose: apiLoan.purpose,
  status: apiLoan.status as Loan['status'],
});

const transformRepayment = (apiRepayment: any): Repayment => ({
  id: apiRepayment.id,
  paymentReference: apiRepayment.payment_reference,
  loanId: apiRepayment.loan_id,
  loanReference: apiRepayment.loan_reference,
  clientId: apiRepayment.client_id,
  clientName: apiRepayment.client_name,
  paymentDate: apiRepayment.payment_date?.split('T')[0] || apiRepayment.payment_date,
  amount: parseFloat(apiRepayment.amount),
  dateRecorded: apiRepayment.date_recorded,
  paymentMethod: apiRepayment.payment_method as Repayment['paymentMethod'],
  notes: apiRepayment.notes,
});

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Never call authenticated endpoints without a session token; doing so
    // would trigger a 401 -> session clear -> page reload loop on the
    // login screen.
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const [clientsRes, loansRes, repaymentsRes] = await Promise.all([
        apiFetch('/api/clients'),
        apiFetch('/api/loans'),
        apiFetch('/api/repayments'),
      ]);

      if (!clientsRes.ok || !loansRes.ok || !repaymentsRes.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const [clientsData, loansData, repaymentsData] = await Promise.all([
        clientsRes.json(),
        loansRes.json(),
        repaymentsRes.json(),
      ]);

      setClients(clientsData.map(transformClient));
      setLoans(loansData.map(transformLoan));
      setRepayments(repaymentsData.map(transformRepayment));
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clientsWithStats: ClientWithStats[] = useMemo(() => {
    return clients.map((client) => {
      const clientLoans = loans.filter((l) => l.clientId === client.id);
      const totalBorrowed = roundCurrency(clientLoans.reduce((sum, l) => sum + l.loanAmount, 0));
      const totalRepaid = roundCurrency(clientLoans.reduce((sum, l) => sum + l.totalRepaid, 0));
      const outstandingBalance = roundCurrency(clientLoans.reduce((sum, l) => sum + l.outstandingBalance, 0));

      return {
        ...client,
        loansCount: clientLoans.length,
        totalBorrowed,
        totalRepaid,
        outstandingBalance,
      };
    });
  }, [clients, loans]);

  const totalClientsCount = clients.length;
  const activeLoansCount = loans.filter((l) => l.status !== 'Fully Paid').length;
  const totalDisbursed = roundCurrency(loans.reduce((sum, l) => sum + l.loanAmount, 0));
  const totalRepaidAll = roundCurrency(loans.reduce((sum, l) => sum + l.totalRepaid, 0));
  const totalOutstandingBalance = roundCurrency(loans.reduce((sum, l) => sum + l.outstandingBalance, 0));

  const getNextLoanReference = () => {
    const existingNums = loans
      .map((l) => {
        const match = l.loanReference.match(/LN-\d{4}-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
    const next = maxNum + 1;
    const year = new Date().getFullYear();
    return `LN-${year}-${String(next).padStart(3, '0')}`;
  };

  const getNextClientNumber = () => {
    const existingNums = clients
      .map((c) => {
        const match = c.clientNumber.match(/INK-C-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 1000;
    return `INK-C-${maxNum + 1}`;
  };

  const addClient = async (params: AddClientParams) => {
    try {
      const response = await apiFetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to create client' };
      }

      const newClient = await response.json();
      await fetchData();
      return { success: true, client: transformClient(newClient) };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create client' };
    }
  };

  const addLoan = async (params: AddLoanParams) => {
    try {
      const response = await apiFetch('/api/loans', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to create loan' };
      }

      const newLoan = await response.json();
      await fetchData();
      return { success: true, loan: transformLoan(newLoan) };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create loan' };
    }
  };

  const recordRepayment = async (params: RecordRepaymentParams) => {
    try {
      const response = await apiFetch('/api/repayments', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to record repayment' };
      }

      const newRepayment = await response.json();
      await fetchData();
      return { success: true, repayment: transformRepayment(newRepayment) };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to record repayment' };
    }
  };

  const getClientById = (id: string) => {
    return clientsWithStats.find((c) => c.id === id);
  };

  const getLoanById = (id: string) => {
    return loans.find((l) => l.id === id);
  };

  const getClientLoans = (clientId: string) => {
    return loans.filter((l) => l.clientId === clientId);
  };

  const getLoanRepayments = (loanId: string) => {
    return repayments.filter((r) => r.loanId === loanId);
  };

  return (
    <StoreContext.Provider
      value={{
        clients,
        clientsWithStats,
        loans,
        repayments,
        totalClientsCount,
        activeLoansCount,
        totalDisbursed,
        totalRepaidAll,
        totalOutstandingBalance,
        loading,
        error,
        addClient,
        addLoan,
        recordRepayment,
        getClientById,
        getLoanById,
        getClientLoans,
        getLoanRepayments,
        getNextLoanReference,
        getNextClientNumber,
        refreshData: fetchData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Client, ClientWithStats } from '../types/client';
import { Loan, deriveLoanStatus } from '../types/loan';
import { Repayment } from '../types/repayment';
import { INITIAL_CLIENTS, INITIAL_REPAYMENTS, getInitialLoans } from './mock-data';
import { roundCurrency } from './currency';

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
  addClient: (params: AddClientParams) => { success: boolean; error?: string; client?: Client };
  addLoan: (params: AddLoanParams) => { success: boolean; error?: string; loan?: Loan };
  recordRepayment: (params: RecordRepaymentParams) => { success: boolean; error?: string; repayment?: Repayment };
  getClientById: (id: string) => ClientWithStats | undefined;
  getLoanById: (id: string) => Loan | undefined;
  getClientLoans: (clientId: string) => Loan[];
  getLoanRepayments: (loanId: string) => Repayment[];
  getNextLoanReference: () => string;
  getNextClientNumber: () => string;
  resetToSeedData: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEYS = {
  CLIENTS: 'inuka_clients_v1',
  LOANS: 'inuka_loans_v1',
  REPAYMENTS: 'inuka_repayments_v1',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_CLIENTS;
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOANS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return getInitialLoans();
  });

  const [repayments, setRepayments] = useState<Repayment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REPAYMENTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_REPAYMENTS;
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    } catch (e) {
      console.warn('Failed to save clients to storage', e);
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
    } catch (e) {
      console.warn('Failed to save loans to storage', e);
    }
  }, [loans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REPAYMENTS, JSON.stringify(repayments));
    } catch (e) {
      console.warn('Failed to save repayments to storage', e);
    }
  }, [repayments]);

  // Derived client statistics
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

  // Summary Metrics calculated dynamically from real data
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

  const addClient = (params: AddClientParams) => {
    const trimmedNumber = params.clientNumber.trim().toUpperCase();
    const trimmedName = params.fullName.trim();

    if (!trimmedNumber) {
      return { success: false, error: 'Client Number is required.' };
    }
    if (!trimmedName) {
      return { success: false, error: 'Full Name is required.' };
    }

    const exists = clients.some(
      (c) => c.clientNumber.toUpperCase() === trimmedNumber
    );
    if (exists) {
      return { success: false, error: `Client number "${trimmedNumber}" is already registered.` };
    }

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      clientNumber: trimmedNumber,
      fullName: trimmedName,
      phone: params.phone?.trim() || undefined,
      email: params.email?.trim() || undefined,
      location: params.location?.trim() || 'Nairobi Central',
      dateRegistered: new Date().toISOString().split('T')[0],
      notes: params.notes?.trim() || undefined,
    };

    setClients((prev) => [newClient, ...prev]);
    return { success: true, client: newClient };
  };

  const addLoan = (params: AddLoanParams) => {
    const client = clients.find((c) => c.id === params.clientId);
    if (!client) {
      return { success: false, error: 'Selected client does not exist.' };
    }

    const principal = roundCurrency(Number(params.loanAmount));
    const totalDue = roundCurrency(Number(params.totalAmountDue));

    if (isNaN(principal) || principal <= 0) {
      return { success: false, error: 'Loan principal amount must be greater than KES 0.00.' };
    }
    if (isNaN(totalDue) || totalDue < principal) {
      return { success: false, error: 'Total amount due cannot be less than the loan principal amount.' };
    }

    const loanRef = getNextLoanReference();
    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      loanReference: loanRef,
      clientId: client.id,
      clientName: client.fullName,
      clientNumber: client.clientNumber,
      loanAmount: principal,
      totalAmountDue: totalDue,
      totalRepaid: 0,
      outstandingBalance: totalDue,
      loanDate: new Date().toISOString().split('T')[0],
      dueDate: params.dueDate || undefined,
      purpose: params.purpose?.trim() || 'Micro-enterprise operational capital',
      status: 'Outstanding',
    };

    setLoans((prev) => [newLoan, ...prev]);
    return { success: true, loan: newLoan };
  };

  const recordRepayment = (params: RecordRepaymentParams) => {
    const targetLoan = loans.find((l) => l.id === params.loanId);
    if (!targetLoan) {
      return { success: false, error: 'Selected loan record was not found.' };
    }

    const repaymentAmount = roundCurrency(Number(params.amount));
    if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
      return { success: false, error: 'Repayment amount must be strictly greater than KES 0.00.' };
    }

    if (repaymentAmount > targetLoan.outstandingBalance + 0.001) {
      return {
        success: false,
        error: `Repayment amount cannot exceed the current outstanding balance of KES ${targetLoan.outstandingBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}.`,
      };
    }

    const cleanRef = params.paymentReference.trim().toUpperCase();
    if (!cleanRef) {
      return { success: false, error: 'Payment reference / transaction code is required.' };
    }

    const refExists = repayments.some(
      (r) => r.paymentReference.toUpperCase() === cleanRef
    );
    if (refExists) {
      return { success: false, error: `Payment reference "${cleanRef}" has already been recorded.` };
    }

    if (!params.paymentDate) {
      return { success: false, error: 'Payment date is required.' };
    }

    const newTotalRepaid = roundCurrency(targetLoan.totalRepaid + repaymentAmount);
    const newOutstanding = roundCurrency(Math.max(0, targetLoan.totalAmountDue - newTotalRepaid));
    const newStatus = deriveLoanStatus(targetLoan.totalAmountDue, newTotalRepaid);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newRepayment: Repayment = {
      id: `rep-${Date.now()}`,
      paymentReference: cleanRef,
      loanId: targetLoan.id,
      loanReference: targetLoan.loanReference,
      clientId: targetLoan.clientId,
      clientName: targetLoan.clientName,
      paymentDate: params.paymentDate,
      amount: repaymentAmount,
      dateRecorded: `${params.paymentDate} ${timeStr}`,
      paymentMethod: params.paymentMethod || 'M-Pesa',
      notes: params.notes?.trim() || undefined,
    };

    // Update loan atomically
    setLoans((prev) =>
      prev.map((l) =>
        l.id === targetLoan.id
          ? {
              ...l,
              totalRepaid: newTotalRepaid,
              outstandingBalance: newOutstanding,
              status: newStatus,
            }
          : l
      )
    );

    // Append repayment
    setRepayments((prev) => [newRepayment, ...prev]);

    return { success: true, repayment: newRepayment };
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

  const resetToSeedData = () => {
    setClients(INITIAL_CLIENTS);
    setLoans(getInitialLoans());
    setRepayments(INITIAL_REPAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.LOANS);
    localStorage.removeItem(STORAGE_KEYS.REPAYMENTS);
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
        addClient,
        addLoan,
        recordRepayment,
        getClientById,
        getLoanById,
        getClientLoans,
        getLoanRepayments,
        getNextLoanReference,
        getNextClientNumber,
        resetToSeedData,
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

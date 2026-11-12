import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppRoute =
  | 'dashboard'
  | 'clients'
  | 'client-details'
  | 'loans'
  | 'loan-details'
  | 'repayments'
  | 'ai-chat'
  | 'ai-reports'
  | 'risk-monitor'
  | 'reports'
  | 'settings'
  | 'database-schema';

interface NavigationContextType {
  currentRoute: AppRoute;
  selectedClientId: string | null;
  selectedLoanId: string | null;
  navigateTo: (route: AppRoute, params?: { clientId?: string; loanId?: string }) => void;
  // Modal control
  isClientModalOpen: boolean;
  openClientModal: () => void;
  closeClientModal: () => void;
  isLoanModalOpen: boolean;
  preselectedClientIdForLoan: string | null;
  openLoanModal: (clientId?: string) => void;
  closeLoanModal: () => void;
  isRepaymentModalOpen: boolean;
  preselectedLoanIdForRepayment: string | null;
  openRepaymentModal: (loanId?: string) => void;
  closeRepaymentModal: () => void;
  // Search & Global state
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [preselectedClientIdForLoan, setPreselectedClientIdForLoan] = useState<string | null>(null);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [preselectedLoanIdForRepayment, setPreselectedLoanIdForRepayment] = useState<string | null>(null);

  // Quick search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync hash on mount and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      const parts = hash.split('/');
      const base = parts[0] as AppRoute;

      if (base === 'clients' && parts[1]) {
        setCurrentRoute('client-details');
        setSelectedClientId(parts[1]);
      } else if (base === 'loans' && parts[1]) {
        setCurrentRoute('loan-details');
        setSelectedLoanId(parts[1]);
      } else if (
        ['dashboard', 'clients', 'loans', 'repayments', 'ai-chat', 'ai-reports', 'risk-monitor', 'reports', 'settings', 'database-schema'].includes(base)
      ) {
        setCurrentRoute(base);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: AppRoute, params?: { clientId?: string; loanId?: string }) => {
    setCurrentRoute(route);
    if (params?.clientId) {
      setSelectedClientId(params.clientId);
      window.location.hash = `#/clients/${params.clientId}`;
    } else if (params?.loanId) {
      setSelectedLoanId(params.loanId);
      window.location.hash = `#/loans/${params.loanId}`;
    } else {
      window.location.hash = `#/${route}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openClientModal = () => setIsClientModalOpen(true);
  const closeClientModal = () => setIsClientModalOpen(false);

  const openLoanModal = (clientId?: string) => {
    setPreselectedClientIdForLoan(clientId || null);
    setIsLoanModalOpen(true);
  };
  const closeLoanModal = () => {
    setIsLoanModalOpen(false);
    setPreselectedClientIdForLoan(null);
  };

  const openRepaymentModal = (loanId?: string) => {
    setPreselectedLoanIdForRepayment(loanId || null);
    setIsRepaymentModalOpen(true);
  };
  const closeRepaymentModal = () => {
    setIsRepaymentModalOpen(false);
    setPreselectedLoanIdForRepayment(null);
  };

  return (
    <NavigationContext.Provider
      value={{
        currentRoute,
        selectedClientId,
        selectedLoanId,
        navigateTo,
        isClientModalOpen,
        openClientModal,
        closeClientModal,
        isLoanModalOpen,
        preselectedClientIdForLoan,
        openLoanModal,
        closeLoanModal,
        isRepaymentModalOpen,
        preselectedLoanIdForRepayment,
        openRepaymentModal,
        closeRepaymentModal,
        searchQuery,
        setSearchQuery,
        isSearchOpen,
        setIsSearchOpen,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

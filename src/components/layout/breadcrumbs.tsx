import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useNavigation } from '../../lib/navigation';
import { useStore } from '../../lib/store';

export const Breadcrumbs: React.FC = () => {
  const { currentRoute, selectedClientId, selectedLoanId, navigateTo } = useNavigation();
  const { getClientById, getLoanById } = useStore();

  const client = selectedClientId ? getClientById(selectedClientId) : null;
  const loan = selectedLoanId ? getLoanById(selectedLoanId) : null;

  return (
    <nav className="flex items-center text-xs text-[#718078]" aria-label="Breadcrumb">
      <button
        onClick={() => navigateTo('dashboard')}
        className="flex items-center gap-1 hover:text-[#17231F] transition-colors cursor-pointer"
      >
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline">Home</span>
      </button>

      {currentRoute !== 'dashboard' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-300 shrink-0" />
          {currentRoute === 'clients' && (
            <span className="font-semibold text-[#17231F]">Clients</span>
          )}
          {currentRoute === 'client-details' && (
            <>
              <button
                onClick={() => navigateTo('clients')}
                className="hover:text-[#17231F] transition-colors cursor-pointer"
              >
                Clients
              </button>
              <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-300 shrink-0" />
              <span className="font-semibold text-[#17231F] truncate max-w-[140px] sm:max-w-none">
                {client ? `${client.clientNumber} (${client.fullName})` : 'Client Profile'}
              </span>
            </>
          )}
          {currentRoute === 'loans' && (
            <span className="font-semibold text-[#17231F]">Loans</span>
          )}
          {currentRoute === 'loan-details' && (
            <>
              <button
                onClick={() => navigateTo('loans')}
                className="hover:text-[#17231F] transition-colors cursor-pointer"
              >
                Loans
              </button>
              <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-300 shrink-0" />
              <span className="font-semibold text-[#17231F] font-mono">
                {loan ? loan.loanReference : 'Loan Details'}
              </span>
            </>
          )}
          {currentRoute === 'repayments' && (
            <span className="font-semibold text-[#17231F]">Repayments</span>
          )}
          {currentRoute === 'reports' && (
            <span className="font-semibold text-[#17231F]">Portfolio Reports</span>
          )}
          {currentRoute === 'settings' && (
            <span className="font-semibold text-[#17231F]">System Settings</span>
          )}
        </>
      )}
    </nav>
  );
};

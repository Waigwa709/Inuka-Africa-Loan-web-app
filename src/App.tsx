/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoreProvider } from './lib/store';
import { NavigationProvider, useNavigation } from './lib/navigation';
import { ToastProvider } from './components/shared/toast';
import { AppSidebar } from './components/layout/app-sidebar';
import { MobileSidebar } from './components/layout/mobile-sidebar';
import { AppHeader } from './components/layout/app-header';
import { QuickSearchModal } from './components/layout/quick-search';
import { DashboardView } from './components/dashboard/dashboard-view';
import { ClientsTableView } from './components/clients/clients-table';
import { ClientDetailsView } from './components/clients/client-details';
import { LoansTableView } from './components/loans/loans-table';
import { LoanDetailsView } from './components/loans/loan-details';
import { RepaymentsTableView } from './components/repayments/repayments-table';
import { ReportsView } from './components/reports/reports-view';
import { SettingsView } from './components/settings/settings-view';
import { ClientFormModal } from './components/clients/client-form';
import { LoanFormModal } from './components/loans/loan-form';
import { RepaymentFormModal } from './components/repayments/repayment-form';

const AppContent: React.FC = () => {
  const {
    currentRoute,
    selectedClientId,
    selectedLoanId,
    isClientModalOpen,
    closeClientModal,
    isLoanModalOpen,
    preselectedClientIdForLoan,
    closeLoanModal,
    isRepaymentModalOpen,
    preselectedLoanIdForRepayment,
    closeRepaymentModal,
    navigateTo,
  } = useNavigation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F5F7F6] text-[#17231F]">
      {/* Desktop Sidebar */}
      <AppSidebar
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Mobile Drawer */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <AppHeader onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto pb-12">
            {currentRoute === 'dashboard' && <DashboardView />}
            {currentRoute === 'clients' && <ClientsTableView />}
            {currentRoute === 'client-details' && selectedClientId && (
              <ClientDetailsView clientId={selectedClientId} />
            )}
            {currentRoute === 'loans' && <LoansTableView />}
            {currentRoute === 'loan-details' && selectedLoanId && (
              <LoanDetailsView loanId={selectedLoanId} />
            )}
            {currentRoute === 'repayments' && <RepaymentsTableView />}
            {currentRoute === 'reports' && <ReportsView />}
            {currentRoute === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Modals & Overlays */}
      <ClientFormModal
        isOpen={isClientModalOpen}
        onClose={closeClientModal}
        onSuccess={(newClientId) => {
          navigateTo('client-details', { clientId: newClientId });
        }}
      />

      <LoanFormModal
        isOpen={isLoanModalOpen}
        preselectedClientId={preselectedClientIdForLoan}
        onClose={closeLoanModal}
        onSuccess={(newLoanId) => {
          navigateTo('loan-details', { loanId: newLoanId });
        }}
      />

      <RepaymentFormModal
        isOpen={isRepaymentModalOpen}
        preselectedLoanId={preselectedLoanIdForRepayment}
        onClose={closeRepaymentModal}
        onSuccess={() => {
          // Stay on active view, data updates automatically reactively
        }}
      />

      <QuickSearchModal />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <NavigationProvider>
          <AppContent />
        </NavigationProvider>
      </StoreProvider>
    </ToastProvider>
  );
}

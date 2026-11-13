import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { NavigationProvider, useNavigation } from './lib/navigation';
import { ToastProvider } from './components/shared/toast';
import { ErrorBoundary } from './components/shared/error-boundary';
import { SettingsProvider } from './lib/settings';
import { AuthProvider, useAuth } from './lib/auth';
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
import { AIChatAssistant } from './components/ai/ai-chat-assistant';
import { AIReportGenerator } from './components/ai/ai-report-generator';
import { RiskMonitoringDashboard } from './components/ai/risk-monitoring-dashboard';
import { ClientFormModal } from './components/clients/client-form';
import { LoanFormModal } from './components/loans/loan-form';
import { RepaymentFormModal } from './components/repayments/repayment-form';
import { LoginPage } from './components/auth/login-page';
import { SignupPage } from './components/auth/signup-page';
import { ForgotPasswordPage } from './components/auth/forgot-password-page';
import { ProfileEditModal } from './components/auth/profile-edit-modal';

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

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { refreshData } = useStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [authPage, setAuthPage] = useState<'login' | 'signup' | 'forgot-password'>('login');

  // Load portfolio data once the user is authenticated (the store skips
  // fetching when no session token exists).
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, refreshData]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7F6]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2E7542]/30 border-t-[#2E7542] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#718078]">Loading Inuka Africa...</p>
        </div>
      </div>
    );
  }

  // Show auth pages if not authenticated
  if (!isAuthenticated) {
    if (authPage === 'signup') {
      return <SignupPage onSwitchToLogin={() => setAuthPage('login')} />;
    }
    if (authPage === 'forgot-password') {
      return <ForgotPasswordPage onSwitchToLogin={() => setAuthPage('login')} />;
    }
    return (
      <LoginPage
        onSwitchToSignup={() => setAuthPage('signup')}
        onSwitchToForgotPassword={() => setAuthPage('forgot-password')}
      />
    );
  }

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
        <AppHeader
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto pb-12">
            <ErrorBoundary>
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
            {currentRoute === 'ai-chat' && <AIChatAssistant />}
            {currentRoute === 'ai-reports' && <AIReportGenerator />}
            {currentRoute === 'risk-monitor' && <RiskMonitoringDashboard />}
            {currentRoute === 'reports' && <ReportsView />}
            {currentRoute === 'settings' && <SettingsView />}
            </ErrorBoundary>
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

      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <QuickSearchModal />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SettingsProvider>
        <StoreProvider>
          <NavigationProvider>
            <AppContent />
          </NavigationProvider>
        </StoreProvider>
        </SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

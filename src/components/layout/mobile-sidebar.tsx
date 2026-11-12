import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  X,
  PlusCircle,
  Sparkles,
  FileSpreadsheet,
  ShieldAlert,
} from 'lucide-react';
import { InukaLogo } from './inuka-logo';
import { useNavigation, AppRoute } from '../../lib/navigation';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  const { currentRoute, navigateTo, openLoanModal } = useNavigation();

  if (!isOpen) return null;

  const handleNav = (route: AppRoute) => {
    navigateTo(route);
    onClose();
  };

  const navItemsMain = [
    { id: 'dashboard' as AppRoute, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients' as AppRoute, label: 'Clients', icon: Users },
    { id: 'loans' as AppRoute, label: 'Loans', icon: FileText },
    { id: 'repayments' as AppRoute, label: 'Repayments', icon: CreditCard },
  ];

  const navItemsAI = [
    { id: 'ai-chat' as AppRoute, label: 'AI Financial Assistant', icon: Sparkles },
    { id: 'ai-reports' as AppRoute, label: 'AI Management Reports', icon: FileSpreadsheet },
    { id: 'risk-monitor' as AppRoute, label: 'Repayment Risk Monitor', icon: ShieldAlert },
  ];

  const navItemsManagement = [
    { id: 'reports' as AppRoute, label: 'Portfolio Overview', icon: BarChart3 },
    { id: 'settings' as AppRoute, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-72 max-w-[85vw] bg-[#111827] text-slate-300 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          <InukaLogo theme="dark" />
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 py-5 px-4 space-y-6 overflow-y-auto">
          <button
            onClick={() => {
              onClose();
              openLoanModal();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold text-white bg-[#287A46] hover:bg-[#1E6337] rounded-lg transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Loan</span>
          </button>

          <div>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Main
            </p>
            <nav className="space-y-1">
              {navItemsMain.map((item) => {
                const active =
                  currentRoute === item.id ||
                  (item.id === 'clients' && currentRoute === 'client-details') ||
                  (item.id === 'loans' && currentRoute === 'loan-details');
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                      active
                        ? 'bg-[#287A46]/20 text-[#34D399] font-semibold border-l-2 border-[#34D399]'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[#34D399]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#34D399] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#34D399]" />
              <span>AI Insights</span>
            </p>
            <nav className="space-y-1">
              {navItemsAI.map((item) => {
                const active = currentRoute === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                      active
                        ? 'bg-[#287A46]/20 text-[#34D399] font-semibold border-l-2 border-[#34D399]'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[#34D399]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Management
            </p>
            <nav className="space-y-1">
              {navItemsManagement.map((item) => {
                const active = currentRoute === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                      active
                        ? 'bg-[#287A46]/20 text-[#34D399] font-semibold border-l-2 border-[#34D399]'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[#34D399]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <p className="text-[11px] text-slate-400 font-medium">Inuka Africa Limited</p>
          <p className="text-[10px] text-slate-400 italic">Making Growth Possible.</p>
        </div>
      </div>
    </div>
  );
};

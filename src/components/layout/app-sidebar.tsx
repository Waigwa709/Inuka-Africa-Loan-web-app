import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  HelpCircle,
  Sparkles,
  FileSpreadsheet,
  ShieldAlert,
} from 'lucide-react';
import { InukaLogo } from './inuka-logo';
import { useNavigation, AppRoute } from '../../lib/navigation';

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const { currentRoute, navigateTo, openLoanModal } = useNavigation();

  const isMainActive = (route: AppRoute) => {
    if (route === 'clients' && currentRoute === 'client-details') return true;
    if (route === 'loans' && currentRoute === 'loan-details') return true;
    return currentRoute === route;
  };

  const navItemsMain = [
    { id: 'dashboard' as AppRoute, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients' as AppRoute, label: 'Clients', icon: Users },
    { id: 'loans' as AppRoute, label: 'Loans', icon: FileText },
    { id: 'repayments' as AppRoute, label: 'Repayments', icon: CreditCard },
  ];

  const navItemsAI = [
    { id: 'ai-chat' as AppRoute, label: 'AI Financial Assistant', icon: Sparkles, badge: 'AI' },
    { id: 'ai-reports' as AppRoute, label: 'AI Management Reports', icon: FileSpreadsheet, badge: 'AI' },
    { id: 'risk-monitor' as AppRoute, label: 'Repayment Risk Monitor', icon: ShieldAlert, badge: 'Rule-Based' },
  ];

  const navItemsManagement = [
    { id: 'reports' as AppRoute, label: 'Portfolio Overview', icon: BarChart3 },
    { id: 'settings' as AppRoute, label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#111827] text-slate-300 border-r border-slate-800 transition-all duration-300 ease-in-out shrink-0 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
      aria-label="Main Navigation Sidebar"
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
        <InukaLogo collapsed={collapsed} theme="dark" />
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto">
        {/* Quick action button */}
        {!collapsed ? (
          <button
            onClick={() => openLoanModal()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-[#2E7542] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Loan</span>
          </button>
        ) : (
          <button
            onClick={() => openLoanModal()}
            title="Register Loan"
            className="w-full flex items-center justify-center p-2 text-white bg-[#2E7542] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        )}

        {/* MAIN SECTION */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Main
            </p>
          )}
          <nav className="space-y-1">
            {navItemsMain.map((item) => {
              const active = isMainActive(item.id);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                    active
                      ? 'bg-[#2E7542]/20 text-[#34D399] font-semibold border-l-2 border-[#34D399]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? 'text-[#34D399]' : 'text-slate-400'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI CAPABILITIES & INSIGHTS SECTION */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#34D399] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#34D399]" />
              <span>AI Insights</span>
            </p>
          )}
          <nav className="space-y-1">
            {navItemsAI.map((item) => {
              const active = currentRoute === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                    active
                      ? 'bg-[#2E7542]/25 text-[#34D399] font-semibold border-l-2 border-[#34D399]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-[#34D399]' : 'text-slate-400'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-white/10 text-slate-300 border border-white/10">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* MANAGEMENT SECTION */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Management
            </p>
          )}
          <nav className="space-y-1">
            {navItemsManagement.map((item) => {
              const active = currentRoute === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                    active
                      ? 'bg-[#2E7542]/20 text-[#34D399] font-semibold border-l-2 border-[#34D399]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? 'text-[#34D399]' : 'text-slate-400'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Tagline & Institution Info */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Support: +254 700 000 000</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 italic">
            Making Growth Possible.
          </p>
        </div>
      )}
    </aside>
  );
};

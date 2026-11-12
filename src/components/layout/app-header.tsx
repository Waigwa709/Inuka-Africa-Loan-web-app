import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Building2,
  Check,
} from 'lucide-react';
import { Breadcrumbs } from './breadcrumbs';
import { useNavigation } from '../../lib/navigation';
import { useToast } from '../shared/toast';

interface AppHeaderProps {
  onOpenMobileMenu: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenMobileMenu }) => {
  const { setIsSearchOpen, navigateTo } = useNavigation();
  const { info } = useToast();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left zone: Mobile toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Breadcrumbs />
      </div>

      {/* Right zone: Search trigger, Notifications, User profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Quick Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#718078] bg-[#F5F7F6] hover:bg-slate-100 border border-[#E5E7EB] rounded-lg transition-colors cursor-pointer"
          title="Search clients, loans or payment references"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Search records...</span>
          <kbd className="hidden sm:inline-flex items-center text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Icon (Visual placeholder with active dropdown) */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E92F2B] rounded-full" />
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#E5E7EB] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#17231F]">Notifications</span>
                <span className="text-[10px] text-[#287A46] font-medium bg-[#E7F3EA] px-2 py-0.5 rounded-full">
                  2 unread
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                <div className="p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-[#287A46] shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#17231F]">
                        Repayment recorded: Grace Wanjiru
                      </p>
                      <p className="text-[11px] text-[#718078] mt-0.5">
                        KES 70,000.00 received via M-Pesa (MPX445969B)
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">15 mins ago</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-[#D99A30] shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#17231F]">
                        Upcoming Loan Due: LN-2024-003
                      </p>
                      <p className="text-[11px] text-[#718078] mt-0.5">
                        Faith Chebet Korir installment due in 5 days
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-3 pt-2 pb-1 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    info('Notifications marked as read');
                  }}
                  className="text-xs text-[#287A46] font-medium hover:underline cursor-pointer"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
          >
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
              <img
                src="/src/assets/images/avatar_operations_admin_1794488664702.jpg"
                alt="Operations Admin"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#17231F] leading-tight">
                Operations Admin
              </span>
              <span className="text-[11px] text-[#718078] leading-tight">
                Administrator
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#E5E7EB] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-[#17231F]">Operations Admin</p>
                <p className="text-[11px] text-[#718078] truncate">admin.ops@inukaafrica.com</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-[#287A46] font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Staff Role</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigateTo('settings');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#17231F] hover:bg-slate-50 transition-colors cursor-pointer text-left"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profile & Preferences</span>
                </button>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigateTo('settings');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#17231F] hover:bg-slate-50 transition-colors cursor-pointer text-left"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nairobi Head Office</span>
                  <Check className="w-3 h-3 text-[#287A46] ml-auto" />
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    info('Session active: Admin role cannot be signed out during assessment evaluation.');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#E92F2B] hover:bg-red-50 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#E92F2B]" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

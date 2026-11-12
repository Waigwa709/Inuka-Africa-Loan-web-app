import React, { useState, useEffect } from 'react';
import { Search, X, Users, FileText, CreditCard, ArrowRight } from 'lucide-react';
import { useNavigation } from '../../lib/navigation';
import { useStore } from '../../lib/store';
import { formatKES } from '../../lib/currency';

export const QuickSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, navigateTo } = useNavigation();
  const { clientsWithStats, loans, repayments } = useStore();
  const [query, setQuery] = useState('');

  // Keyboard shortcut Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const matchedClients = trimmed
    ? clientsWithStats.filter(
        (c) =>
          c.fullName.toLowerCase().includes(trimmed) ||
          c.clientNumber.toLowerCase().includes(trimmed) ||
          (c.location && c.location.toLowerCase().includes(trimmed))
      ).slice(0, 4)
    : [];

  const matchedLoans = trimmed
    ? loans.filter(
        (l) =>
          l.loanReference.toLowerCase().includes(trimmed) ||
          l.clientName.toLowerCase().includes(trimmed) ||
          l.clientNumber.toLowerCase().includes(trimmed)
      ).slice(0, 4)
    : [];

  const matchedRepayments = trimmed
    ? repayments.filter(
        (r) =>
          r.paymentReference.toLowerCase().includes(trimmed) ||
          r.clientName.toLowerCase().includes(trimmed) ||
          r.loanReference.toLowerCase().includes(trimmed)
      ).slice(0, 4)
    : [];

  const handleSelectClient = (clientId: string) => {
    setIsSearchOpen(false);
    setQuery('');
    navigateTo('client-details', { clientId });
  };

  const handleSelectLoan = (loanId: string) => {
    setIsSearchOpen(false);
    setQuery('');
    navigateTo('loan-details', { loanId });
  };

  const handleSelectRepayment = () => {
    setIsSearchOpen(false);
    setQuery('');
    navigateTo('repayments');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsSearchOpen(false)}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3 border-b border-[#E5E7EB]">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a client name, loan number (e.g. LN-2024-001) or M-Pesa ref..."
            className="w-full text-sm text-[#17231F] placeholder-slate-400 focus:outline-hidden"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
          {!trimmed && (
            <div className="p-6 text-center text-xs text-[#718078]">
              Quickly find clients by name or client code, loans by reference, or repayments by M-Pesa ID.
            </div>
          )}

          {trimmed && matchedClients.length === 0 && matchedLoans.length === 0 && matchedRepayments.length === 0 && (
            <div className="p-6 text-center text-xs text-[#718078]">
              No financial records found matching &ldquo;{query}&rdquo;
            </div>
          )}

          {matchedClients.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                Clients ({matchedClients.length})
              </span>
              <div className="mt-1 space-y-1">
                {matchedClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectClient(c.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#E7F3EA]/50 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-[#2E7542]" />
                      <div>
                        <p className="text-xs font-semibold text-[#17231F] group-hover:text-[#2E7542]">
                          {c.fullName}
                        </p>
                        <p className="text-[11px] text-[#718078] font-mono">
                          {c.clientNumber} · {c.location || 'Nairobi'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#2E7542] transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedLoans.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                Loans ({matchedLoans.length})
              </span>
              <div className="mt-1 space-y-1">
                {matchedLoans.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleSelectLoan(l.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#E7F3EA]/50 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-[#2E7542]" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#17231F] font-mono group-hover:text-[#2E7542]">
                            {l.loanReference}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500">
                            {l.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#718078]">
                          {l.clientName} · Due: {formatKES(l.totalAmountDue)}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#2E7542] transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedRepayments.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                Repayments ({matchedRepayments.length})
              </span>
              <div className="mt-1 space-y-1">
                {matchedRepayments.map((r) => (
                  <button
                    key={r.id}
                    onClick={handleSelectRepayment}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#E7F3EA]/50 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-[#2E7542]" />
                      <div>
                        <p className="text-xs font-semibold text-[#17231F] font-mono group-hover:text-[#2E7542]">
                          {r.paymentReference}
                        </p>
                        <p className="text-[11px] text-[#718078]">
                          {r.clientName} · {formatKES(r.amount)} on {r.paymentDate}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#2E7542] transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-50 border-t border-[#E5E7EB] text-[11px] text-slate-500 flex items-center justify-between">
          <span>Inuka Africa Internal Search</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};

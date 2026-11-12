import React, { useState, useEffect, useMemo } from 'react';
import { X, FilePlus2, AlertCircle, Info, Calculator, Check } from 'lucide-react';
import { useStore } from '../../lib/store';
import { useToast } from '../shared/toast';
import { formatKES, roundCurrency } from '../../lib/currency';

interface LoanFormModalProps {
  isOpen: boolean;
  preselectedClientId?: string | null;
  onClose: () => void;
  onSuccess?: (loanId: string) => void;
}

export const LoanFormModal: React.FC<LoanFormModalProps> = ({
  isOpen,
  preselectedClientId,
  onClose,
  onSuccess,
}) => {
  const { clients, addLoan, getNextLoanReference } = useStore();
  const { success, error: toastError } = useToast();

  const [selectedClientId, setSelectedClientId] = useState<string>(preselectedClientId || '');
  const [clientSearch, setClientSearch] = useState('');
  const [loanAmount, setLoanAmount] = useState<string>('200000');
  const [totalAmountDue, setTotalAmountDue] = useState<string>('228000'); // Default 14% flat interest / admin fee
  const [purpose, setPurpose] = useState('Stock inventory replenishment');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedClientId) {
      setSelectedClientId(preselectedClientId);
    } else if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [preselectedClientId, clients, selectedClientId]);

  // Derived selected client
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Financial calculations
  const numPrincipal = roundCurrency(parseFloat(loanAmount) || 0);
  const numTotalDue = roundCurrency(parseFloat(totalAmountDue) || 0);
  const difference = roundCurrency(Math.max(0, numTotalDue - numPrincipal));
  const interestPercentage = numPrincipal > 0 ? ((difference / numPrincipal) * 100).toFixed(1) : '0.0';

  // Quick preset helper
  const handlePrincipalChange = (val: string) => {
    setLoanAmount(val);
    const p = parseFloat(val);
    if (!isNaN(p) && p > 0) {
      // Suggest default 14% institutional margin
      const defaultTotal = Math.round(p * 1.14);
      setTotalAmountDue(String(defaultTotal));
    }
    if (errors.loanAmount || errors.totalAmountDue) {
      setErrors((prev) => ({ ...prev, loanAmount: '', totalAmountDue: '' }));
    }
  };

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const term = clientSearch.toLowerCase();
    return clients.filter(
      (c) =>
        c.fullName.toLowerCase().includes(term) ||
        c.clientNumber.toLowerCase().includes(term) ||
        (c.location && c.location.toLowerCase().includes(term))
    );
  }, [clients, clientSearch]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!selectedClientId) {
      errs.clientId = 'Please select a registered client.';
    }
    if (isNaN(numPrincipal) || numPrincipal <= 0) {
      errs.loanAmount = 'Loan principal amount must be greater than KES 0.00.';
    }
    if (isNaN(numTotalDue) || numTotalDue < numPrincipal) {
      errs.totalAmountDue = 'Total amount due cannot be less than the principal amount.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const res = addLoan({
      clientId: selectedClientId,
      loanAmount: numPrincipal,
      totalAmountDue: numTotalDue,
      purpose,
      dueDate,
    });

    setIsSubmitting(false);

    if (res.success && res.loan) {
      success('Loan Registered Successfully', `Loan reference ${res.loan.loanReference} created for ${res.loan.clientName}.`);
      onClose();
      if (onSuccess) onSuccess(res.loan.id);
    } else {
      toastError('Registration Failed', res.error || 'Could not register loan.');
    }
  };

  const autoRef = getNextLoanReference();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#F5F7F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E7F3EA] text-[#287A46] flex items-center justify-center">
              <FilePlus2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#17231F]">Register Loan</h2>
                <span className="text-xs font-mono font-semibold bg-white border border-[#E5E7EB] text-[#287A46] px-2 py-0.5 rounded">
                  {autoRef}
                </span>
              </div>
              <p className="text-xs text-[#718078]">Create a new principal loan facility and repayment schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* SECTION 1: CLIENT INFORMATION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#718078]">
                Section 1: Client Information
              </h3>
              {selectedClient && (
                <span className="text-xs font-semibold text-[#287A46]">
                  {selectedClient.clientNumber}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17231F] mb-1">
                Select Client <span className="text-[#E92F2B]">*</span>
              </label>

              {/* Client picker with quick search */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Filter client list by name or number..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
                />

                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    if (errors.clientId) setErrors((prev) => ({ ...prev, clientId: '' }));
                  }}
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white ${
                    errors.clientId ? 'border-[#E92F2B]' : 'border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46]'
                  } focus:outline-hidden`}
                >
                  <option value="">-- Choose registered client --</option>
                  {filteredClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clientNumber} — {c.fullName} ({c.location || 'Nairobi'})
                    </option>
                  ))}
                </select>
              </div>

              {errors.clientId && (
                <p className="mt-1 text-xs text-[#E92F2B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.clientId}
                </p>
              )}

              {/* Selected Client Card Summary */}
              {selectedClient && (
                <div className="mt-2.5 p-3 rounded-lg bg-[#E7F3EA]/40 border border-[#C6E5CD] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#17231F]">{selectedClient.fullName}</span>
                    <span className="text-[#718078] ml-2">({selectedClient.clientNumber})</span>
                    <p className="text-[11px] text-[#718078] mt-0.5">{selectedClient.location} · {selectedClient.phone || 'No phone'}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#287A46] font-medium text-[11px]">
                    <Check className="w-3.5 h-3.5" />
                    <span>Client verified</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: LOAN INFORMATION */}
          <div className="space-y-3">
            <div className="border-b border-slate-100 pb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#718078]">
                Section 2: Loan Financials
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#17231F] mb-1">
                  Loan Principal Amount (KES) <span className="text-[#E92F2B]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono font-medium text-slate-400">
                    KES
                  </span>
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    value={loanAmount}
                    onChange={(e) => handlePrincipalChange(e.target.value)}
                    className={`w-full pl-12 pr-3 py-2 text-sm rounded-lg border font-mono ${
                      errors.loanAmount ? 'border-[#E92F2B]' : 'border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46]'
                    } focus:outline-hidden`}
                    placeholder="200000"
                  />
                </div>
                {errors.loanAmount && (
                  <p className="mt-1 text-xs text-[#E92F2B] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.loanAmount}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17231F] mb-1">
                  Total Amount Due (KES) <span className="text-[#E92F2B]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono font-medium text-slate-400">
                    KES
                  </span>
                  <input
                    type="number"
                    step="100"
                    min="1000"
                    value={totalAmountDue}
                    onChange={(e) => {
                      setTotalAmountDue(e.target.value);
                      if (errors.totalAmountDue) setErrors((prev) => ({ ...prev, totalAmountDue: '' }));
                    }}
                    className={`w-full pl-12 pr-3 py-2 text-sm rounded-lg border font-mono ${
                      errors.totalAmountDue ? 'border-[#E92F2B]' : 'border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46]'
                    } focus:outline-hidden`}
                    placeholder="228000"
                  />
                </div>
                {errors.totalAmountDue && (
                  <p className="mt-1 text-xs text-[#E92F2B] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.totalAmountDue}
                  </p>
                )}
              </div>
            </div>

            {/* Read-Only Difference Box (Required by specification) */}
            <div className="p-3.5 bg-[#F5F7F6] rounded-lg border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#287A46]" />
                <div>
                  <span className="text-xs font-semibold text-[#17231F]">
                    Interest & Institutional Margin:
                  </span>
                  <p className="text-[11px] text-[#718078]">
                    Calculated difference (Total Due − Principal)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-[#287A46]">
                  {formatKES(difference)}
                </div>
                <div className="text-[10px] text-[#718078] font-mono">
                  +{interestPercentage}% margin
                </div>
              </div>
            </div>

            {/* Purpose & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#17231F] mb-1">
                  Maturity Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17231F] mb-1">
                  Loan Purpose / Use Case
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
                  placeholder="e.g. Agricultural fertilizer inventory"
                />
              </div>
            </div>
          </div>

          {/* Validation note */}
          <div className="flex items-start gap-2 text-xs text-[#718078] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <Info className="w-3.5 h-3.5 text-[#287A46] shrink-0 mt-0.5" />
            <span>
              Initial loan status will be automatically marked as <strong>Outstanding</strong> with KES 0.00 repaid.
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#287A46] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useStore } from '../../lib/store';
import { useToast } from '../shared/toast';
import { formatKES, roundCurrency } from '../../lib/currency';

interface RepaymentFormModalProps {
  isOpen: boolean;
  preselectedLoanId?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RepaymentFormModal: React.FC<RepaymentFormModalProps> = ({
  isOpen,
  preselectedLoanId,
  onClose,
  onSuccess,
}) => {
  const { loans, recordRepayment } = useStore();
  const { success, error: toastError } = useToast();

  // Active loans that have an outstanding balance
  const activeLoans = loans.filter((l) => l.outstandingBalance > 0);

  const [selectedLoanId, setSelectedLoanId] = useState<string>(preselectedLoanId || '');
  const [amount, setAmount] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<'M-Pesa' | 'Bank Transfer' | 'Cash / Cheque'>('M-Pesa');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedLoanId) {
      setSelectedLoanId(preselectedLoanId);
    } else if (activeLoans.length > 0 && !selectedLoanId) {
      setSelectedLoanId(activeLoans[0].id);
    }
  }, [preselectedLoanId, activeLoans, selectedLoanId]);

  // Set default sample amount to 50% or full when loan changes
  useEffect(() => {
    const loan = loans.find((l) => l.id === selectedLoanId);
    if (loan && loan.outstandingBalance > 0) {
      // suggest installment
      const suggested = Math.min(loan.outstandingBalance, 50000);
      setAmount(String(suggested));
      // Auto suggest M-Pesa format code for convenience
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      setPaymentReference(`MPX${Date.now().toString().slice(-4)}${randomSuffix}`);
    }
  }, [selectedLoanId]);

  if (!isOpen) return null;

  const currentLoan = loans.find((l) => l.id === selectedLoanId);
  const numericAmount = roundCurrency(parseFloat(amount) || 0);

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!selectedLoanId || !currentLoan) {
      errs.loanId = 'Please select a loan with an outstanding balance.';
      setErrors(errs);
      return false;
    }

    if (isNaN(numericAmount) || numericAmount <= 0) {
      errs.amount = 'Repayment amount must be greater than KES 0.00.';
    } else if (numericAmount > currentLoan.outstandingBalance + 0.001) {
      errs.amount = `Repayment amount cannot exceed current outstanding balance (${formatKES(
        currentLoan.outstandingBalance
      )}).`;
    }

    if (!paymentReference.trim()) {
      errs.paymentReference = 'Payment Reference / M-Pesa Transaction ID is required.';
    }

    if (!paymentDate) {
      errs.paymentDate = 'Payment date is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const res = await recordRepayment({
      loanId: selectedLoanId,
      amount: numericAmount,
      paymentReference,
      paymentDate,
      paymentMethod,
      notes,
    });

    setIsSubmitting(false);

    if (res.success && res.repayment) {
      success(
        'Repayment Recorded Successfully',
        `${formatKES(numericAmount)} applied to ${currentLoan?.loanReference} (${currentLoan?.clientName}).`
      );
      onClose();
      if (onSuccess) onSuccess();
    } else {
      toastError('Repayment Failed', res.error || 'Could not process repayment.');
      if (res.error) {
        setErrors((prev) => ({ ...prev, amount: res.error || '' }));
      }
    }
  };

  const handlePayFull = () => {
    if (currentLoan) {
      setAmount(String(currentLoan.outstandingBalance));
      if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#F5F7F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E7F3EA] text-[#287A46] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#17231F]">Record Repayment</h2>
              <p className="text-xs text-[#718078]">Log incoming borrower payment to reduce loan balance</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Loan Selector (if multiple) */}
          <div>
            <label className="block text-xs font-semibold text-[#17231F] mb-1">
              Select Loan Facility <span className="text-[#E92F2B]">*</span>
            </label>
            <select
              value={selectedLoanId}
              onChange={(e) => {
                setSelectedLoanId(e.target.value);
                if (errors.loanId) setErrors((prev) => ({ ...prev, loanId: '' }));
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] bg-white focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
            >
              {activeLoans.length === 0 ? (
                <option value="">No active loans with outstanding balance</option>
              ) : (
                activeLoans.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.loanReference} — {l.clientName} (Bal: {formatKES(l.outstandingBalance)})
                  </option>
                ))
              )}
            </select>
            {errors.loanId && (
              <p className="mt-1 text-xs text-[#E92F2B]">{errors.loanId}</p>
            )}
          </div>

          {/* Read-Only Details Panel */}
          {currentLoan ? (
            <div className="p-4 bg-[#F5F7F6] rounded-xl border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#718078]">Loan Reference:</span>
                <span className="font-mono font-semibold text-[#17231F] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
                  {currentLoan.loanReference}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#718078]">Borrower Name:</span>
                <span className="font-semibold text-[#17231F]">{currentLoan.clientName} ({currentLoan.clientNumber})</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-slate-200/80 pt-2">
                <span className="font-semibold text-[#17231F]">Current Outstanding Balance:</span>
                <span className="font-mono font-bold text-sm text-[#E92F2B]">
                  {formatKES(currentLoan.outstandingBalance)}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
              Please select a valid loan
            </div>
          )}

          {/* Repayment Amount with Quick Action */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#17231F]">
                Repayment Amount (KES) <span className="text-[#E92F2B]">*</span>
              </label>
              {currentLoan && currentLoan.outstandingBalance > 0 && (
                <button
                  type="button"
                  onClick={handlePayFull}
                  className="text-[11px] font-semibold text-[#287A46] hover:underline cursor-pointer"
                >
                  Pay Full Balance ({formatKES(currentLoan.outstandingBalance)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-mono font-medium text-slate-400">
                KES
              </span>
              <input
                type="number"
                step="500"
                min="100"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                className={`w-full pl-12 pr-3 py-2 text-sm rounded-lg border font-mono ${
                  errors.amount ? 'border-[#E92F2B]' : 'border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46]'
                } focus:outline-hidden`}
                placeholder="50000"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-[#E92F2B] flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.amount}
              </p>
            )}
          </div>

          {/* Payment Reference & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17231F] mb-1">
                Payment Reference / M-Pesa ID <span className="text-[#E92F2B]">*</span>
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => {
                  setPaymentReference(e.target.value.toUpperCase());
                  if (errors.paymentReference) setErrors((prev) => ({ ...prev, paymentReference: '' }));
                }}
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                  errors.paymentReference ? 'border-[#E92F2B]' : 'border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46]'
                } focus:outline-hidden`}
                placeholder="e.g. MPX892147K"
              />
              {errors.paymentReference && (
                <p className="mt-1 text-xs text-[#E92F2B]">{errors.paymentReference}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17231F] mb-1">
                Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] bg-white focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
              >
                <option value="M-Pesa">M-Pesa (Paybill 400200)</option>
                <option value="Bank Transfer">Bank Transfer (RTGS / EFT)</option>
                <option value="Cash / Cheque">Branch Cash / Cheque</option>
              </select>
            </div>
          </div>

          {/* Payment Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17231F] mb-1">
                Payment Date <span className="text-[#E92F2B]">*</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
              />
              {errors.paymentDate && (
                <p className="mt-1 text-xs text-[#E92F2B]">{errors.paymentDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17231F] mb-1">
                Receipt Note
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Bi-weekly installment"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Remaining Balance Projection */}
          {currentLoan && numericAmount > 0 && numericAmount <= currentLoan.outstandingBalance && (
            <div className="p-3 bg-[#E7F3EA]/50 rounded-lg border border-[#C6E5CD] text-xs text-[#17231F] flex items-center justify-between">
              <span className="text-[#287A46] font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Remaining Balance after this payment:
              </span>
              <span className="font-mono font-bold text-[#17231F]">
                {formatKES(currentLoan.outstandingBalance - numericAmount)}
              </span>
            </div>
          )}

          {/* Actions */}
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
              disabled={isSubmitting || !currentLoan}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#287A46] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Record Repayment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Download, Printer, FileText, AlertTriangle } from 'lucide-react';
import { ReceiptData, generateReceiptPDF, ReceiptPreview } from '../../lib/receipt-generator';
import { useSettings } from '../../lib/settings';
import { useToast } from '../shared/toast';
import { useStore } from '../../lib/store';

class ReceiptErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Receipt render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-[#E4332C] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#17231F]">Unable to display receipt</h3>
          <p className="text-sm text-[#718078] mt-1">{this.state.message || 'An unexpected error occurred while rendering the receipt.'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  repayment: {
    id: string;
    paymentReference: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
    loanReference: string;
    loanPurpose: string;
    clientName: string;
    clientNumber: string;
    loanId: string;
  };
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  repayment,
}) => {
  const { settings } = useSettings();
  const { success, error: toastError } = useToast();
  const { loans, repayments } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loanDetails, setLoanDetails] = useState<any>(null);

  useEffect(() => {
    if (isOpen && repayment.loanId) {
      // Find loan details
      const loan = loans.find(l => l.id === repayment.loanId);
      setLoanDetails(loan);
      
      // Get all payments for this loan
      const loanPayments = repayments
        .filter(r => r.loanId === repayment.loanId)
        .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
      setPaymentHistory(loanPayments);
    }
  }, [isOpen, repayment.loanId, loans, repayments]);

  if (!isOpen) return null;

  const toNum = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const totalRepaid = paymentHistory.reduce((sum, p) => sum + toNum(p.amount), 0);
  const outstandingBalance = loanDetails ? Math.max(0, toNum(loanDetails.totalAmountDue) - totalRepaid) : 0;
  const totalPayments = paymentHistory.length;

  const receiptData: ReceiptData = {
    receiptNumber: `RCP-${repayment.paymentReference}`,
    paymentReference: repayment.paymentReference,
    clientName: repayment.clientName,
    clientNumber: repayment.clientNumber,
    loanReference: repayment.loanReference,
    loanPurpose: repayment.loanPurpose,
    amount: toNum(repayment.amount),
    paymentDate: repayment.paymentDate,
    paymentMethod: repayment.paymentMethod || 'M-Pesa',
    notes: repayment.notes,
    institutionName: settings.institutionName,
    tagline: settings.tagline,
    currencyCode: settings.currencyCode,
    totalPayments,
    paymentHistory: paymentHistory.map(p => ({
      date: p.paymentDate,
      amount: toNum(p.amount),
      method: p.paymentMethod || 'M-Pesa',
      reference: p.paymentReference,
    })),
    outstandingBalance,
    totalLoanAmount: toNum(loanDetails?.totalAmountDue),
    totalRepaid,
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      await generateReceiptPDF(receiptData);
      success('Receipt Generated', 'Payment receipt downloaded successfully.');
    } catch (err: any) {
      console.error('Receipt generation error:', err);
      toastError('Generation Failed', 'Could not generate receipt PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden z-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#F5F7F6] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E7F3EA] text-[#2E7542] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#17231F]">Payment Receipt</h2>
              <p className="text-sm text-[#718078]">Receipt for {repayment.paymentReference}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <ReceiptErrorBoundary>
            <ReceiptPreview data={receiptData} />
          </ReceiptErrorBoundary>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E7EB] bg-[#F5F7F6] shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2E7542] hover:bg-[#1E6337] rounded-lg transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

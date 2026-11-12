import React from 'react';
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  User,
  Clock,
  BadgeDollarSign,
  FileText,
  Percent,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { useNavigation } from '../../lib/navigation';
import { formatKES } from '../../lib/currency';
import { StatCard } from '../shared/stat-card';
import { StatusBadge } from '../shared/status-badge';
import { RepaymentProgress } from './repayment-progress';

interface LoanDetailsProps {
  loanId: string;
}

export const LoanDetailsView: React.FC<LoanDetailsProps> = ({ loanId }) => {
  const { getLoanById, getLoanRepayments } = useStore();
  const { navigateTo, openRepaymentModal } = useNavigation();

  const loan = getLoanById(loanId);
  const repayments = getLoanRepayments(loanId);

  if (!loan) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#E5E7EB]">
        <h2 className="text-base font-bold text-[#17231F]">Loan Not Found</h2>
        <p className="text-xs text-[#718078] mt-1">The requested loan facility does not exist or has been modified.</p>
        <button
          onClick={() => navigateTo('loans')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#287A46] rounded-lg"
        >
          Return to Loans
        </button>
      </div>
    );
  }

  const isCompleted = loan.status === 'Fully Paid';
  const interestAndFees = Math.max(0, loan.totalAmountDue - loan.loanAmount);

  return (
    <div className="space-y-6">
      {/* TOP SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('loans')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
            aria-label="Back to loans"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold font-mono tracking-tight text-[#17231F]">
                {loan.loanReference}
              </h1>
              <StatusBadge status={loan.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#718078]">
              <button
                onClick={() => navigateTo('client-details', { clientId: loan.clientId })}
                className="flex items-center gap-1 font-semibold text-[#17231F] hover:text-[#287A46] hover:underline cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-[#287A46]" />
                <span>{loan.clientName}</span>
                <span className="font-mono text-[11px] text-[#718078]">({loan.clientNumber})</span>
              </button>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Disbursed: <span className="font-mono">{loan.loanDate}</span>
              </span>
              {loan.dueDate && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Due Date: <span className="font-mono">{loan.dueDate}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3 shrink-0">
          {!isCompleted ? (
            <button
              onClick={() => openRepaymentModal(loan.id)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#287A46] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Repayment</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E7F3EA] text-[#287A46] text-xs font-semibold border border-[#C6E5CD]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Facility Fully Settled</span>
            </div>
          )}
        </div>
      </div>

      {/* Purpose & Operational Banner */}
      <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <FileCheck className="w-4 h-4 text-[#287A46] shrink-0" />
          <div>
            <span className="text-[#718078] block text-[11px]">Approved Credit Purpose:</span>
            <span className="font-medium text-[#17231F]">{loan.purpose || 'Working Capital'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
          <span>Interest / Margin: <strong className="text-slate-700">{formatKES(interestAndFees)}</strong></span>
          <span>·</span>
          <span>Terms: <strong>6 Months Micro-Installments</strong></span>
        </div>
      </div>

      {/* FINANCIAL SUMMARY — 4 FINANCIAL CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Principal Amount"
          value={formatKES(loan.loanAmount)}
          description="Original disbursed principal"
          icon={BadgeDollarSign}
          isCurrency
        />
        <StatCard
          title="Total Amount Due"
          value={formatKES(loan.totalAmountDue)}
          description="Principal plus financing margin"
          icon={FileText}
          isCurrency
        />
        <StatCard
          title="Total Repaid"
          value={formatKES(loan.totalRepaid)}
          description="Verified collections to date"
          icon={CreditCard}
          isCurrency
        />
        <StatCard
          title="Outstanding Balance"
          value={formatKES(loan.outstandingBalance)}
          description={loan.outstandingBalance === 0 ? 'Zero balance remaining' : 'Remaining balance due'}
          icon={Clock}
          isCurrency
        />
      </div>

      {/* REPAYMENT PROGRESS */}
      <RepaymentProgress
        totalAmountDue={loan.totalAmountDue}
        totalRepaid={loan.totalRepaid}
        outstandingBalance={loan.outstandingBalance}
      />

      {/* REPAYMENT HISTORY TABLE */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h2 className="text-sm font-bold text-[#17231F]">Repayment History</h2>
            <p className="text-xs text-[#718078]">
              Itemized ledger of all collections credited to this loan facility
            </p>
          </div>
          {!isCompleted && (
            <button
              onClick={() => openRepaymentModal(loan.id)}
              className="text-xs font-semibold text-[#287A46] hover:underline cursor-pointer"
            >
              + Record Repayment
            </button>
          )}
        </div>

        {repayments.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#718078] bg-slate-50 rounded-lg">
            <p>No repayment transactions recorded for this loan yet.</p>
            <p className="mt-1 text-[11px] text-slate-400">
              When a payment is received via M-Pesa or Bank transfer, click &ldquo;Record Repayment&rdquo; to update this record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" aria-label="Repayment Ledger">
              <thead>
                <tr className="border-b border-slate-100 text-[#718078]">
                  <th className="py-3 px-3 font-semibold">Payment Reference</th>
                  <th className="py-3 px-3 font-semibold">Channel</th>
                  <th className="py-3 px-3 font-semibold">Payment Date</th>
                  <th className="py-3 px-3 font-semibold text-right">Amount (KES)</th>
                  <th className="py-3 px-3 font-semibold">Date Recorded</th>
                  <th className="py-3 px-3 font-semibold">Notes / Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repayments.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-[#287A46]">
                      {rep.paymentReference}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 border border-slate-200">
                        {rep.paymentMethod || 'M-Pesa'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                      {rep.paymentDate}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#17231F] whitespace-nowrap">
                      {formatKES(rep.amount)}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {rep.dateRecorded}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {rep.notes || 'Institutional repayment receipt'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

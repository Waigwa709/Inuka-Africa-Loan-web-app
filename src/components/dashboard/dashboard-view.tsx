import React from 'react';
import {
  Users,
  FileText,
  BadgeDollarSign,
  Clock,
  PlusCircle,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../shared/stat-card';
import { StatusBadge } from '../shared/status-badge';
import { CurrencyDisplay } from '../shared/currency-display';
import { RepaymentOverviewChart } from './repayment-chart';
import { useStore } from '../../lib/store';
import { useNavigation } from '../../lib/navigation';
import { formatKES } from '../../lib/currency';

export const DashboardView: React.FC = () => {
  const {
    totalClientsCount,
    activeLoansCount,
    totalDisbursed,
    totalOutstandingBalance,
    loans,
    repayments,
  } = useStore();
  const { navigateTo, openLoanModal, openRepaymentModal } = useNavigation();

  // Recent 5 loans & repayments
  const recentLoans = loans.slice(0, 5);
  const recentRepayments = repayments.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17231F]">Dashboard</h1>
          <p className="mt-1 text-sm text-[#718078]">
            Monitor your loan portfolio, repayments and outstanding balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigateTo('ai-chat')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#287A46] bg-[#E7F3EA] hover:bg-[#C6E5CD] border border-[#C6E5CD] rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => navigateTo('ai-reports')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <span>AI Reports</span>
          </button>

          <button
            onClick={() => openLoanModal()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#287A46] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Loan</span>
          </button>
        </div>
      </div>

      {/* 4 SUMMARY STAT CARDS (Calculated dynamically) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={totalClientsCount}
          description="Registered active borrowers"
          icon={Users}
        />
        <StatCard
          title="Active Loans"
          value={activeLoansCount}
          description="Loans currently being tracked"
          icon={FileText}
        />
        <StatCard
          title="Total Amount Disbursed"
          value={formatKES(totalDisbursed)}
          description="Total principal amount issued"
          icon={BadgeDollarSign}
          isCurrency
        />
        <StatCard
          title="Outstanding Balance"
          value={formatKES(totalOutstandingBalance)}
          description="Amount remaining to be repaid"
          icon={Clock}
          isCurrency
        />
      </div>

      {/* CHART SECTION */}
      <RepaymentOverviewChart />

      {/* TWO COLUMN SECTION: RECENT LOANS & RECENT REPAYMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Repayments Table */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-[#17231F]">Recent Repayments</h2>
                <p className="text-xs text-[#718078]">Latest recorded collections and receipts</p>
              </div>
              <button
                onClick={() => navigateTo('repayments')}
                className="text-xs font-semibold text-[#287A46] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[#718078]">
                    <th className="py-2.5 font-semibold">Client Name</th>
                    <th className="py-2.5 font-semibold">Loan Ref</th>
                    <th className="py-2.5 font-semibold">Payment Ref</th>
                    <th className="py-2.5 font-semibold">Date</th>
                    <th className="py-2.5 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentRepayments.map((rep) => (
                    <tr
                      key={rep.id}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => navigateTo('loan-details', { loanId: rep.loanId })}
                    >
                      <td className="py-2.5 font-medium text-[#17231F] group-hover:text-[#287A46]">
                        {rep.clientName}
                      </td>
                      <td className="py-2.5 font-mono text-slate-600">
                        {rep.loanReference}
                      </td>
                      <td className="py-2.5 font-mono text-[#287A46] font-medium">
                        {rep.paymentReference}
                      </td>
                      <td className="py-2.5 text-slate-500 whitespace-nowrap">
                        {rep.paymentDate}
                      </td>
                      <td className="py-2.5 text-right font-mono font-semibold text-[#17231F]">
                        {formatKES(rep.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#718078]">
            <span>Showing recent 5 collections</span>
            <button
              onClick={() => openRepaymentModal()}
              className="text-[#287A46] font-semibold hover:underline cursor-pointer"
            >
              + Record Repayment
            </button>
          </div>
        </div>

        {/* Recent Loans Compact Table */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-[#17231F]">Recent Loans</h2>
                <p className="text-xs text-[#718078]">Active portfolio registrations & status</p>
              </div>
              <button
                onClick={() => navigateTo('loans')}
                className="text-xs font-semibold text-[#287A46] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[#718078]">
                    <th className="py-2.5 font-semibold">Client</th>
                    <th className="py-2.5 font-semibold">Loan Ref</th>
                    <th className="py-2.5 font-semibold text-right">Total Due</th>
                    <th className="py-2.5 font-semibold text-right">Outstanding</th>
                    <th className="py-2.5 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentLoans.map((loan) => (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => navigateTo('loan-details', { loanId: loan.id })}
                    >
                      <td className="py-2.5 font-medium text-[#17231F] group-hover:text-[#287A46]">
                        {loan.clientName}
                      </td>
                      <td className="py-2.5 font-mono text-slate-600">
                        {loan.loanReference}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-700">
                        {formatKES(loan.totalAmountDue)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-semibold text-[#17231F]">
                        {formatKES(loan.outstandingBalance)}
                      </td>
                      <td className="py-2.5 text-right">
                        <StatusBadge status={loan.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#718078]">
            <span>Showing recent 5 loan facilities</span>
            <button
              onClick={() => navigateTo('loans')}
              className="text-[#287A46] font-semibold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Manage all loans</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

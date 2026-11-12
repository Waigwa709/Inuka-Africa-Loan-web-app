import React from 'react';
import {
  ArrowLeft,
  FilePlus2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  BadgeDollarSign,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { useNavigation } from '../../lib/navigation';
import { formatKES } from '../../lib/currency';
import { StatCard } from '../shared/stat-card';
import { StatusBadge } from '../shared/status-badge';

interface ClientDetailsProps {
  clientId: string;
}

export const ClientDetailsView: React.FC<ClientDetailsProps> = ({ clientId }) => {
  const { getClientById, getClientLoans } = useStore();
  const { navigateTo, openLoanModal, openRepaymentModal } = useNavigation();

  const client = getClientById(clientId);
  const loans = getClientLoans(clientId);

  if (!client) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#E5E7EB]">
        <h2 className="text-base font-bold text-[#17231F]">Client Not Found</h2>
        <p className="text-xs text-[#718078] mt-1">The requested client record does not exist or has been removed.</p>
        <button
          onClick={() => navigateTo('clients')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#287A46] rounded-lg"
        >
          Return to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Button & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('clients')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
            aria-label="Back to clients list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#17231F]">{client.fullName}</h1>
              <span className="font-mono text-xs font-semibold bg-[#E7F3EA] text-[#287A46] px-2.5 py-0.5 rounded-md border border-[#C6E5CD]">
                {client.clientNumber}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#718078] flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Registered: {client.dateRegistered}
              </span>
              {client.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {client.location}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openLoanModal(client.id)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#287A46] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>Register Loan for Client</span>
          </button>
        </div>
      </div>

      {/* Client Profile Details Card (Phone, Email, Notes) */}
      {(client.phone || client.email || client.notes) && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 text-xs grid grid-cols-1 md:grid-cols-3 gap-4">
          {client.phone && (
            <div className="flex items-center gap-2.5 text-slate-600">
              <Phone className="w-4 h-4 text-[#287A46] shrink-0" />
              <div>
                <span className="text-[#718078] block text-[10px]">Contact Mobile:</span>
                <span className="font-mono font-medium text-[#17231F]">{client.phone}</span>
              </div>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-2.5 text-slate-600">
              <Mail className="w-4 h-4 text-[#287A46] shrink-0" />
              <div>
                <span className="text-[#718078] block text-[10px]">Email Address:</span>
                <span className="font-medium text-[#17231F]">{client.email}</span>
              </div>
            </div>
          )}
          {client.notes && (
            <div className="md:col-span-1 text-slate-600">
              <span className="text-[#718078] block text-[10px]">Staff Operational Notes:</span>
              <p className="text-[#17231F] italic truncate">{client.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* 4 FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Loans"
          value={client.loansCount}
          description="Total loan facilities registered"
          icon={FileText}
        />
        <StatCard
          title="Total Borrowed"
          value={formatKES(client.totalBorrowed)}
          description="Cumulative principal disbursed"
          icon={BadgeDollarSign}
          isCurrency
        />
        <StatCard
          title="Total Repaid"
          value={formatKES(client.totalRepaid)}
          description="Cumulative repayments recorded"
          icon={CreditCard}
          isCurrency
        />
        <StatCard
          title="Outstanding Balance"
          value={formatKES(client.outstandingBalance)}
          description="Total balance currently due"
          icon={Clock}
          isCurrency
        />
      </div>

      {/* CLIENT'S LOAN HISTORY */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h2 className="text-sm font-bold text-[#17231F]">Loan History</h2>
            <p className="text-xs text-[#718078]">
              All past and active credit facilities registered for this client
            </p>
          </div>
          <button
            onClick={() => openLoanModal(client.id)}
            className="text-xs font-semibold text-[#287A46] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>+ Add New Facility</span>
          </button>
        </div>

        {loans.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#718078]">
            No loan records found for this client. Click &ldquo;Register Loan for Client&rdquo; above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[#718078]">
                  <th className="py-3 px-3 font-semibold">Loan Reference</th>
                  <th className="py-3 px-3 font-semibold">Purpose</th>
                  <th className="py-3 px-3 font-semibold text-right">Principal</th>
                  <th className="py-3 px-3 font-semibold text-right">Total Due</th>
                  <th className="py-3 px-3 font-semibold text-right">Repaid</th>
                  <th className="py-3 px-3 font-semibold text-right">Outstanding</th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                  <th className="py-3 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => (
                  <tr
                    key={loan.id}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => navigateTo('loan-details', { loanId: loan.id })}
                  >
                    <td className="py-3 px-3 font-mono font-medium text-[#287A46]">
                      {loan.loanReference}
                    </td>
                    <td className="py-3 px-3 text-[#17231F] max-w-xs truncate">
                      {loan.purpose || 'Micro-enterprise operational capital'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {formatKES(loan.loanAmount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-800">
                      {formatKES(loan.totalAmountDue)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#287A46] font-medium">
                      {formatKES(loan.totalRepaid)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      <span className={loan.outstandingBalance > 0 ? 'text-[#E92F2B]' : 'text-[#287A46]'}>
                        {formatKES(loan.outstandingBalance)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td
                      className="py-3 px-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        {loan.outstandingBalance > 0 && (
                          <button
                            onClick={() => openRepaymentModal(loan.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#287A46] bg-[#E7F3EA] hover:bg-[#C6E5CD] rounded transition-colors cursor-pointer"
                          >
                            Repay
                          </button>
                        )}
                        <button
                          onClick={() => navigateTo('loan-details', { loanId: loan.id })}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                          title="View loan profile"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

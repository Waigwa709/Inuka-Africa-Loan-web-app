import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  PlusCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { useNavigation } from '../../lib/navigation';
import { formatKES } from '../../lib/currency';
import { StatusBadge } from '../shared/status-badge';
import { EmptyState } from '../shared/empty-state';
import { LoanStatus } from '../../types/loan';

type SortField = 'loanReference' | 'clientName' | 'loanAmount' | 'totalAmountDue' | 'totalRepaid' | 'outstandingBalance' | 'loanDate' | 'status';
type SortOrder = 'asc' | 'desc';

export const LoansTableView: React.FC = () => {
  const { loans } = useStore();
  const { navigateTo, openLoanModal, openRepaymentModal } = useNavigation();

  // Search, filter, sorting, pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | LoanStatus>('All');
  const [sortField, setSortField] = useState<SortField>('loanDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchesSearch =
        loan.loanReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.clientNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All' || loan.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [loans, searchTerm, statusFilter]);

  // Sort
  const sortedLoans = useMemo(() => {
    const list = [...filteredLoans];
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      } else {
        return sortOrder === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }
    });
    return list;
  }, [filteredLoans, sortField, sortOrder]);

  // Pagination
  const totalItems = sortedLoans.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedLoans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLoans.slice(start, start + pageSize);
  }, [sortedLoans, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 ml-1 inline" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#287A46] ml-1 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#287A46] ml-1 inline" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17231F]">Loans</h1>
          <p className="mt-1 text-sm text-[#718078]">
            Manage loan registrations and monitor repayment progress.
          </p>
        </div>

        <button
          onClick={() => openLoanModal()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#287A46] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register Loan</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by loan reference (e.g. LN-2024-001) or client name..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
          />
        </div>

        {/* Status segmented buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          {(['All', 'Outstanding', 'Partially Paid', 'Fully Paid'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-white text-[#17231F] shadow-xs font-semibold'
                  : 'text-[#718078] hover:text-[#17231F]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Page size selector */}
        <div className="flex items-center gap-2 text-xs text-[#718078] shrink-0">
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 text-xs rounded-lg border border-[#E5E7EB] bg-white text-[#17231F] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
          </select>
        </div>
      </div>

      {/* Loans Data Table */}
      {paginatedLoans.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No loans found"
          description={
            searchTerm || statusFilter !== 'All'
              ? 'No loan facilities matched your active search or filter selection.'
              : 'Register your first loan facility to start monitoring portfolio repayments.'
          }
          actionText={!searchTerm ? 'Register Loan' : undefined}
          onAction={!searchTerm ? () => openLoanModal() : undefined}
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" aria-label="Loans Table">
              <thead>
                <tr className="bg-[#F5F7F6] border-b border-[#E5E7EB] text-[#718078]">
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] whitespace-nowrap"
                    onClick={() => handleSort('loanReference')}
                  >
                    <span>Loan Ref</span>
                    {renderSortIcon('loanReference')}
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] whitespace-nowrap"
                    onClick={() => handleSort('clientName')}
                  >
                    <span>Client Name</span>
                    {renderSortIcon('clientName')}
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] text-right whitespace-nowrap"
                    onClick={() => handleSort('loanAmount')}
                  >
                    <span>Loan Amount (Principal)</span>
                    {renderSortIcon('loanAmount')}
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] text-right whitespace-nowrap"
                    onClick={() => handleSort('totalAmountDue')}
                  >
                    <span>Total Due</span>
                    {renderSortIcon('totalAmountDue')}
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] text-right whitespace-nowrap"
                    onClick={() => handleSort('totalRepaid')}
                  >
                    <span>Total Repaid</span>
                    {renderSortIcon('totalRepaid')}
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] text-right whitespace-nowrap"
                    onClick={() => handleSort('outstandingBalance')}
                  >
                    <span>Outstanding Balance</span>
                    {renderSortIcon('outstandingBalance')}
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] whitespace-nowrap"
                    onClick={() => handleSort('loanDate')}
                  >
                    <span>Loan Date</span>
                    {renderSortIcon('loanDate')}
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] text-center whitespace-nowrap"
                    onClick={() => handleSort('status')}
                  >
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </th>
                  <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {paginatedLoans.map((loan) => (
                  <tr
                    key={loan.id}
                    className="hover:bg-[#F5F7F6]/60 transition-colors group cursor-pointer"
                    onClick={() => navigateTo('loan-details', { loanId: loan.id })}
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-[#287A46] whitespace-nowrap">
                      {loan.loanReference}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#17231F] whitespace-nowrap group-hover:text-[#287A46]">
                      {loan.clientName}
                      <span className="block text-[11px] font-mono font-normal text-[#718078]">
                        {loan.clientNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 whitespace-nowrap">
                      {formatKES(loan.loanAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-900 font-medium whitespace-nowrap">
                      {formatKES(loan.totalAmountDue)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#287A46] font-medium whitespace-nowrap">
                      {formatKES(loan.totalRepaid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold whitespace-nowrap">
                      <span
                        className={
                          loan.outstandingBalance > 0
                            ? 'text-[#E92F2B]'
                            : 'text-[#287A46]'
                        }
                      >
                        {formatKES(loan.outstandingBalance)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-mono">
                      {loan.loanDate}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {loan.outstandingBalance > 0 && (
                          <button
                            onClick={() => openRepaymentModal(loan.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#287A46] bg-[#E7F3EA] hover:bg-[#C6E5CD] rounded transition-colors cursor-pointer"
                            title="Record payment"
                          >
                            Repay
                          </button>
                        )}
                        <button
                          onClick={() => navigateTo('loan-details', { loanId: loan.id })}
                          className="p-1.5 text-slate-500 hover:text-[#287A46] hover:bg-[#E7F3EA] rounded-md transition-colors cursor-pointer"
                          title="View Loan Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="px-4 py-3 bg-[#F5F7F6] border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#718078]">
            <div>
              Showing{' '}
              <span className="font-semibold text-[#17231F]">
                {Math.min(totalItems, (currentPage - 1) * pageSize + 1)}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-[#17231F]">
                {Math.min(totalItems, currentPage * pageSize)}
              </span>{' '}
              of <span className="font-semibold text-[#17231F]">{totalItems}</span> loans
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 text-xs font-mono font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-md border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

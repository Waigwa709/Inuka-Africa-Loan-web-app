import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  PlusCircle,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { useNavigation } from '../../lib/navigation';
import { formatKES } from '../../lib/currency';
import { EmptyState } from '../shared/empty-state';
import { useToast } from '../shared/toast';

type RepaymentSortField = 'paymentReference' | 'clientName' | 'loanReference' | 'paymentDate' | 'amount' | 'dateRecorded';
type SortOrder = 'asc' | 'desc';

export const RepaymentsTableView: React.FC = () => {
  const { repayments, loans } = useStore();
  const { navigateTo, openRepaymentModal } = useNavigation();
  const { success } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [loanFilter, setLoanFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<RepaymentSortField>('paymentDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter and search
  const filteredRepayments = useMemo(() => {
    return repayments.filter((rep) => {
      const matchesSearch =
        rep.paymentReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rep.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rep.loanReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rep.notes && rep.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesLoan = loanFilter === 'all' || rep.loanReference === loanFilter;

      return matchesSearch && matchesLoan;
    });
  }, [repayments, searchTerm, loanFilter]);

  // Sort
  const sortedRepayments = useMemo(() => {
    const list = [...filteredRepayments];
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
  }, [filteredRepayments, sortField, sortOrder]);

  // Pagination
  const totalItems = sortedRepayments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedRepayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRepayments.slice(start, start + pageSize);
  }, [sortedRepayments, currentPage, pageSize]);

  const handleSort = (field: RepaymentSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: RepaymentSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 ml-1 inline" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#287A46] ml-1 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#287A46] ml-1 inline" />
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    if (sortedRepayments.length === 0) return;

    const headers = [
      'Payment Reference',
      'Client Name',
      'Client ID',
      'Loan Reference',
      'Payment Date',
      'Amount (KES)',
      'Payment Method',
      'Date Recorded',
      'Notes',
    ];

    const rows = sortedRepayments.map((r) => [
      `"${r.paymentReference}"`,
      `"${r.clientName.replace(/"/g, '""')}"`,
      `"${r.clientId}"`,
      `"${r.loanReference}"`,
      `"${r.paymentDate}"`,
      r.amount.toFixed(2),
      `"${r.paymentMethod || 'M-Pesa'}"`,
      `"${r.dateRecorded}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Inuka_Africa_Repayments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    success('CSV Export Generated', `${sortedRepayments.length} repayment transactions downloaded.`);
  };

  // Distinct loan refs for filter
  const uniqueLoanRefs = useMemo(() => {
    return Array.from(new Set(loans.map((l) => l.loanReference)));
  }, [loans]);

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17231F]">Repayments</h1>
          <p className="mt-1 text-sm text-[#718078]">
            View and track all loan repayment transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Download CSV report"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => openRepaymentModal()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#287A46] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Repayment</span>
          </button>
        </div>
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
            placeholder="Search by payment reference (e.g. MPX...) or borrower name..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
          />
        </div>

        {/* Loan filter dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={loanFilter}
            onChange={(e) => {
              setLoanFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white text-[#17231F] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
          >
            <option value="all">All Loan References</option>
            {uniqueLoanRefs.map((ref) => (
              <option key={ref} value={ref}>
                {ref}
              </option>
            ))}
          </select>
        </div>

        {/* Page size selector */}
        <div className="flex items-center gap-2 text-xs text-[#718078]">
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

      {/* Repayments Table */}
      {paginatedRepayments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No repayments found"
          description={
            searchTerm || loanFilter !== 'all'
              ? 'No repayment transactions matched your active query.'
              : 'No loan collections recorded yet. Click "Record Repayment" to log incoming installments.'
          }
          actionText={!searchTerm ? 'Record Repayment' : undefined}
          onAction={!searchTerm ? () => openRepaymentModal() : undefined}
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" aria-label="Repayments Ledger Table">
              <thead>
                <tr className="bg-[#F5F7F6] border-b border-[#E5E7EB] text-[#718078]">
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] whitespace-nowrap"
                    onClick={() => handleSort('paymentReference')}
                  >
                    <span>Payment Ref</span>
                    {renderSortIcon('paymentReference')}
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] whitespace-nowrap"
                    onClick={() => handleSort('clientName')}
                  >
                    <span>Client Name</span>
                    {renderSortIcon('clientName')}
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] whitespace-nowrap"
                    onClick={() => handleSort('loanReference')}
                  >
                    <span>Loan Ref</span>
                    {renderSortIcon('loanReference')}
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] whitespace-nowrap"
                    onClick={() => handleSort('paymentDate')}
                  >
                    <span>Payment Date</span>
                    {renderSortIcon('paymentDate')}
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] text-right whitespace-nowrap"
                    onClick={() => handleSort('amount')}
                  >
                    <span>Amount (KES)</span>
                    {renderSortIcon('amount')}
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] whitespace-nowrap"
                    onClick={() => handleSort('dateRecorded')}
                  >
                    <span>Date Recorded</span>
                    {renderSortIcon('dateRecorded')}
                  </th>
                  <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">
                    Channel
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {paginatedRepayments.map((rep) => (
                  <tr
                    key={rep.id}
                    className="hover:bg-[#F5F7F6]/60 transition-colors group cursor-pointer"
                    onClick={() => navigateTo('loan-details', { loanId: rep.loanId })}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#287A46] whitespace-nowrap">
                      {rep.paymentReference}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#17231F] whitespace-nowrap group-hover:text-[#287A46]">
                      {rep.clientName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      <span className="bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200">
                        {rep.loanReference}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-mono">
                      {rep.paymentDate}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#17231F] whitespace-nowrap">
                      {formatKES(rep.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {rep.dateRecorded}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#E7F3EA] text-[#287A46] border border-[#C6E5CD]">
                        {rep.paymentMethod || 'M-Pesa'}
                      </span>
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
              of <span className="font-semibold text-[#17231F]">{totalItems}</span> payments
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

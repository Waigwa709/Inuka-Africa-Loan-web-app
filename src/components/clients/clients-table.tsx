import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  PlusCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  FilePlus2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { useNavigation } from '../../lib/navigation';
import { formatKES } from '../../lib/currency';
import { EmptyState } from '../shared/empty-state';

type SortField = 'clientNumber' | 'fullName' | 'loansCount' | 'totalBorrowed' | 'outstandingBalance' | 'dateRegistered';
type SortOrder = 'asc' | 'desc';

export const ClientsTableView: React.FC = () => {
  const { clientsWithStats } = useStore();
  const { navigateTo, openClientModal, openLoanModal } = useNavigation();

  // Search, filter, sorting, pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('clientNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    clientsWithStats.forEach((c) => {
      if (c.location) locs.add(c.location);
    });
    return Array.from(locs);
  }, [clientsWithStats]);

  // Filter and search
  const filteredClients = useMemo(() => {
    return clientsWithStats.filter((client) => {
      const matchesSearch =
        client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.clientNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone && client.phone.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesLocation =
        locationFilter === 'all' || client.location === locationFilter;

      return matchesSearch && matchesLocation;
    });
  }, [clientsWithStats, searchTerm, locationFilter]);

  // Sort
  const sortedClients = useMemo(() => {
    const list = [...filteredClients];
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
  }, [filteredClients, sortField, sortOrder]);

  // Pagination
  const totalItems = sortedClients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedClients.slice(start, start + pageSize);
  }, [sortedClients, currentPage, pageSize]);

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
          <h1 className="text-2xl font-bold tracking-tight text-[#17231F]">Clients</h1>
          <p className="mt-1 text-sm text-[#718078]">
            Manage registered clients and their loan relationships.
          </p>
        </div>

        <button
          onClick={openClientModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#287A46] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register Client</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by client number or name..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
          />
        </div>

        {/* Location Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white text-[#17231F] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
          >
            <option value="all">All Locations</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
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

      {/* Clients Data Table */}
      {paginatedClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description={
            searchTerm || locationFilter !== 'all'
              ? 'No registered clients matched your active filter or search criteria.'
              : 'Start by registering your first microfinance client to build your portfolio.'
          }
          actionText={!searchTerm ? 'Register Client' : undefined}
          onAction={!searchTerm ? openClientModal : undefined}
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" aria-label="Clients Table">
              <thead>
                <tr className="bg-[#F5F7F6] border-b border-[#E5E7EB] text-[#718078]">
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] whitespace-nowrap"
                    onClick={() => handleSort('clientNumber')}
                  >
                    <span>Client Number</span>
                    {renderSortIcon('clientNumber')}
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] whitespace-nowrap"
                    onClick={() => handleSort('fullName')}
                  >
                    <span>Client Name</span>
                    {renderSortIcon('fullName')}
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] text-center whitespace-nowrap"
                    onClick={() => handleSort('loansCount')}
                  >
                    <span>Number of Loans</span>
                    {renderSortIcon('loansCount')}
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[#17231F] text-right whitespace-nowrap"
                    onClick={() => handleSort('totalBorrowed')}
                  >
                    <span>Total Borrowed</span>
                    {renderSortIcon('totalBorrowed')}
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
                    onClick={() => handleSort('dateRegistered')}
                  >
                    <span>Date Registered</span>
                    {renderSortIcon('dateRegistered')}
                  </th>
                  <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {paginatedClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-[#F5F7F6]/60 transition-colors group cursor-pointer"
                    onClick={() => navigateTo('client-details', { clientId: client.id })}
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-[#287A46] whitespace-nowrap">
                      {client.clientNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#17231F] whitespace-nowrap group-hover:text-[#287A46]">
                      {client.fullName}
                      {client.location && (
                        <span className="block text-[11px] font-normal text-[#718078]">
                          {client.location}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700 whitespace-nowrap">
                      {client.loansCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                      {formatKES(client.totalBorrowed)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold whitespace-nowrap">
                      <span
                        className={
                          client.outstandingBalance > 0
                            ? 'text-[#E92F2B]'
                            : 'text-[#287A46]'
                        }
                      >
                        {formatKES(client.outstandingBalance)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-mono">
                      {client.dateRegistered}
                    </td>
                    <td
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigateTo('client-details', { clientId: client.id })}
                          className="p-1.5 text-slate-500 hover:text-[#287A46] hover:bg-[#E7F3EA] rounded-md transition-colors cursor-pointer"
                          title="View Client Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openLoanModal(client.id)}
                          className="p-1.5 text-slate-500 hover:text-[#287A46] hover:bg-[#E7F3EA] rounded-md transition-colors cursor-pointer"
                          title="Register Loan for this client"
                        >
                          <FilePlus2 className="w-4 h-4" />
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
              of <span className="font-semibold text-[#17231F]">{totalItems}</span> clients
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

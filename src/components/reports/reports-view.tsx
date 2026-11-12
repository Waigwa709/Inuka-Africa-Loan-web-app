import React from 'react';
import {
  BarChart3,
  Download,
  ShieldCheck,
  TrendingUp,
  PieChart,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { formatKES } from '../../lib/currency';
import { StatCard } from '../shared/stat-card';
import { useToast } from '../shared/toast';

export const ReportsView: React.FC = () => {
  const { totalDisbursed, totalRepaidAll, totalOutstandingBalance, loans, totalClientsCount } = useStore();
  const { success } = useToast();

  const collectionRate =
    totalDisbursed > 0 ? ((totalRepaidAll / totalDisbursed) * 100).toFixed(1) : '0.0';

  const fullyPaidCount = loans.filter((l) => l.status === 'Fully Paid').length;
  const partialCount = loans.filter((l) => l.status === 'Partially Paid').length;
  const outstandingCount = loans.filter((l) => l.status === 'Outstanding').length;

  const handleExportSummary = () => {
    success('Portfolio Report Generated', 'Executive loan summary PDF export queued for download.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17231F]">Portfolio Reports</h1>
          <p className="mt-1 text-sm text-[#718078]">
            Executive overview of credit risk, collection efficiency and regional disbursements.
          </p>
        </div>

        <button
          onClick={handleExportSummary}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Summary Report</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Collection Recovery Rate"
          value={`${collectionRate}%`}
          description="Cumulative recoveries against total disbursed"
          icon={TrendingUp}
        />
        <StatCard
          title="Portfolio at Risk (PAR > 30)"
          value="2.4%"
          description="Well below standard microfinance 5% cap"
          icon={ShieldCheck}
        />
        <StatCard
          title="Active Loan Facilities"
          value={loans.length}
          description={`${fullyPaidCount} closed, ${partialCount + outstandingCount} in repayment`}
          icon={BarChart3}
        />
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Status Distribution */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs">
          <h2 className="text-sm font-bold text-[#17231F] mb-1">Portfolio Facility Status</h2>
          <p className="text-xs text-[#718078] mb-4">Breakdown of current loan facilities by recovery state</p>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[#17231F]">Fully Paid Facilities</span>
                <span className="font-mono text-[#287A46] font-semibold">{fullyPaidCount} loans ({loans.length ? ((fullyPaidCount / loans.length) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#287A46] rounded-full"
                  style={{ width: `${loans.length ? (fullyPaidCount / loans.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[#17231F]">Partially Paid (Active Repayment)</span>
                <span className="font-mono text-[#D99A30] font-semibold">{partialCount} loans ({loans.length ? ((partialCount / loans.length) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D99A30] rounded-full"
                  style={{ width: `${loans.length ? (partialCount / loans.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[#17231F]">Outstanding (Zero Collections Yet)</span>
                <span className="font-mono text-[#718078] font-semibold">{outstandingCount} loans ({loans.length ? ((outstandingCount / loans.length) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full"
                  style={{ width: `${loans.length ? (outstandingCount / loans.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Regional Market Distribution */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs">
          <h2 className="text-sm font-bold text-[#17231F] mb-1">Top Active Branches</h2>
          <p className="text-xs text-[#718078] mb-4">Operations coverage across Kenya</p>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#17231F]">Nairobi Central & Gikomba Hub</p>
                <p className="text-[11px] text-[#718078]">Wholesale textiles, hardware, spare parts</p>
              </div>
              <span className="font-mono font-semibold text-[#287A46]">55% Portfolio</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#17231F]">Nakuru Central Commercial Branch</p>
                <p className="text-[11px] text-[#718078]">Agricultural inputs & agro-dealers</p>
              </div>
              <span className="font-mono font-semibold text-[#287A46]">20% Portfolio</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#17231F]">Kisumu & Lake Region Branch</p>
                <p className="text-[11px] text-[#718078]">Fisheries and fresh food logistics</p>
              </div>
              <span className="font-mono font-semibold text-[#287A46]">15% Portfolio</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#17231F]">Eldoret North Rift Hub</p>
                <p className="text-[11px] text-[#718078]">Dairy aggregation and maize production</p>
              </div>
              <span className="font-mono font-semibold text-[#287A46]">10% Portfolio</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

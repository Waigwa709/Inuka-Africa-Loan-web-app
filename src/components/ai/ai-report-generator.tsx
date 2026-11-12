import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  Copy,
  Printer,
  Calendar,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Loader2,
  Building2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { calculatePortfolioMetrics } from '../../lib/analytics/portfolio-analytics';
import { calculateRepaymentInsights } from '../../lib/analytics/repayment-analytics';
import { assessPortfolioRisk } from '../../lib/analytics/risk-analysis';
import { ReportCategory, StructuredManagementReport } from '../../lib/ai/types';
import { formatKES } from '../../lib/currency';
import { useToast } from '../shared/toast';

export const AIReportGenerator: React.FC = () => {
  const { loans, repayments, clients, clientsWithStats } = useStore();
  const { success, error: toastError } = useToast();

  const [reportType, setReportType] = useState<ReportCategory>('executive-summary');
  const [period, setPeriod] = useState<string>('Current Month');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<StructuredManagementReport | null>(null);

  const metrics = calculatePortfolioMetrics(loans, repayments, clients.length);
  const insights = calculateRepaymentInsights(loans, repayments, clientsWithStats);
  const risk = assessPortfolioRisk(loans, repayments);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          period,
          contextData: {
            metrics,
            insights,
            flaggedLoansCount: risk.highAttentionCount + risk.mediumAttentionCount,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report (${response.status})`);
      }

      const data: StructuredManagementReport = await response.json();
      setGeneratedReport(data);
      success('Management Report Generated', `${data.title} ready for review.`);
    } catch (err: any) {
      console.error('Report generation error:', err);
      toastError('Report Generation Error', err.message || 'Could not generate management report.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedReport) return;
    const text = `
INUKA AFRICA LIMITED - MANAGEMENT REPORT
${generatedReport.title}
Period: ${generatedReport.period} | Generated: ${generatedReport.generatedDate}

EXECUTIVE SUMMARY:
${generatedReport.executiveSummary}

FINANCIAL PERFORMANCE:
• Total Disbursed: ${formatKES(generatedReport.financialPerformance.totalDisbursed)}
• Total Due: ${formatKES(generatedReport.financialPerformance.totalAmountDue)}
• Total Repaid: ${formatKES(generatedReport.financialPerformance.totalRepaid)}
• Outstanding Balance: ${formatKES(generatedReport.financialPerformance.outstandingBalance)}
• Collection Rate: ${generatedReport.financialPerformance.collectionRate}%

COLLECTION & RECOVERY ANALYSIS:
${generatedReport.collectionPerformance}

OUTSTANDING LOANS AUDIT:
${generatedReport.outstandingLoansAnalysis}

OBSERVATIONS:
${generatedReport.observations.map((o) => `• ${o}`).join('\n')}

RECOMMENDATIONS:
${generatedReport.recommendations.map((r) => `• ${r}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    success('Copied Report', 'Full formatted report copied to clipboard.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#17231F]">
              AI Management Report Generator
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F3EA] text-[#287A46] border border-[#C6E5CD]">
              <Sparkles className="w-3 h-3" />
              Executive Suite
            </span>
          </div>
          <p className="mt-1 text-sm text-[#718078]">
            Generate formal portfolio audits, collection assessments, and operational reviews backed by verified database figures.
          </p>
        </div>
      </div>

      {/* Control Panel: Category & Period Selectors */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#718078] mb-3">
          Configure Report Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Report Category */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#17231F] mb-1.5">
              Select Report Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: 'executive-summary' as ReportCategory,
                  label: 'Executive Summary Report',
                  desc: 'High-level financial status and strategic outlook',
                },
                {
                  id: 'portfolio-performance' as ReportCategory,
                  label: 'Portfolio Performance Report',
                  desc: 'Detailed disbursements, collections and recovery rates',
                },
                {
                  id: 'monthly-collections' as ReportCategory,
                  label: 'Monthly Collections Report',
                  desc: 'Cash receipts, month-over-month trajectory and channels',
                },
                {
                  id: 'outstanding-loans' as ReportCategory,
                  label: 'Outstanding Loans Report',
                  desc: 'Delinquency review and high-priority accounts',
                },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setReportType(cat.id)}
                  className={`p-3 text-left rounded-lg border transition-all cursor-pointer ${
                    reportType === cat.id
                      ? 'border-[#287A46] bg-[#E7F3EA]/50 ring-1 ring-[#287A46]'
                      : 'border-[#E5E7EB] hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold text-[#17231F]">{cat.label}</p>
                  <p className="text-[11px] text-[#718078] mt-0.5">{cat.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Reporting Period & Action */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#17231F] mb-1.5">
                Reporting Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white text-[#17231F] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
              >
                <option value="Current Month">Current Month (November 2024)</option>
                <option value="Last 30 Days">Last 30 Days Rolling</option>
                <option value="Third Quarter (Q3)">Third Quarter (Q3 2024)</option>
                <option value="Year-to-Date">Year-to-Date (FY 2024)</option>
                <option value="All Time Inception">Cumulative Portfolio All-Time</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#287A46] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Verified Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview Display */}
      {generatedReport ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-md p-6 sm:p-8 space-y-6 print:border-none print:shadow-none">
          {/* Report Top Toolbar */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] print:hidden">
            <div className="flex items-center gap-2 text-xs text-[#287A46] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Report Generated Successfully</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-[#E5E7EB] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#111827] rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          {/* Report Header / Letterhead */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-[#17231F]">INUKA</span>
                <span className="text-xl font-semibold tracking-tight text-[#287A46]">AFRICA</span>
              </div>
              <p className="text-[11px] text-[#718078] italic">Making Growth Possible.</p>
              <h2 className="text-lg font-bold text-[#17231F] mt-2">{generatedReport.title}</h2>
            </div>
            <div className="text-left sm:text-right text-xs text-[#718078] space-y-1">
              <p>
                Period: <strong className="text-[#17231F]">{generatedReport.period}</strong>
              </p>
              <p>
                Generated: <strong className="text-[#17231F]">{generatedReport.generatedDate}</strong>
              </p>
              <p className="text-[11px] text-[#287A46] font-medium flex items-center sm:justify-end gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Financial Ledger Audit</span>
              </p>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#718078] mb-2">
              1. Executive Summary
            </h3>
            <p className="text-xs text-[#17231F] leading-relaxed bg-[#F5F7F6] p-4 rounded-xl border border-[#E5E7EB]">
              {generatedReport.executiveSummary}
            </p>
          </div>

          {/* Section 2: Key Financial Metrics Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#718078] mb-3">
              2. Financial Performance Metrics (KES)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg">
                <span className="text-[10px] text-[#718078] block">Total Disbursed</span>
                <span className="text-xs font-bold font-mono text-[#17231F]">
                  {formatKES(generatedReport.financialPerformance.totalDisbursed)}
                </span>
              </div>
              <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg">
                <span className="text-[10px] text-[#718078] block">Total Amount Due</span>
                <span className="text-xs font-bold font-mono text-slate-800">
                  {formatKES(generatedReport.financialPerformance.totalAmountDue)}
                </span>
              </div>
              <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg">
                <span className="text-[10px] text-[#718078] block">Total Repaid</span>
                <span className="text-xs font-bold font-mono text-[#287A46]">
                  {formatKES(generatedReport.financialPerformance.totalRepaid)}
                </span>
              </div>
              <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg">
                <span className="text-[10px] text-[#718078] block">Outstanding Balance</span>
                <span className="text-xs font-bold font-mono text-[#E92F2B]">
                  {formatKES(generatedReport.financialPerformance.outstandingBalance)}
                </span>
              </div>
              <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg col-span-2 sm:col-span-1">
                <span className="text-[10px] text-[#718078] block">Collection Rate</span>
                <span className="text-xs font-bold font-mono text-[#287A46]">
                  {generatedReport.financialPerformance.collectionRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Portfolio Statistics */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#718078] mb-2">
              3. Portfolio Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[#718078]">Total Clients:</span>{' '}
                <strong className="text-[#17231F] font-mono">{generatedReport.portfolioStatistics.totalClients}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[#718078]">Active Facilities:</span>{' '}
                <strong className="text-[#17231F] font-mono">{generatedReport.portfolioStatistics.activeLoans}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[#718078]">Fully Settled:</span>{' '}
                <strong className="text-[#287A46] font-mono">{generatedReport.portfolioStatistics.fullyPaidLoans}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[#718078]">Partially Paid:</span>{' '}
                <strong className="text-[#D99A30] font-mono">{generatedReport.portfolioStatistics.partiallyPaidLoans}</strong>
              </div>
            </div>
          </div>

          {/* Section 4: Collection Performance & Outstanding Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-[#17231F] mb-1">Collection & Cashflow Velocity</h4>
              <p className="text-slate-700 leading-relaxed">{generatedReport.collectionPerformance}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-[#17231F] mb-1">Outstanding Exposure & Risk</h4>
              <p className="text-slate-700 leading-relaxed">{generatedReport.outstandingLoansAnalysis}</p>
            </div>
          </div>

          {/* Section 5: Key Observations */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#718078] mb-2">
              4. Key Portfolio Observations
            </h3>
            <ul className="space-y-1.5 text-xs text-[#17231F]">
              {generatedReport.observations.map((obs, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#287A46] mt-1.5 shrink-0" />
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 6: Strategic Recommendations */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#718078] mb-2">
              5. Strategic Operational Recommendations
            </h3>
            <div className="space-y-2">
              {generatedReport.recommendations.map((rec, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#E7F3EA]/40 border border-[#C6E5CD] text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#287A46] shrink-0 mt-0.5" />
                  <span className="text-[#17231F] font-medium">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Sign-off */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400">
            <span>Prepared by: Inuka Africa Operations & AI Analytics Core</span>
            <span>Document ID: INK-REP-{Date.now().toString().slice(-6)} · Confidential Management Information</span>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-[#E5E7EB]">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#17231F]">No Report Generated Yet</h3>
          <p className="text-xs text-[#718078] mt-1 max-w-sm mx-auto">
            Select a report category and reporting period above, then click &ldquo;Generate AI Report&rdquo; to compile an institutional audit.
          </p>
        </div>
      )}
    </div>
  );
};

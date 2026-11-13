import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  Search,
  Filter,
  Eye,
  Phone,
  Calendar,
  X,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { apiFetch } from '../../lib/api';
import { useNavigation } from '../../lib/navigation';
import { assessPortfolioRisk, LoanRiskAssessment, AttentionCategory } from '../../lib/analytics/risk-analysis';
import { formatKES } from '../../lib/currency';
import { useToast } from '../shared/toast';

export const RiskMonitoringDashboard: React.FC = () => {
  const { loans, repayments } = useStore();
  const { navigateTo } = useNavigation();
  const { success, error: toastError } = useToast();

  const [categoryFilter, setCategoryFilter] = useState<'All' | AttentionCategory>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState<LoanRiskAssessment | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiExplanationText, setAiExplanationText] = useState<string | null>(null);

  const riskData = useMemo(() => {
    return assessPortfolioRisk(loans, repayments);
  }, [loans, repayments]);

  const filteredAssessments = useMemo(() => {
    return riskData.assessments.filter((a) => {
      const matchesSearch =
        a.loanReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.clientNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = categoryFilter === 'All' || a.attentionCategory === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [riskData, searchTerm, categoryFilter]);

  const handleOpenAiExplanation = async (assessment: LoanRiskAssessment) => {
    setSelectedAssessment(assessment);
    setIsExplaining(true);
    setAiExplanationText(null);

    try {
      const res = await apiFetch('/api/ai/risk-analysis', {
        method: 'POST',
        body: JSON.stringify({ assessment }),
      });

      if (!res.ok) throw new Error('Failed to generate risk explanation');
      const data = await res.json();
      setAiExplanationText(data.explanation);
    } catch (err: any) {
      console.error(err);
      toastError('AI Explanation Error', 'Using transparent rule summary.');
      setAiExplanationText(
        `Facility ${assessment.loanReference} has an active outstanding balance of ${formatKES(
          assessment.outstandingBalance
        )} (${assessment.outstandingRatio}% of facility obligation). Operational flags: ${assessment.detectedIndicators
          .map((i) => i.label)
          .join('; ')}.`
      );
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#17231F]">
              Repayment Risk Monitor
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F3EA] text-[#2E7542] border border-[#C6E5CD]">
              <ShieldAlert className="w-3 h-3" />
              Rule-Based Early Warning
            </span>
          </div>
          <p className="mt-1 text-sm text-[#718078]">
            Identify credit facilities requiring proactive follow-up using explainable monitoring rules and AI operational summaries.
          </p>
        </div>
      </div>

      {/* Transparent Disclaimer Banner */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#2E7542] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Transparent Operational Monitoring:</strong> This system applies explainable microfinance monitoring rules (days elapsed since last collection, remaining balance ratio, and scheduled maturity dates). It does not claim to use black-box credit scores or default predictions. AI assists staff by summarizing facts and recommending field actions.
        </div>
      </div>

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs">
          <span className="text-xs font-semibold text-[#718078] uppercase tracking-wide">
            Assessed Loans
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-[#17231F]">
            {riskData.totalAssessedLoans}
          </div>
          <p className="mt-1 text-xs text-[#718078]">Active portfolio scope</p>
        </div>

        <div className="bg-white rounded-xl border border-red-200 p-5 shadow-xs bg-red-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#E4332C] uppercase tracking-wide">
              High Attention
            </span>
            <span className="w-2 h-2 rounded-full bg-[#E4332C]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#E4332C]">
            {riskData.highAttentionCount}
          </div>
          <p className="mt-1 text-xs text-[#718078]">Require immediate outreach</p>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#D99A30] uppercase tracking-wide">
              Medium Attention
            </span>
            <span className="w-2 h-2 rounded-full bg-[#D99A30]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#D99A30]">
            {riskData.mediumAttentionCount}
          </div>
          <p className="mt-1 text-xs text-[#718078]">Monitor on next cycle</p>
        </div>

        <div className="bg-white rounded-xl border border-[#C6E5CD] p-5 shadow-xs bg-[#E7F3EA]/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#2E7542] uppercase tracking-wide">
              Low Attention
            </span>
            <span className="w-2 h-2 rounded-full bg-[#2E7542]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#2E7542]">
            {riskData.lowAttentionCount}
          </div>
          <p className="mt-1 text-xs text-[#718078]">In good standing</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by borrower name or loan reference..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] focus:border-[#2E7542] focus:ring-1 focus:ring-[#2E7542] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          {(['All', 'High Attention', 'Medium Attention', 'Low Attention'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-white text-[#17231F] shadow-xs font-semibold'
                  : 'text-[#718078] hover:text-[#17231F]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Assessment Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left" aria-label="Risk Monitoring Table">
            <thead>
              <tr className="bg-[#F5F7F6] border-b border-[#E5E7EB] text-[#718078]">
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Borrower & Facility</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Total Due</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Repaid</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Outstanding</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Last Payment</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Detected Indicators</th>
                <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Attention Level</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredAssessments.map((a) => (
                <tr key={a.loanId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-semibold text-[#17231F] block">{a.clientName}</span>
                    <span className="font-mono text-[11px] text-[#2E7542]">
                      {a.loanReference} · {a.clientNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700 whitespace-nowrap">
                    {formatKES(a.totalAmountDue)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#2E7542] font-medium whitespace-nowrap">
                    {formatKES(a.totalRepaid)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                    <span className={a.outstandingBalance > 0 ? 'text-[#E4332C]' : 'text-[#2E7542]'}>
                      {formatKES(a.outstandingBalance)}
                    </span>
                    <span className="block text-[10px] text-[#718078] font-normal">
                      {a.outstandingRatio}% due
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono">
                    {a.lastRepaymentDate ? (
                      <>
                        <span>{a.lastRepaymentDate}</span>
                        <span className="block text-[10px] text-slate-400">
                          {a.daysSinceLastRepayment}d ago
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 italic">None recorded</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {a.detectedIndicators.length === 0 ? (
                        <span className="text-[11px] text-[#2E7542] font-medium">Nominal schedule</span>
                      ) : (
                        a.detectedIndicators.map((ind, idx) => (
                          <span
                            key={idx}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              ind.severity === 'high'
                                ? 'bg-red-50 text-[#E4332C] border border-red-200'
                                : 'bg-amber-50 text-[#D99A30] border border-amber-200'
                            }`}
                          >
                            {ind.label}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border ${
                        a.attentionCategory === 'High Attention'
                          ? 'bg-red-50 text-[#E4332C] border-red-200'
                          : a.attentionCategory === 'Medium Attention'
                          ? 'bg-amber-50 text-[#D99A30] border-amber-200'
                          : 'bg-[#E7F3EA] text-[#2E7542] border-[#C6E5CD]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          a.attentionCategory === 'High Attention'
                            ? 'bg-[#E4332C]'
                            : a.attentionCategory === 'Medium Attention'
                            ? 'bg-[#D99A30]'
                            : 'bg-[#2E7542]'
                        }`}
                      />
                      {a.attentionCategory}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleOpenAiExplanation(a)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#2E7542] bg-[#E7F3EA] hover:bg-[#C6E5CD] rounded-md transition-colors cursor-pointer"
                      title="Explain with AI"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Explain</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Explanation Deep-Dive Modal */}
      {selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedAssessment(null)} />

          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#F5F7F6]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E7F3EA] text-[#2E7542] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#17231F]">
                    AI Risk Interpretation & Field Guidance
                  </h3>
                  <p className="text-xs text-[#718078]">
                    {selectedAssessment.loanReference} — {selectedAssessment.clientName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAssessment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Account Quick Card */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Due:</span>
                  <span className="font-mono font-semibold text-[#17231F]">
                    {formatKES(selectedAssessment.totalAmountDue)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Repaid:</span>
                  <span className="font-mono font-semibold text-[#2E7542]">
                    {formatKES(selectedAssessment.totalRepaid)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Outstanding:</span>
                  <span className="font-mono font-bold text-[#E4332C]">
                    {formatKES(selectedAssessment.outstandingBalance)}
                  </span>
                </div>
              </div>

              {/* Triggered Rule Indicators */}
              <div>
                <span className="text-xs font-bold text-[#17231F] block mb-1">
                  Triggered Monitoring Rules:
                </span>
                <div className="space-y-1.5">
                  {selectedAssessment.detectedIndicators.map((ind, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border bg-white text-xs flex items-start gap-2 border-slate-200"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-[#D99A30] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[#17231F]">{ind.label}:</strong>{' '}
                        <span className="text-slate-600">{ind.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Explanation Box */}
              <div>
                <span className="text-xs font-bold text-[#2E7542] flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Operational Summary for Loan Officer:</span>
                </span>
                <div className="p-4 bg-[#E7F3EA]/30 border border-[#C6E5CD] rounded-xl text-xs text-[#17231F] leading-relaxed">
                  {isExplaining ? (
                    <div className="flex items-center gap-2 text-[#718078]">
                      <Loader2 className="w-4 h-4 animate-spin text-[#2E7542]" />
                      <span>Generating contextual credit officer guidance...</span>
                    </div>
                  ) : (
                    aiExplanationText
                  )}
                </div>
              </div>

              {/* Suggested Action */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
                <span className="font-bold text-amber-900 block mb-0.5">Recommended Field Action:</span>
                <p className="text-amber-800">{selectedAssessment.suggestedAction}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-[#F5F7F6] border-t border-[#E5E7EB] flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  setSelectedAssessment(null);
                  navigateTo('loan-details', { loanId: selectedAssessment.loanId });
                }}
                className="text-[#2E7542] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Open Loan File</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setSelectedAssessment(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

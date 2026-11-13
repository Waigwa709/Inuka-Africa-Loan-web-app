import { IAIProvider } from './ai-provider';
import { GeminiAIProvider } from './providers/gemini-provider';
import { OpenAIProvider } from './providers/openai-provider';
import {
  AIChatRequest,
  AIChatResponse,
  AIReportRequest,
  StructuredManagementReport,
  AIRiskExplanationRequest,
  AIRiskExplanationResponse,
} from './types';
import { formatKES } from '../currency';

export class AIService {
  private provider: IAIProvider;

  constructor() {
    const providerType = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    if (providerType === 'openai') {
      this.provider = new OpenAIProvider();
    } else {
      this.provider = new GeminiAIProvider();
    }
  }

  get activeProviderName(): string {
    return this.provider.providerName;
  }

  get activeModelName(): string {
    return this.provider.modelName;
  }

  /**
   * Handle financial questions with verified database grounding and robust error recovery
   */
  async askQuestion(request: AIChatRequest): Promise<AIChatResponse> {
    const q = request.question.trim().toLowerCase();
    const metrics = request.contextData?.metrics;
    const insights = request.contextData?.insights;

    try {
      return await this.provider.askFinancialQuestion(request);
    } catch (err: any) {
      console.warn('AI Provider invocation failed; using deterministic verified fallback:', err?.message || err);

      // Deterministic data-grounded fallback so the user always receives truthful answers.
      // Intent matching is ordered from most specific to most generic so that e.g.
      // "total outstanding balance" is not mistaken for "highest outstanding loan".
      let answer = '';
      const has = (...words: string[]) => words.some((w) => q.includes(w));

      if (has('highest', 'top loan', 'largest', 'biggest')) {
        const top = insights?.topOutstandingLoans[0];
        answer = top
          ? `The facility with the highest remaining balance is **${top.loanReference}** issued to **${top.clientName}**, with an outstanding balance of **${formatKES(top.outstandingBalance)}** against an initial obligation of ${formatKES(top.totalAmountDue)}.`
          : 'There are currently no outstanding loan balances in the portfolio.';
      } else if (has('fully paid', 'fully repaid', 'settled', 'closed loan')) {
        answer = `**${metrics?.fullyPaidLoansCount ?? 0}** loan facilities have been fully settled with zero outstanding balance. **${metrics?.partiallyPaidLoansCount ?? 0}** facilities are in active repayment and **${metrics?.outstandingLoansCount ?? 0}** are awaiting their first installment.`;
      } else if (has('outstanding', 'balance', 'remaining', 'owe', 'debt')) {
        answer = `The total outstanding loan balance across the portfolio is **${formatKES(metrics?.totalOutstandingBalance)}**, derived from a total amount due of **${formatKES(metrics?.totalAmountDue)}** less **${formatKES(metrics?.totalRepaid)}** collected to date.`;
      } else if (has('repaid', 'collected', 'paid so far', 'total repayment', 'recovery')) {
        answer = `Inuka Africa has collected a cumulative total of **${formatKES(metrics?.totalRepaid)}** across all repayment transactions, representing a **${metrics?.collectionRate ?? 0}%** recovery rate against the total amount due.`;
      } else if (has('month', 'recent collection', 'this month')) {
        answer = `Collections recorded for the current month total **${formatKES(insights?.collectedThisMonth)}** across **${insights?.countThisMonth ?? 0}** transactions. Compared to the previous month (${formatKES(insights?.collectedPreviousMonth)}), month-over-month growth is **${insights?.monthOverMonthGrowth ?? 0}%**.`;
      } else if (has('active', 'how many loan', 'how many client', 'borrower')) {
        answer = `Currently, Inuka Africa is tracking **${metrics?.activeLoansCount ?? 0}** active loan facilities (**${metrics?.partiallyPaidLoansCount ?? 0}** in repayment, **${metrics?.outstandingLoansCount ?? 0}** awaiting first installment) for **${metrics?.totalClientsCount ?? 0}** registered clients. **${metrics?.fullyPaidLoansCount ?? 0}** facilities have reached full settlement.`;
      } else if (has('disburs', 'principal', 'total loan', 'portfolio', 'overall', 'summary')) {
        answer = `According to verified ledger records, Inuka Africa has disbursed a cumulative total of **${formatKES(metrics?.totalDisbursed)}** across **${metrics?.totalLoansCount ?? 0}** loan facilities. The current outstanding balance stands at **${formatKES(metrics?.totalOutstandingBalance)}**, with **${formatKES(metrics?.totalRepaid)}** successfully collected (${metrics?.collectionRate ?? 0}% collection recovery rate).`;
      } else {
        answer = `Verified Institution Snapshot:\n• Total Disbursed: **${formatKES(metrics?.totalDisbursed)}**\n• Total Repaid: **${formatKES(metrics?.totalRepaid)}**\n• Outstanding Balance: **${formatKES(metrics?.totalOutstandingBalance)}**\n• Overall Collection Efficiency: **${metrics?.collectionRate ?? 0}%**\n• Active Borrowers: **${metrics?.totalClientsCount ?? 0}**`;
      }

      return {
        answer,
        intent: 'financial_inquiry_fallback',
        verifiedMetricsUsed: {
          totalDisbursed: metrics?.totalDisbursed,
          totalRepaid: metrics?.totalRepaid,
          outstandingBalance: metrics?.totalOutstandingBalance,
          collectionRate: metrics?.collectionRate,
        },
        provider: 'Inuka Local Analytics Engine',
        model: 'deterministic-rules',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate structured executive management report
   */
  async generateReport(request: AIReportRequest): Promise<StructuredManagementReport> {
    try {
      return await this.provider.generateManagementReport(request);
    } catch (err: any) {
      console.warn('AI Report generation fallback triggered:', err?.message || err);
      const { reportType, period, contextData } = request;
      const { metrics, insights, flaggedLoansCount } = contextData;

      return {
        title: `Inuka Africa - Management ${reportType.replace('-', ' ').toUpperCase()} Report`,
        period,
        generatedDate: new Date().toISOString().split('T')[0],
        executiveSummary: `Executive financial report for period: ${period}. Inuka Africa has disbursed ${formatKES(metrics.totalDisbursed)} across ${metrics.totalLoansCount} micro-credit facilities, with a current collection recovery rate of ${metrics.collectionRate}%. Cumulative outstanding portfolio balance is ${formatKES(metrics.totalOutstandingBalance)}.`,
        financialPerformance: {
          totalDisbursed: metrics.totalDisbursed,
          totalAmountDue: metrics.totalAmountDue,
          totalRepaid: metrics.totalRepaid,
          outstandingBalance: metrics.totalOutstandingBalance,
          collectionRate: metrics.collectionRate,
        },
        portfolioStatistics: {
          totalClients: metrics.totalClientsCount,
          totalLoans: metrics.totalLoansCount,
          activeLoans: metrics.activeLoansCount,
          fullyPaidLoans: metrics.fullyPaidLoansCount,
          partiallyPaidLoans: metrics.partiallyPaidLoansCount,
        },
        collectionPerformance: `Month-to-date collections stand at ${formatKES(insights.collectedThisMonth)} (${insights.countThisMonth} receipts), reflecting a ${insights.monthOverMonthGrowth >= 0 ? '+' : ''}${insights.monthOverMonthGrowth}% shift versus previous period.`,
        outstandingLoansAnalysis: `${metrics.activeLoansCount} facilities are active. ${flaggedLoansCount ?? 0} accounts have triggered rule-based operational monitoring thresholds.`,
        observations: [
          `Overall collection rate of ${metrics.collectionRate}% maintains healthy liquidity.`,
          `M-Pesa represents the primary repayment channel for micro-enterprise clients.`,
          `${metrics.fullyPaidLoansCount} facilities have been fully closed with zero default loss.`,
        ],
        recommendations: [
          'Maintain proactive SMS reminders 3 business days before payment dates.',
          'Conduct supervisory check-ins on borrowers with high outstanding balance ratios.',
          'Reward consistent on-time borrowers with graduated loan limit tier evaluations.',
        ],
      };
    }
  }

  /**
   * Explain loan risk
   */
  async explainRisk(request: AIRiskExplanationRequest): Promise<AIRiskExplanationResponse> {
    try {
      return await this.provider.explainLoanRisk(request);
    } catch (err: any) {
      console.warn('AI Risk explanation fallback triggered:', err?.message || err);
      const a = request.assessment;
      const reason = a.detectedIndicators.map((i) => i.label).join('; ') || 'Standard monitoring';
      const balanceText =
        a.outstandingBalance > 0
          ? `has an active outstanding balance of ${formatKES(a.outstandingBalance)} (${a.outstandingRatio}% of facility obligation)`
          : 'is fully settled with zero outstanding balance';

      return {
        explanation: `Facility ${a.loanReference} (${a.clientName}) ${balanceText}. Operational flags: ${reason}.`,
        suggestedAction: a.suggestedAction,
        contactPriority: a.attentionCategory === 'High Attention' ? 'Immediate' : a.attentionCategory === 'Medium Attention' ? 'Scheduled' : 'Routine',
      };
    }
  }
}

export const aiService = new AIService();

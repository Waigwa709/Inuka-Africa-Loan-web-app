import { GoogleGenAI } from '@google/genai';
import { IAIProvider } from '../ai-provider';
import {
  AIChatRequest,
  AIChatResponse,
  AIReportRequest,
  StructuredManagementReport,
  AIRiskExplanationRequest,
  AIRiskExplanationResponse,
} from '../types';
import {
  FINANCIAL_ANALYST_SYSTEM_INSTRUCTION,
  REPORT_GENERATOR_SYSTEM_INSTRUCTION,
  RISK_EXPLANATION_SYSTEM_INSTRUCTION,
} from '../prompts';
import { formatKES } from '../../currency';

export class GeminiAIProvider implements IAIProvider {
  public readonly providerName = 'Google Gemini';
  public readonly modelName = 'gemini-3.8-flash';
  private client: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  private ensureClient(): GoogleGenAI {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured on the server. Please verify your environment settings.');
      }
      this.client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.client;
  }

  async askFinancialQuestion(request: AIChatRequest): Promise<AIChatResponse> {
    const client = this.ensureClient();
    const metrics = request.contextData?.metrics;
    const insights = request.contextData?.insights;

    const contextSummary = `
VERIFIED FINANCIAL SNAPSHOT (KENYAN SHILLINGS):
- Total Clients: ${metrics?.totalClientsCount ?? 'N/A'}
- Total Loans Issued: ${metrics?.totalLoansCount ?? 'N/A'} (Active: ${metrics?.activeLoansCount ?? 'N/A'}, Fully Paid: ${metrics?.fullyPaidLoansCount ?? 'N/A'}, Partially Paid: ${metrics?.partiallyPaidLoansCount ?? 'N/A'})
- Total Disbursed: ${formatKES(metrics?.totalDisbursed)}
- Total Amount Due: ${formatKES(metrics?.totalAmountDue)}
- Total Repaid / Collected: ${formatKES(metrics?.totalRepaid)}
- Outstanding Balance: ${formatKES(metrics?.totalOutstandingBalance)}
- Overall Collection Rate: ${metrics?.collectionRate ?? 0}%
- Average Loan Size: ${formatKES(metrics?.averageLoanSize)}
- Average Repayment: ${formatKES(metrics?.averageRepaymentAmount)}
- Collections This Month: ${formatKES(insights?.collectedThisMonth)} (${insights?.countThisMonth ?? 0} transactions)
- Collections Previous Month: ${formatKES(insights?.collectedPreviousMonth)}
- Collections This Week: ${formatKES(insights?.collectedThisWeek)} (${insights?.countThisWeek ?? 0} transactions)
- Top Outstanding Borrowers: ${
      insights?.topClientsByBalance
        ?.map((c) => `${c.clientName} (${c.clientNumber}): ${formatKES(c.outstandingBalance)}`)
        .join('; ') || 'None'
    }
- Top Outstanding Loans: ${
      insights?.topOutstandingLoans
        ?.map((l) => `${l.loanReference} (${l.clientName}): Due ${formatKES(l.totalAmountDue)}, Bal ${formatKES(l.outstandingBalance)}`)
        .join('; ') || 'None'
    }
`.trim();

    const prompt = `
Verified Data:
${contextSummary}

User Question:
"${request.question}"

Please provide a clear, professional, data-backed answer based strictly on the verified numbers above.
`.trim();

    const response = await client.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        systemInstruction: FINANCIAL_ANALYST_SYSTEM_INSTRUCTION,
      },
    });

    const answer = response.text || 'Unable to generate response from verified data.';

    return {
      answer,
      intent: 'financial_inquiry',
      verifiedMetricsUsed: {
        totalDisbursed: metrics?.totalDisbursed,
        totalRepaid: metrics?.totalRepaid,
        outstandingBalance: metrics?.totalOutstandingBalance,
        collectionRate: metrics?.collectionRate,
        collectedThisMonth: insights?.collectedThisMonth,
      },
      provider: this.providerName,
      model: this.modelName,
      timestamp: new Date().toISOString(),
    };
  }

  async generateManagementReport(request: AIReportRequest): Promise<StructuredManagementReport> {
    const client = this.ensureClient();
    const { reportType, period, contextData } = request;
    const { metrics, insights, flaggedLoansCount } = contextData;

    const prompt = `
Generate a comprehensive, formal management report for Inuka Africa.
Report Type: "${reportType}"
Reporting Period: "${period}"

VERIFIED DATA (KENYAN SHILLINGS):
- Total Disbursed: ${formatKES(metrics.totalDisbursed)}
- Total Amount Due: ${formatKES(metrics.totalAmountDue)}
- Total Repaid: ${formatKES(metrics.totalRepaid)}
- Outstanding Balance: ${formatKES(metrics.totalOutstandingBalance)}
- Collection Rate: ${metrics.collectionRate}%
- Total Clients: ${metrics.totalClientsCount}
- Active Loans: ${metrics.activeLoansCount} (Fully Paid: ${metrics.fullyPaidLoansCount}, Partially Paid: ${metrics.partiallyPaidLoansCount})
- Collections This Month: ${formatKES(insights.collectedThisMonth)} (${insights.countThisMonth} receipts)
- Month-over-Month Growth: ${insights.monthOverMonthGrowth}%
- Flagged Attention Facilities: ${flaggedLoansCount ?? 0}
- Top Outstanding Loan: ${insights.topOutstandingLoans[0] ? `${insights.topOutstandingLoans[0].loanReference} (${insights.topOutstandingLoans[0].clientName}) - ${formatKES(insights.topOutstandingLoans[0].outstandingBalance)}` : 'N/A'}

Provide a structured report with:
1. Executive Summary (1 paragraph)
2. Collection & Recovery Performance (detailed observations)
3. Portfolio Quality & Outstanding Loan Observations (3 bullet points)
4. Strategic Management Recommendations (3 bullet points)
`.trim();

    const response = await client.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        systemInstruction: REPORT_GENERATOR_SYSTEM_INSTRUCTION,
      },
    });

    const text = response.text || '';

    const titleMap: Record<string, string> = {
      'portfolio-performance': 'Loan Portfolio Performance & Recovery Report',
      'monthly-collections': 'Monthly Collections & Cashflow Audit Report',
      'outstanding-loans': 'Outstanding Credit Facilities & Delinquency Review',
      'executive-summary': 'Executive Microfinance Portfolio Status Report',
    };

    return {
      title: titleMap[reportType] || 'Inuka Africa Financial Management Report',
      period,
      generatedDate: new Date().toISOString().split('T')[0],
      executiveSummary: text.slice(0, 500) || `Executive review of Inuka Africa's loan portfolio for period ${period}. Total collections stand at ${formatKES(metrics.totalRepaid)} with an overall recovery rate of ${metrics.collectionRate}%.`,
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
      collectionPerformance: `Current period collections total ${formatKES(insights.collectedThisMonth)} across ${insights.countThisMonth} transactions. Month-over-month trend reflects ${insights.monthOverMonthGrowth >= 0 ? '+' : ''}${insights.monthOverMonthGrowth}% movement.`,
      outstandingLoansAnalysis: `${metrics.activeLoansCount} facilities remain active with ${formatKES(metrics.totalOutstandingBalance)} in outstanding capital. ${flaggedLoansCount ?? 0} facilities require branch supervisory attention.`,
      observations: [
        `Portfolio collection efficiency stands at ${metrics.collectionRate}%, indicating steady borrower repayment adherence.`,
        `Branch operations have recorded ${insights.countThisMonth} payment receipts this month, totaling ${formatKES(insights.collectedThisMonth)}.`,
        `${metrics.fullyPaidLoansCount} facilities have been fully retired with zero residual default balance.`,
      ],
      recommendations: [
        'Maintain automated SMS payment alerts 3 days prior to borrower installment due dates.',
        'Prioritize field credit visits for facilities flagged with high outstanding balance ratios.',
        'Consider second-cycle credit limit enhancements for borrowers demonstrating 100% on-time repayment records.',
      ],
      rawMarkdown: text,
    };
  }

  async explainLoanRisk(request: AIRiskExplanationRequest): Promise<AIRiskExplanationResponse> {
    const client = this.ensureClient();
    const a = request.assessment;

    const indicatorsText = a.detectedIndicators.map((i) => `- ${i.label}: ${i.description}`).join('\n');

    const prompt = `
Loan Facility Risk Analysis:
- Loan Reference: ${a.loanReference}
- Borrower Name: ${a.clientName} (${a.clientNumber})
- Principal Disbursed: ${formatKES(a.loanAmount)}
- Total Due: ${formatKES(a.totalAmountDue)}
- Total Repaid: ${formatKES(a.totalRepaid)}
- Outstanding Balance: ${formatKES(a.outstandingBalance)} (${a.outstandingRatio}% of facility)
- Last Repayment Date: ${a.lastRepaymentDate || 'None'} (${a.daysSinceLastRepayment !== null ? `${a.daysSinceLastRepayment} days ago` : 'No repayments'})
- Maturity Due Date: ${a.dueDate || 'Unspecified'} (Overdue: ${a.isOverdue ? 'YES' : 'NO'})
- Rule Indicators:
${indicatorsText}

Write an objective, concise summary for the loan officer and propose an actionable next step. Keep under 100 words.
`.trim();

    const response = await client.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        systemInstruction: RISK_EXPLANATION_SYSTEM_INSTRUCTION,
      },
    });

    const explanation = response.text || `Facility ${a.loanReference} has an outstanding balance of ${formatKES(a.outstandingBalance)}. ${a.detectedIndicators[0]?.label || 'Requires review'}.`;

    return {
      explanation,
      suggestedAction: a.suggestedAction,
      contactPriority: a.attentionCategory === 'High Attention' ? 'Immediate' : a.attentionCategory === 'Medium Attention' ? 'Scheduled' : 'Routine',
    };
  }
}

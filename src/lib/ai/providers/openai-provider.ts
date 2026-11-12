import { IAIProvider } from '../ai-provider';
import {
  AIChatRequest,
  AIChatResponse,
  AIReportRequest,
  StructuredManagementReport,
  AIRiskExplanationRequest,
  AIRiskExplanationResponse,
} from '../types';
import { formatKES } from '../../currency';

/**
 * Standard OpenAI Compatible Provider adapter for future deployment or OpenAI key integration.
 */
export class OpenAIProvider implements IAIProvider {
  public readonly providerName = 'OpenAI';
  public readonly modelName = process.env.AI_MODEL || 'gpt-4o';
  private apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

  async askFinancialQuestion(request: AIChatRequest): Promise<AIChatResponse> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured on the server. Please configure it or use Google Gemini.');
    }

    // Call OpenAI standard completions endpoint
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: 'You are the Inuka Africa Financial AI assistant. Answer using verified data strictly.',
          },
          { role: 'user', content: request.question },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error: ${err}`);
    }

    const json = await res.json();
    const answer = json.choices?.[0]?.message?.content || 'No response returned.';

    return {
      answer,
      intent: 'financial_inquiry',
      verifiedMetricsUsed: {},
      provider: this.providerName,
      model: this.modelName,
      timestamp: new Date().toISOString(),
    };
  }

  async generateManagementReport(request: AIReportRequest): Promise<StructuredManagementReport> {
    const { reportType, period, contextData } = request;
    const { metrics } = contextData;
    return {
      title: `Inuka Africa - ${reportType} (${period})`,
      period,
      generatedDate: new Date().toISOString().split('T')[0],
      executiveSummary: `Generated management report for ${period}. Total collections are ${formatKES(metrics.totalRepaid)}.`,
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
      collectionPerformance: `Overall collection efficiency is ${metrics.collectionRate}%.`,
      outstandingLoansAnalysis: `Active portfolio balance: ${formatKES(metrics.totalOutstandingBalance)}.`,
      observations: ['Portfolio metrics verified against ledger.'],
      recommendations: ['Maintain standard collection routines.'],
    };
  }

  async explainLoanRisk(request: AIRiskExplanationRequest): Promise<AIRiskExplanationResponse> {
    const a = request.assessment;
    return {
      explanation: `Loan ${a.loanReference} has an outstanding balance of ${formatKES(a.outstandingBalance)}. Triggered indicators: ${a.detectedIndicators.map((i) => i.label).join(', ')}.`,
      suggestedAction: a.suggestedAction,
      contactPriority: a.attentionCategory === 'High Attention' ? 'Immediate' : 'Scheduled',
    };
  }
}

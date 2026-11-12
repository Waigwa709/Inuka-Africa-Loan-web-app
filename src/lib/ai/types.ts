import { PortfolioMetrics } from '../analytics/portfolio-analytics';
import { RepaymentInsights } from '../analytics/repayment-analytics';
import { LoanRiskAssessment } from '../analytics/risk-analysis';

export type AIProviderType = 'gemini' | 'openai' | 'claude';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  verifiedDataSnippet?: {
    totalDisbursed?: number;
    totalRepaid?: number;
    outstandingBalance?: number;
    collectionRate?: number;
    metricLabel?: string;
    metricValue?: string | number;
  };
}

export interface AIChatRequest {
  question: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  contextData?: {
    metrics: PortfolioMetrics;
    insights: RepaymentInsights;
  };
}

export interface AIChatResponse {
  answer: string;
  intent: string;
  verifiedMetricsUsed: Record<string, any>;
  provider: string;
  model: string;
  timestamp: string;
}

export type ReportCategory =
  | 'portfolio-performance'
  | 'monthly-collections'
  | 'outstanding-loans'
  | 'executive-summary';

export interface AIReportRequest {
  reportType: ReportCategory;
  period: string; // e.g. "Current Month", "Last 30 Days", "Year-to-Date", "All Time"
  contextData: {
    metrics: PortfolioMetrics;
    insights: RepaymentInsights;
    flaggedLoansCount?: number;
  };
}

export interface StructuredManagementReport {
  title: string;
  period: string;
  generatedDate: string;
  executiveSummary: string;
  financialPerformance: {
    totalDisbursed: number;
    totalAmountDue: number;
    totalRepaid: number;
    outstandingBalance: number;
    collectionRate: number;
  };
  portfolioStatistics: {
    totalClients: number;
    totalLoans: number;
    activeLoans: number;
    fullyPaidLoans: number;
    partiallyPaidLoans: number;
  };
  collectionPerformance: string;
  outstandingLoansAnalysis: string;
  observations: string[];
  recommendations: string[];
  rawMarkdown?: string;
}

export interface AIRiskExplanationRequest {
  assessment: LoanRiskAssessment;
}

export interface AIRiskExplanationResponse {
  explanation: string;
  suggestedAction: string;
  contactPriority: 'Immediate' | 'Scheduled' | 'Routine';
}

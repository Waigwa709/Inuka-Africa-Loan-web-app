import {
  AIChatRequest,
  AIChatResponse,
  AIReportRequest,
  StructuredManagementReport,
  AIRiskExplanationRequest,
  AIRiskExplanationResponse,
} from './types';

export interface IAIProvider {
  readonly providerName: string;
  readonly modelName: string;

  /**
   * Answer a portfolio or repayment question given verified financial data
   */
  askFinancialQuestion(request: AIChatRequest): Promise<AIChatResponse>;

  /**
   * Generate an executive management report given verified financial metrics
   */
  generateManagementReport(request: AIReportRequest): Promise<StructuredManagementReport>;

  /**
   * Explain why a loan facility was flagged and propose follow-up action
   */
  explainLoanRisk(request: AIRiskExplanationRequest): Promise<AIRiskExplanationResponse>;
}

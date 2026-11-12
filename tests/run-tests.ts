import { calculatePortfolioMetrics, getMonthlyRepaymentHistory } from '../src/lib/analytics/portfolio-analytics';
import { calculateRepaymentInsights } from '../src/lib/analytics/repayment-analytics';
import { assessPortfolioRisk } from '../src/lib/analytics/risk-analysis';
import { INITIAL_CLIENTS, INITIAL_REPAYMENTS, getInitialLoans } from '../src/lib/mock-data';
import { aiService } from '../src/lib/ai/ai-service';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log(' INUKA AFRICA - AUTOMATED FINANCIAL & AI TEST SUITE');
  console.log('======================================================\n');

  const loans = getInitialLoans();
  const repayments = INITIAL_REPAYMENTS;
  const clients = INITIAL_CLIENTS;

  // 1. FINANCIAL ANALYTICS TESTS
  console.log('1. Financial Analytics & Deterministic Calculations:');
  const metrics = calculatePortfolioMetrics(loans, repayments, clients.length);

  // Sum loans principal
  const expectedDisbursed = loans.reduce((s, l) => s + l.loanAmount, 0);
  assert(metrics.totalDisbursed === expectedDisbursed, 'Total Disbursed matches sum of principal amounts', `got ${metrics.totalDisbursed}, expected ${expectedDisbursed}`);

  // Sum total repaid
  const expectedRepaid = repayments.reduce((s, r) => s + r.amount, 0);
  assert(metrics.totalRepaid === expectedRepaid, 'Total Repaid matches sum of all repayments', `got ${metrics.totalRepaid}, expected ${expectedRepaid}`);

  // Outstanding balance
  const expectedOutstanding = loans.reduce((s, l) => s + l.outstandingBalance, 0);
  assert(metrics.totalOutstandingBalance === expectedOutstanding, 'Total Outstanding Balance matches sum of individual loan balances');

  // Collection rate
  const expectedRate = Math.round((metrics.totalRepaid / metrics.totalAmountDue) * 10000) / 100;
  assert(Math.abs(metrics.collectionRate - expectedRate) < 0.1, 'Collection Rate formula: (totalRepaid / totalAmountDue) * 100');

  // Classification of loans
  const fullyPaid = loans.filter((l) => l.status === 'Fully Paid');
  assert(fullyPaid.length === metrics.fullyPaidLoansCount, 'Fully paid count matches loans where totalRepaid >= totalAmountDue');
  assert(fullyPaid.every((l) => l.outstandingBalance === 0), 'Every fully paid loan has exactly 0 outstanding balance');

  // Date filtering
  const monthly = getMonthlyRepaymentHistory(repayments, 6);
  assert(monthly.length === 6, 'Monthly repayment history returns exactly requested 6 periods');
  assert(monthly.every((m) => m.monthKey.length === 7), 'Month keys formatted as YYYY-MM');

  // 2. REPAYMENT INSIGHTS & RANKINGS TESTS
  console.log('\n2. Repayment Insights & Rankings:');
  const clientsWithStats = clients.map((c) => {
    const cLoans = loans.filter((l) => l.clientId === c.id);
    return {
      ...c,
      loansCount: cLoans.length,
      totalBorrowed: cLoans.reduce((s, l) => s + l.loanAmount, 0),
      totalRepaid: cLoans.reduce((s, l) => s + l.totalRepaid, 0),
      outstandingBalance: cLoans.reduce((s, l) => s + l.outstandingBalance, 0),
    };
  });
  const insights = calculateRepaymentInsights(loans, repayments, clientsWithStats);

  assert(insights.topOutstandingLoans.length <= 5, 'Top outstanding loans returns at most top 5');
  assert(
    insights.topOutstandingLoans.every((l, i, arr) => i === 0 || arr[i - 1].outstandingBalance >= l.outstandingBalance),
    'Top outstanding loans ordered in descending order of remaining balance'
  );

  // 3. RISK ANALYSIS & RULE-BASED MONITORING TESTS
  console.log('\n3. Repayment Risk Analysis & Monitoring Rules:');
  const riskSummary = assessPortfolioRisk(loans, repayments, {
    noRepaymentDays: 30,
    highOutstandingRatio: 75,
  });

  assert(riskSummary.totalAssessedLoans === loans.length, 'Risk assessment evaluates 100% of portfolio loans');
  assert(
    riskSummary.highAttentionCount + riskSummary.mediumAttentionCount + riskSummary.lowAttentionCount === loans.length,
    'All loans are partitioned strictly into High, Medium, or Low attention'
  );

  // Fully paid loan risk check
  const fullyPaidAssessments = riskSummary.assessments.filter((a) => a.totalRepaid >= a.totalAmountDue);
  assert(
    fullyPaidAssessments.every((a) => a.attentionCategory === 'Low Attention' && a.detectedIndicators.length === 0),
    'Fully paid loans are NEVER incorrectly flagged with risk indicators or high attention'
  );

  // High ratio rule check
  const highRatioLoans = riskSummary.assessments.filter((a) => a.outstandingRatio >= 75);
  assert(
    highRatioLoans.every((a) => a.detectedIndicators.some((i) => i.id === 'HIGH_OUTSTANDING_RATIO')),
    'Loans with outstanding balance >= 75% trigger HIGH_OUTSTANDING_RATIO rule indicator'
  );

  // 4. AI SERVICE INTEGRATION & GROUNDING TESTS
  console.log('\n4. AI Service Grounding & Fallback Handling:');
  const questionRes = await aiService.askQuestion({
    question: 'What is our total loan portfolio and how much has been disbursed?',
    contextData: { metrics, insights },
  });

  assert(typeof questionRes.answer === 'string' && questionRes.answer.length > 20, 'AI Service produces non-empty financial response');
  assert(questionRes.answer.includes('KES') || questionRes.answer.includes('disburs'), 'AI response cites verified KES currency and disbursed concepts');

  // Report generation test
  const reportRes = await aiService.generateReport({
    reportType: 'portfolio-performance',
    period: 'Current Month',
    contextData: { metrics, insights },
  });

  assert(reportRes.title.includes('Report'), 'Report generator produces structured report title');
  assert(reportRes.financialPerformance.totalDisbursed === metrics.totalDisbursed, 'Report preserves exact verified financial metrics');
  assert(reportRes.observations.length >= 2, 'Report provides structured observations');
  assert(reportRes.recommendations.length >= 2, 'Report provides actionable recommendations');

  // Risk explanation test
  const flaggedLoan = riskSummary.assessments.find((a) => a.attentionCategory !== 'Low Attention') || riskSummary.assessments[0];
  const riskExplanation = await aiService.explainRisk({
    assessment: flaggedLoan,
  });

  assert(typeof riskExplanation.explanation === 'string' && riskExplanation.explanation.length > 10, 'Risk explanation produces clear officer summary');
  assert(!!riskExplanation.suggestedAction, 'Risk explanation includes actionable next step for loan officer');

  console.log('\n======================================================');
  console.log(` TEST SUMMARY: ${passedTests} PASSED / ${failedTests} FAILED (${totalTests} total)`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});

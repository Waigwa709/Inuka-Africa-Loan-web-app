import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatKES } from './currency';

// Brand colors
const BRAND = {
  primary: [40, 122, 70] as [number, number, number], // #2E7542
  primaryDark: [30, 99, 55] as [number, number, number], // #1E6337
  red: [233, 47, 43] as [number, number, number], // #E4332C
  navy: [17, 24, 39] as [number, number, number], // #111827
  muted: [113, 128, 120] as [number, number, number], // #718078
  lightGrey: [245, 247, 246] as [number, number, number], // #F5F7F6
  border: [229, 231, 235] as [number, number, number], // #E5E7EB
  softGreen: [231, 243, 234] as [number, number, number], // #E7F3EA
};

interface PDFHeaderOptions {
  title: string;
  subtitle?: string;
  period?: string;
  generatedDate?: string;
}

interface PDFTableOptions {
  head: string[][];
  body: any[][];
  startY?: number;
}

/**
 * Adds branded header to PDF document
 */
function addPDFHeader(doc: jsPDF, options: PDFHeaderOptions): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  // Header background
  doc.setFillColor(...BRAND.lightGrey);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Logo/Brand text
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND.navy);
  doc.text('INUKA', margin, 18);
  
  doc.setTextColor(...BRAND.primary);
  doc.text('AFRICA', margin + 35, 18);
  
  // Tagline
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...BRAND.muted);
  doc.text('Making Growth Possible.', margin, 26);
  
  // Report title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND.navy);
  doc.text(options.title, margin, 36);
  
  // Right side info
  const rightX = pageWidth - margin;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.muted);
  
  if (options.period) {
    doc.text(`Period: ${options.period}`, rightX, 15, { align: 'right' });
  }
  
  const dateStr = options.generatedDate || new Date().toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated: ${dateStr}`, rightX, 22, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.primary);
  doc.text('Verified Financial Ledger Audit', rightX, 30, { align: 'right' });
  
  return 50; // Return Y position after header
}

/**
 * Adds footer to PDF page
 */
function addPDFFooter(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.muted);
  
  doc.text('Prepared by: Inuka Africa Operations & AI Analytics Core', margin, pageHeight - 15);
  doc.text(`Document ID: INK-REP-${Date.now().toString().slice(-6)} · Confidential`, pageWidth - margin, pageHeight - 15, { align: 'right' });
  
  // Page number
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
  }
}

/**
 * Adds a section title to PDF
 */
function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  const margin = 20;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND.navy);
  doc.text(title, margin, y);
  
  // Underline
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 2, doc.internal.pageSize.getWidth() - margin, y + 2);
  
  return y + 10;
}

/**
 * Adds a styled table to PDF
 */
function addStyledTable(doc: jsPDF, options: PDFTableOptions): number {
  const margin = 20;
  
  autoTable(doc, {
    startY: options.startY || 60,
    head: options.head,
    body: options.body,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: BRAND.border,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: BRAND.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: BRAND.lightGrey,
    },
    columnStyles: {
      0: { cellWidth: 40 },
    },
  });
  
  // @ts-ignore - autoTable returns the final Y position
  return doc.lastAutoTable?.finalY || 100;
}

/**
 * Adds a key-value metrics grid to PDF
 */
function addMetricsGrid(doc: jsPDF, metrics: { label: string; value: string; color?: [number, number, number] }[], y: number): number {
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - margin * 2 - 15) / 3; // 3 columns with gaps
  const boxHeight = 25;
  const gap = 5;
  
  metrics.forEach((metric, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = margin + col * (boxWidth + gap);
    const yPos = y + row * (boxHeight + gap);
    
    // Box background
    doc.setFillColor(...BRAND.lightGrey);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 2, 2, 'F');
    
    // Border
    doc.setDrawColor(...BRAND.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 2, 2, 'S');
    
    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.muted);
    doc.text(metric.label, x + 5, yPos + 10);
    
    // Value
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(metric.color || BRAND.navy));
    doc.text(metric.value, x + 5, yPos + 20);
  });
  
  const rows = Math.ceil(metrics.length / 3);
  return y + rows * (boxHeight + gap) + 10;
}

/**
 * Adds bullet points section to PDF
 */
function addBulletSection(doc: jsPDF, title: string, items: string[], y: number): number {
  const margin = 20;
  
  y = addSectionTitle(doc, title, y);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.navy);
  
  items.forEach((item, index) => {
    const lines = doc.splitTextToSize(`• ${item}`, doc.internal.pageSize.getWidth() - margin * 2 - 10);
    doc.text(lines, margin + 5, y);
    y += lines.length * 5 + 2;
  });
  
  return y + 10;
}

/**
 * Exports AI Management Report to PDF
 */
export function exportReportToPDF(report: any): void {
  const doc = new jsPDF();
  
  // Header
  let y = addPDFHeader(doc, {
    title: report.title,
    period: report.period,
    generatedDate: report.generatedDate,
  });
  
  // Executive Summary
  y = addSectionTitle(doc, '1. Executive Summary', y);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.navy);
  const summaryLines = doc.splitTextToSize(report.executiveSummary, doc.internal.pageSize.getWidth() - 40);
  doc.text(summaryLines, 20, y);
  y += summaryLines.length * 5 + 15;
  
  // Financial Metrics Grid
  y = addSectionTitle(doc, '2. Financial Performance Metrics (KES)', y);
  y = addMetricsGrid(doc, [
    { label: 'Total Disbursed', value: formatKES(report.financialPerformance.totalDisbursed) },
    { label: 'Total Amount Due', value: formatKES(report.financialPerformance.totalAmountDue) },
    { label: 'Total Repaid', value: formatKES(report.financialPerformance.totalRepaid), color: BRAND.primary },
    { label: 'Outstanding Balance', value: formatKES(report.financialPerformance.outstandingBalance), color: BRAND.red },
    { label: 'Collection Rate', value: `${report.financialPerformance.collectionRate}%`, color: BRAND.primary },
  ], y);
  
  // Portfolio Statistics
  y = addSectionTitle(doc, '3. Portfolio Distribution', y);
  y = addStyledTable(doc, {
    startY: y,
    head: [['Metric', 'Count']],
    body: [
      ['Total Clients', report.portfolioStatistics.totalClients.toString()],
      ['Active Facilities', report.portfolioStatistics.activeLoans.toString()],
      ['Fully Settled', report.portfolioStatistics.fullyPaidLoans.toString()],
      ['Partially Paid', report.portfolioStatistics.partiallyPaidLoans.toString()],
    ],
  });
  
  // Collection Performance & Outstanding Analysis
  y = addSectionTitle(doc, '4. Collection & Outstanding Analysis', y);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.navy);
  
  const collectionLines = doc.splitTextToSize(report.collectionPerformance, doc.internal.pageSize.getWidth() - 40);
  doc.text(collectionLines, 20, y);
  y += collectionLines.length * 5 + 10;
  
  const outstandingLines = doc.splitTextToSize(report.outstandingLoansAnalysis, doc.internal.pageSize.getWidth() - 40);
  doc.text(outstandingLines, 20, y);
  y += outstandingLines.length * 5 + 15;
  
  // Key Observations
  y = addBulletSection(doc, '5. Key Portfolio Observations', report.observations, y);
  
  // Recommendations
  y = addBulletSection(doc, '6. Strategic Operational Recommendations', report.recommendations, y);
  
  // Footer
  addPDFFooter(doc);
  
  // Save
  const fileName = `Inuka-Africa-Report-${report.reportType}-${Date.now()}.pdf`;
  doc.save(fileName);
}

/**
 * Exports portfolio summary to PDF
 */
export function exportPortfolioToPDF(data: {
  metrics: any;
  insights: any;
  risk: any;
}): void {
  const doc = new jsPDF();
  
  // Header
  let y = addPDFHeader(doc, {
    title: 'Portfolio Performance Report',
    period: 'Current Period',
  });
  
  // Key Metrics
  y = addSectionTitle(doc, 'Portfolio Summary', y);
  y = addMetricsGrid(doc, [
    { label: 'Total Clients', value: data.metrics.totalClients.toString() },
    { label: 'Total Loans', value: data.metrics.totalLoans.toString() },
    { label: 'Total Disbursed', value: formatKES(data.metrics.totalDisbursed) },
    { label: 'Total Repaid', value: formatKES(data.metrics.totalRepaid), color: BRAND.primary },
    { label: 'Outstanding Balance', value: formatKES(data.metrics.totalOutstandingBalance), color: BRAND.red },
    { label: 'Collection Rate', value: `${data.metrics.collectionRate}%`, color: BRAND.primary },
  ], y);
  
  // Monthly Collections
  if (data.insights.monthlyCollections && data.insights.monthlyCollections.length > 0) {
    y = addSectionTitle(doc, 'Monthly Collections (Last 6 Months)', y);
    y = addStyledTable(doc, {
      startY: y,
      head: [['Month', 'Collections (KES)', 'Transactions']],
      body: data.insights.monthlyCollections.map((m: any) => [
        m.month,
        formatKES(m.collections),
        m.transactions.toString(),
      ]),
    });
  }
  
  // Top Outstanding Loans
  if (data.insights.topOutstandingLoans && data.insights.topOutstandingLoans.length > 0) {
    y = addSectionTitle(doc, 'Top Outstanding Loans', y);
    y = addStyledTable(doc, {
      startY: y,
      head: [['Loan Ref', 'Client', 'Outstanding (KES)', 'Due Date']],
      body: data.insights.topOutstandingLoans.map((loan: any) => [
        loan.loanReference,
        loan.clientName,
        formatKES(loan.outstandingBalance),
        loan.dueDate || 'N/A',
      ]),
    });
  }
  
  // Risk Summary
  if (data.risk) {
    y = addSectionTitle(doc, 'Risk Assessment Summary', y);
    y = addMetricsGrid(doc, [
      { label: 'High Attention', value: data.risk.highAttentionCount.toString(), color: BRAND.red },
      { label: 'Medium Attention', value: data.risk.mediumAttentionCount.toString(), color: [217, 154, 48] as [number, number, number] },
      { label: 'Low Attention', value: data.risk.lowAttentionCount.toString(), color: BRAND.primary },
      { label: 'Flagged Balance', value: formatKES(data.risk.flaggedPortfolioBalance), color: BRAND.red },
    ], y);
  }
  
  // Footer
  addPDFFooter(doc);
  
  // Save
  doc.save(`Inuka-Africa-Portfolio-Report-${Date.now()}.pdf`);
}

/**
 * Exports repayments data to PDF
 */
export function exportRepaymentsToPDF(repayments: any[]): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  
  // Header
  let y = addPDFHeader(doc, {
    title: 'Repayment Transactions Report',
    period: 'All Time',
  });
  
  // Table
  y = addStyledTable(doc, {
    startY: y,
    head: [['Date', 'Reference', 'Loan', 'Client', 'Amount (KES)', 'Method', 'Notes']],
    body: repayments.map((r) => [
      r.paymentDate,
      r.paymentReference,
      r.loanReference,
      r.clientName,
      formatKES(r.amount),
      r.paymentMethod,
      r.notes || '-',
    ]),
  });
  
  // Footer
  addPDFFooter(doc);
  
  // Save
  doc.save(`Inuka-Africa-Repayments-${Date.now()}.pdf`);
}

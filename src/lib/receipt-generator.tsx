import React from 'react';
import { jsPDF } from 'jspdf';
import logoImage from '../assets/images/Inuka-Africa-logo.png';

export interface ReceiptData {
  receiptNumber: string;
  paymentReference: string;
  clientName: string;
  clientNumber: string;
  loanReference: string;
  loanPurpose: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
  institutionName: string;
  tagline: string;
  currencyCode: string;
  // New fields for enhanced receipt
  totalPayments: number;
  paymentHistory: Array<{
    date: string;
    amount: number;
    method: string;
    reference: string;
  }>;
  outstandingBalance: number;
  totalLoanAmount: number;
  totalRepaid: number;
}

export const generateReceiptPDF = (data: ReceiptData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Colors
  const primaryColor: [number, number, number] = [46, 117, 66]; // #2E7542
  const accentColor: [number, number, number] = [228, 51, 44]; // #E4332C
  const textColor: [number, number, number] = [23, 35, 31]; // #17231F
  const mutedColor: [number, number, number] = [113, 128, 120]; // #718078
  
  // Header Background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 100, 'F');
  
  // Logo - centered and properly sized
  try {
    const logoSize = 50;
    const logoX = (pageWidth - logoSize) / 2;
    doc.addImage(logoImage, 'PNG', logoX, 15, logoSize, logoSize);
  } catch (e) {
    console.warn('Could not add logo to PDF');
  }
  
  // Tagline below logo
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'italic');
  doc.text(data.tagline, pageWidth / 2, 75, { align: 'center' });
  
  // Receipt Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT RECEIPT', pageWidth / 2, 90, { align: 'center' });
  
  // Receipt Number and Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt #: ${data.receiptNumber}`, 20, 115);
  doc.text(`Date: ${new Date(data.paymentDate).toLocaleDateString('en-KE')}`, pageWidth - 20, 115, { align: 'right' });
  
  // Divider Line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(2);
  doc.line(20, 125, pageWidth - 20, 125);
  
  // Client Information Section
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT INFORMATION', 20, 145);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.clientName}`, 20, 160);
  doc.text(`Client #: ${data.clientNumber}`, 20, 175);
  
  // Loan Information Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LOAN DETAILS', pageWidth / 2 + 10, 145);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Loan Ref: ${data.loanReference}`, pageWidth / 2 + 10, 160);
  doc.text(`Purpose: ${data.loanPurpose}`, pageWidth / 2 + 10, 175);
  doc.text(`Total Loan: ${data.currencyCode} ${data.totalLoanAmount.toLocaleString()}`, pageWidth / 2 + 10, 190);
  
  // Payment Details Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', 20, 215);
  
  // Payment Box
  doc.setFillColor(240, 240, 240);
  doc.rect(20, 225, pageWidth - 40, 80, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(`Amount Paid: ${data.currencyCode} ${data.amount.toLocaleString()}`, 30, 245);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  doc.text(`Payment Method: ${data.paymentMethod}`, 30, 260);
  doc.text(`Payment Reference: ${data.paymentReference}`, 30, 272);
  doc.text(`Total Payments: ${data.totalPayments}`, 30, 284);
  
  if (data.transactionId) {
    doc.text(`Transaction ID: ${data.transactionId}`, pageWidth / 2 + 10, 245);
  }
  
  // Balance Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentColor);
  doc.text(`Outstanding Balance: ${data.currencyCode} ${data.outstandingBalance.toLocaleString()}`, pageWidth / 2 + 10, 260);
  doc.text(`Total Repaid: ${data.currencyCode} ${data.totalRepaid.toLocaleString()}`, pageWidth / 2 + 10, 275);
  
  // Payment History Section
  let yPos = 340;
  if (data.paymentHistory.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.text('PAYMENT HISTORY', 20, 325);
    
    // Payment history table
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', 20, yPos);
    doc.text('Amount', 80, yPos);
    doc.text('Method', 140, yPos);
    doc.text('Reference', 200, yPos);
    
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    
    data.paymentHistory.forEach((payment) => {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 30;
      }
      
      doc.text(new Date(payment.date).toLocaleDateString('en-KE'), 20, yPos);
      doc.text(`${data.currencyCode} ${payment.amount.toLocaleString()}`, 80, yPos);
      doc.text(payment.method, 140, yPos);
      doc.text(payment.reference, 200, yPos);
      yPos += 8;
    });
  }
  
  // Notes Section
  if (data.notes) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', 20, yPos + 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(data.notes, 20, yPos + 35, { maxWidth: pageWidth - 40 });
  }
  
  // Footer
  doc.setFillColor(...primaryColor);
  doc.rect(0, pageHeight - 40, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your payment!', pageWidth / 2, pageHeight - 25, { align: 'center' });
  doc.text('This is an official receipt from Inuka Africa Limited', pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  // Save PDF
  doc.save(`receipt-${data.receiptNumber}.pdf`);
};

export const ReceiptPreview: React.FC<{ data: ReceiptData }> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      {/* Header with Logo */}
      <div className="bg-[#2E7542] rounded-t-lg p-6 text-center mb-0">
        <img src={logoImage} alt="Inuka Africa" className="w-20 h-20 object-contain mx-auto mb-3" />
        <p className="text-white text-sm italic">{data.tagline}</p>
        <h2 className="text-2xl font-bold text-white mt-2">PAYMENT RECEIPT</h2>
      </div>

      {/* Receipt Info */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-[#718078]">Receipt #: {data.receiptNumber}</span>
          <span className="text-[#718078]">Date: {new Date(data.paymentDate).toLocaleDateString('en-KE')}</span>
        </div>
      </div>

      {/* Client & Loan Info */}
      <div className="grid grid-cols-2 gap-8 p-6 border-b border-gray-200">
        <div>
          <h3 className="font-bold text-[#17231F] mb-2">CLIENT INFORMATION</h3>
          <p className="text-sm text-[#718078]">Name: {data.clientName}</p>
          <p className="text-sm text-[#718078]">Client #: {data.clientNumber}</p>
        </div>
        <div>
          <h3 className="font-bold text-[#17231F] mb-2">LOAN DETAILS</h3>
          <p className="text-sm text-[#718078]">Loan Ref: {data.loanReference}</p>
          <p className="text-sm text-[#718078]">Purpose: {data.loanPurpose}</p>
          <p className="text-sm text-[#718078]">Total Loan: {data.currencyCode} {data.totalLoanAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-gray-50 p-6 border-b border-gray-200">
        <h3 className="font-bold text-[#17231F] mb-4">PAYMENT DETAILS</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-[#718078]">Amount Paid</p>
            <p className="text-2xl font-bold text-[#2E7542]">{data.currencyCode} {data.amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-[#718078]">Payment Method</p>
            <p className="text-lg font-semibold text-[#17231F]">{data.paymentMethod}</p>
          </div>
          <div>
            <p className="text-sm text-[#718078]">Payment Reference</p>
            <p className="text-sm font-mono text-[#17231F]">{data.paymentReference}</p>
          </div>
          <div>
            <p className="text-sm text-[#718078]">Total Payments</p>
            <p className="text-lg font-semibold text-[#17231F]">{data.totalPayments}</p>
          </div>
          {data.transactionId && (
            <div>
              <p className="text-sm text-[#718078]">Transaction ID</p>
              <p className="text-sm font-mono text-[#17231F]">{data.transactionId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Balance Information */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="font-bold text-[#17231F] mb-4">BALANCE INFORMATION</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-[#718078]">Outstanding Balance</p>
            <p className="text-xl font-bold text-[#E4332C]">{data.currencyCode} {data.outstandingBalance.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-[#718078]">Total Repaid</p>
            <p className="text-xl font-bold text-[#2E7542]">{data.currencyCode} {data.totalRepaid.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {data.paymentHistory.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-bold text-[#17231F] mb-4">PAYMENT HISTORY</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-[#718078] font-semibold">Date</th>
                  <th className="text-left py-2 text-[#718078] font-semibold">Amount</th>
                  <th className="text-left py-2 text-[#718078] font-semibold">Method</th>
                  <th className="text-left py-2 text-[#718078] font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody>
                {data.paymentHistory.map((payment, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 text-[#17231F]">{new Date(payment.date).toLocaleDateString('en-KE')}</td>
                    <td className="py-2 text-[#17231F] font-semibold">{data.currencyCode} {payment.amount.toLocaleString()}</td>
                    <td className="py-2 text-[#718078]">{payment.method}</td>
                    <td className="py-2 text-[#718078] font-mono text-xs">{payment.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-bold text-[#17231F] mb-2">NOTES</h3>
          <p className="text-sm text-[#718078]">{data.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="bg-[#2E7542] text-white p-4 text-center rounded-b-lg">
        <p className="font-semibold">Thank you for your payment!</p>
        <p className="text-sm opacity-90">This is an official receipt from {data.institutionName}</p>
      </div>
    </div>
  );
};

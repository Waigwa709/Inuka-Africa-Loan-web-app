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
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  // Logo
  try {
    doc.addImage(logoImage, 'PNG', 20, 15, 40, 40);
  } catch (e) {
    console.warn('Could not add logo to PDF');
  }
  
  // Institution Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.institutionName, 70, 30);
  
  // Tagline
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.tagline, 70, 42);
  
  // Receipt Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT RECEIPT', pageWidth - 60, 30, { align: 'right' });
  
  // Receipt Number
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt #: ${data.receiptNumber}`, pageWidth - 60, 42, { align: 'right' });
  
  // Date
  doc.text(`Date: ${new Date(data.paymentDate).toLocaleDateString('en-KE')}`, pageWidth - 60, 54, { align: 'right' });
  
  // Divider Line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(2);
  doc.line(20, 90, pageWidth - 20, 90);
  
  // Client Information Section
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT INFORMATION', 20, 110);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.clientName}`, 20, 125);
  doc.text(`Client #: ${data.clientNumber}`, 20, 140);
  
  // Loan Information Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LOAN DETAILS', pageWidth / 2 + 10, 110);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Loan Ref: ${data.loanReference}`, pageWidth / 2 + 10, 125);
  doc.text(`Purpose: ${data.loanPurpose}`, pageWidth / 2 + 10, 140);
  
  // Payment Details Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', 20, 165);
  
  // Payment Box
  doc.setFillColor(240, 240, 240);
  doc.rect(20, 175, pageWidth - 40, 60, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(`Amount Paid: ${data.currencyCode} ${data.amount.toLocaleString()}`, 30, 195);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  doc.text(`Payment Method: ${data.paymentMethod}`, 30, 210);
  doc.text(`Payment Reference: ${data.paymentReference}`, 30, 222);
  
  if (data.transactionId) {
    doc.text(`Transaction ID: ${data.transactionId}`, pageWidth / 2 + 10, 195);
  }
  
  // Notes Section
  if (data.notes) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', 20, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(data.notes, 20, 270, { maxWidth: pageWidth - 40 });
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
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <img src={logoImage} alt="Inuka Africa" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-[#2E7542]">{data.institutionName}</h1>
            <p className="text-sm text-[#718078]">{data.tagline}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-[#17231F]">PAYMENT RECEIPT</h2>
          <p className="text-sm text-[#718078]">Receipt #: {data.receiptNumber}</p>
          <p className="text-sm text-[#718078]">Date: {new Date(data.paymentDate).toLocaleDateString('en-KE')}</p>
        </div>
      </div>

      {/* Client & Loan Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-bold text-[#17231F] mb-2">CLIENT INFORMATION</h3>
          <p className="text-sm text-[#718078]">Name: {data.clientName}</p>
          <p className="text-sm text-[#718078]">Client #: {data.clientNumber}</p>
        </div>
        <div>
          <h3 className="font-bold text-[#17231F] mb-2">LOAN DETAILS</h3>
          <p className="text-sm text-[#718078]">Loan Ref: {data.loanReference}</p>
          <p className="text-sm text-[#718078]">Purpose: {data.loanPurpose}</p>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
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
          {data.transactionId && (
            <div>
              <p className="text-sm text-[#718078]">Transaction ID</p>
              <p className="text-sm font-mono text-[#17231F]">{data.transactionId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="mb-6">
          <h3 className="font-bold text-[#17231F] mb-2">NOTES</h3>
          <p className="text-sm text-[#718078]">{data.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="bg-[#2E7542] text-white rounded-lg p-4 text-center">
        <p className="font-semibold">Thank you for your payment!</p>
        <p className="text-sm opacity-90">This is an official receipt from {data.institutionName}</p>
      </div>
    </div>
  );
};

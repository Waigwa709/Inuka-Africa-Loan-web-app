import React from 'react';
import { LoanStatus } from '../../types/loan';

interface StatusBadgeProps {
  status: LoanStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'Fully Paid':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-[#E7F3EA] text-[#287A46] border border-[#C6E5CD] whitespace-nowrap ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#287A46]" aria-hidden="true" />
          Fully Paid
        </span>
      );
    case 'Partially Paid':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-[#FEF6E7] text-[#B45309] border border-[#FDE6B8] whitespace-nowrap ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#D99A30]" aria-hidden="true" />
          Partially Paid
        </span>
      );
    case 'Outstanding':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-[#F3F4F6] text-[#475467] border border-[#E5E7EB] whitespace-nowrap ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#98A2B3]" aria-hidden="true" />
          Outstanding
        </span>
      );
  }
};

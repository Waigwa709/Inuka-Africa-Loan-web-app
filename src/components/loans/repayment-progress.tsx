import React from 'react';
import { formatKES } from '../../lib/currency';

interface RepaymentProgressProps {
  totalAmountDue: number;
  totalRepaid: number;
  outstandingBalance: number;
  className?: string;
}

export const RepaymentProgress: React.FC<RepaymentProgressProps> = ({
  totalAmountDue,
  totalRepaid,
  outstandingBalance,
  className = '',
}) => {
  const percentage =
    totalAmountDue > 0
      ? Math.min(100, Math.max(0, (totalRepaid / totalAmountDue) * 100))
      : 0;

  const isComplete = percentage >= 100;

  return (
    <div className={`p-5 bg-white rounded-xl border border-[#E5E7EB] shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#17231F]">Repayment Progress</span>
        <span className="text-sm font-bold font-mono text-[#2E7542]">
          {percentage.toFixed(1)}% Repaid
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isComplete
              ? 'bg-[#2E7542]'
              : percentage > 50
              ? 'bg-[#2E7542]'
              : 'bg-[#D99A30]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Metrics Row */}
      <div className="flex items-center justify-between mt-3 text-xs pt-2 border-t border-slate-100">
        <div>
          <span className="text-[#718078] block text-[11px]">Total Paid:</span>
          <span className="font-mono font-semibold text-[#17231F]">
            {formatKES(totalRepaid)}
          </span>
        </div>

        <div className="text-center">
          <span className="text-[#718078] block text-[11px]">Total Due:</span>
          <span className="font-mono font-medium text-slate-700">
            {formatKES(totalAmountDue)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[#718078] block text-[11px]">Remaining:</span>
          <span className={`font-mono font-bold ${outstandingBalance > 0 ? 'text-[#E4332C]' : 'text-[#2E7542]'}`}>
            {formatKES(outstandingBalance)}
          </span>
        </div>
      </div>
    </div>
  );
};

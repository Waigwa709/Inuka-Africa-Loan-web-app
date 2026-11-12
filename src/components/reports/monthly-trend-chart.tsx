import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useStore } from '../../lib/store';
import { formatKES } from '../../lib/currency';

interface MonthlyTrendData {
  month: string;
  monthKey: string;
  collected: number;
  target: number;
  variance: number;
}

export const MonthlyTrendChart: React.FC = () => {
  const { repayments, loans } = useStore();

  const chartData = useMemo((): MonthlyTrendData[] => {
    const now = new Date();
    const months: MonthlyTrendData[] = [];

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      // Calculate collected amount for this month
      const monthRepayments = repayments.filter((r) => {
        const paymentDate = new Date(r.paymentDate);
        const paymentMonth = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
        return paymentMonth === monthKey;
      });

      const collected = monthRepayments.reduce((sum, r) => sum + r.amount, 0);

      // Calculate target (average monthly collection target based on total outstanding / 12)
      const totalOutstanding = loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
      const target = Math.round(totalOutstanding / 12);

      months.push({
        month: monthName,
        monthKey,
        collected: Math.round(collected),
        target,
        variance: Math.round(collected - target),
      });
    }

    return months;
  }, [repayments, loans]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-[#E5E7EB]">
          <p className="font-semibold text-[#17231F] mb-2">{label}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-[#2E7542]">Collected:</span>
              <span className="font-mono font-semibold">{formatKES(data.collected)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#718078]">Target:</span>
              <span className="font-mono">{formatKES(data.target)}</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-slate-100">
              <span className="text-[#17231F]">Variance:</span>
              <span className={`font-mono font-semibold ${data.variance >= 0 ? 'text-[#2E7542]' : 'text-[#E4332C]'}`}>
                {data.variance >= 0 ? '+' : ''}{formatKES(data.variance)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-[#17231F]">Total Collected vs. Target</h2>
          <p className="text-xs text-[#718078]">Monthly repayment performance over the last 12 months</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#2E7542]" />
            <span className="text-[#718078]">Collected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#D99A30]" />
            <span className="text-[#718078]">Target</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#718078' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#718078' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-xs text-[#718078]">{value}</span>}
            />
            <Line
              type="monotone"
              dataKey="collected"
              name="Collected"
              stroke="#2E7542"
              strokeWidth={2}
              dot={{ fill: '#2E7542', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#2E7542', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="target"
              name="Target"
              stroke="#D99A30"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#D99A30', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#D99A30', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

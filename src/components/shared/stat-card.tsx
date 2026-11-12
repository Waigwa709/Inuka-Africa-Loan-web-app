import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  badge?: string;
  accentColor?: string; // Optional accent tint
  isCurrency?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  badge,
  isCurrency = false,
}) => {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs hover:border-[#D0D5DD] transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide uppercase text-[#718078]">
          {title}
        </span>
        <div className="w-8 h-8 rounded-lg bg-[#F5F7F6] text-[#287A46] flex items-center justify-center shrink-0 border border-[#E5E7EB]">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className={`text-2xl font-bold text-[#17231F] tracking-tight ${isCurrency ? 'font-mono tabular-nums' : ''}`}>
          {value}
        </div>
        {description && (
          <p className="mt-1 text-xs text-[#718078] flex items-center gap-1.5">
            {badge && (
              <span className="font-medium text-[#287A46]">{badge}</span>
            )}
            <span>{description}</span>
          </p>
        )}
      </div>
    </div>
  );
};

import React from 'react';

interface InukaLogoProps {
  collapsed?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

export const InukaLogo: React.FC<InukaLogoProps> = ({
  collapsed = false,
  theme = 'dark',
  className = '',
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Geometric Inuka Africa Brand Icon */}
      <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#287A46] to-[#1E6337] flex items-center justify-center shrink-0 shadow-sm border border-white/10">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
        >
          {/* Growth leaf & chevron mark */}
          <path
            d="M6 22C6 14.268 12.268 8 20 8H26V14C26 21.732 19.732 28 12 28H6V22Z"
            fill="#FFFFFF"
            fillOpacity="0.95"
          />
          <path
            d="M13 14C13 10.134 16.134 7 20 7H24V11C24 14.866 20.866 18 17 18H13V14Z"
            fill="#287A46"
          />
          <circle cx="21" cy="11" r="2.5" fill="#E92F2B" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-base font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-[#111827]'
              }`}
            >
              INUKA
            </span>
            <span
              className={`text-base font-semibold tracking-tight ${
                isDark ? 'text-[#34D399]' : 'text-[#287A46]'
              }`}
            >
              AFRICA
            </span>
          </div>
          <span
            className={`text-[10px] font-medium tracking-wide ${
              isDark ? 'text-slate-400' : 'text-[#718078]'
            }`}
          >
            Loan Management
          </span>
        </div>
      )}
    </div>
  );
};

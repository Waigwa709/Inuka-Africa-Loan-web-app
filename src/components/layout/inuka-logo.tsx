import React from 'react';
import logoImage from '../../assets/images/Inuka-Africa-logo.png';

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
      {/* Inuka Africa Logo Image */}
      <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 shadow-sm border border-white/10">
        <img
          src={logoImage}
          alt="Inuka Africa Logo"
          className="w-full h-full object-cover"
        />
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
                isDark ? 'text-[#34D399]' : 'text-[#2E7542]'
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

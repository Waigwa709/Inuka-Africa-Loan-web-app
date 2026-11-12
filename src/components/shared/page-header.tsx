import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  secondaryAction,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17231F]">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[#718078]">{subtitle}</p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 shrink-0">
          {secondaryAction}
          {action}
        </div>
      )}
    </div>
  );
};

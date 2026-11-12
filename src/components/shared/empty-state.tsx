import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-[#E5E7EB] my-4">
      <div className="w-12 h-12 rounded-full bg-[#E7F3EA] text-[#2E7542] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#17231F]">{title}</h3>
      <p className="mt-1 text-sm text-[#718078] max-w-md">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2E7542] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

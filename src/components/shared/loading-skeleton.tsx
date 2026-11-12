import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 5, className = '' }) => {
  return (
    <div className={`space-y-3 p-4 bg-white rounded-xl border border-[#E5E7EB] ${className}`} aria-label="Loading content">
      <div className="h-6 bg-slate-100 rounded w-1/4 animate-pulse" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 bg-slate-100 rounded w-1/6 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-1/4 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-1/5 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-1/6 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-1/8 animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};

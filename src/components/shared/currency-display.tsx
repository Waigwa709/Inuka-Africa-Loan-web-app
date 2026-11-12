import React from 'react';
import { formatKES } from '../../lib/currency';

interface CurrencyDisplayProps {
  amount: number | string | null | undefined;
  className?: string;
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  className = '',
  size = 'base',
}) => {
  const formatted = formatKES(amount);

  const sizeClass = {
    sm: 'text-xs',
    base: 'text-sm font-medium',
    lg: 'text-base font-semibold',
    xl: 'text-xl font-bold',
    '2xl': 'text-2xl font-bold tracking-tight',
  }[size];

  return (
    <span className={`font-mono tabular-nums ${sizeClass} ${className}`}>
      {formatted}
    </span>
  );
};

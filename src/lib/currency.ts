/**
 * Official Kenyan Currency & Financial formatting utility for Inuka Africa.
 * Uses Intl.NumberFormat standard for Kenyan Shillings (KES).
 */

const kesFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format any number into KES currency string (e.g. KES 10,000.00)
 */
export function formatKES(amount: number | string | null | undefined): string {
  const numeric = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  if (isNaN(numeric)) {
    return 'KES 0.00';
  }
  return kesFormatter.format(numeric);
}

/**
 * Safe round to 2 decimal places to prevent floating-point discrepancies
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

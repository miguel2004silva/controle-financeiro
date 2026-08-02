/**
 * Real-time Brazilian currency input mask.
 * Automatically formats digits as the user types (e.g., typing "1" -> "0,01", "100" -> "1,00", "150050" -> "1.500,50").
 */
export function maskCurrency(value: string | number): string {
  if (value === undefined || value === null || value === '') return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  
  const numValue = parseInt(digits, 10) / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

/**
 * Safely parses any currency string input (e.g. "R$ 1.500,50", "1.500,50", "1500.50", "1500") into a clean float number.
 */
export function parseCurrencyInput(value: string | number): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;

  const cleanStr = String(value).replace(/[^0-9,.]/g, '');
  if (!cleanStr) return 0;

  if (cleanStr.includes(',')) {
    const normalized = cleanStr.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  } else {
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  }
}

/**
 * Formats a numeric value into BRL currency (R$ 1.500,00)
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

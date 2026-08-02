/**
 * Safely parses any currency string input (e.g. "R$ 1.500,50", "1500.50", "R$1500") into a clean float number.
 */
export function parseCurrencyInput(value: string): number {
  if (!value) return 0;
  const cleanStr = value.replace(/[^0-9,.]/g, '');
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

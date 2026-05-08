export const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return `₺${currencyFormatter.format(value ?? 0)}`;
}

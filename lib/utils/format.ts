export const currencyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return `₺${currencyFormatter.format(value ?? 0)}`;
}

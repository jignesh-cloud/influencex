export function formatFollowers(value: number | null): string {
  if (value === null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value.toFixed(1)}%`;
}

export function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

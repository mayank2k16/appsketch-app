export function formatSettlementDate(time?: string): string {
  if (!time) return 'NA';
  const timestamp = new Date(time);
  if (Number.isNaN(timestamp.getTime())) return 'NA';
  const day = timestamp.getDate();
  const month = timestamp.toLocaleString('default', { month: 'short' });
  const year = timestamp.getFullYear();
  return `${day} ${month}, ${year}`;
}

export function money(v: number | string | undefined | null): string {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

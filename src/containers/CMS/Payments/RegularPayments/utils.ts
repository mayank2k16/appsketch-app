/** Regular Payments' `created_on` comes back as `DD-MM-YYYY HH:MM:SS`
 * (not ISO) — ported straight from Vite's `PaymentCard/index.jsx` `formatDate`,
 * which does this same split-and-reassemble before handing it to `Date`. */
export function formatPaymentDate(time?: string): string {
  if (!time) return 'NA';
  const [datePart, timePart] = time.split(' ');
  const [day, month, year] = (datePart ?? '').split('-');
  const timestamp = new Date(`${year}-${month}-${day}T${timePart ?? '00:00:00'}`);
  if (Number.isNaN(timestamp.getTime())) return 'NA';
  const d = timestamp.getDate();
  const m = timestamp.toLocaleString('default', { month: 'short' });
  const y = timestamp.getFullYear();
  return `${d} ${m}, ${y}`;
}

/** Vite derives a display "customer" name by stripping digits out of the
 * order title (`order_details.title`) rather than a real customer field —
 * kept as-is since that's the only name the payments endpoint returns. */
export function extractCustomerName(str?: string): string {
  if (!str) return 'NA';
  return str.replace(/\d+/g, '').trim() || 'NA';
}

export function money(v: number | string | undefined | null): string {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

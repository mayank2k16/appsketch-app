/** Direct port of Vite's `Cms/Dashboard/utils.js` `formatDate` — used by both
 * `AbandonedCarts` and `CheckoutOrders`. */
export function formatDate(time: string | null | undefined): string {
  if (!time) return '—';
  const timestamp = new Date(time);
  if (Number.isNaN(timestamp.getTime())) return '—';
  const day = timestamp.getDate();
  const month = timestamp.toLocaleString('default', { month: 'short' });
  const year = timestamp.getFullYear();
  return `${day} ${month}, ${year}`;
}

/** ₹ with Indian digit grouping (1,23,456). Safe on the UI thread. */
export function inr(n: number): string {
  'worklet';
  const s = Math.max(0, Math.round(n)).toString();
  if (s.length <= 3) return `₹${s}`;
  let rest = s.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `₹${parts.join(',')},${s.slice(-3)}`;
}

/** "$1,234.50" / "$12" — a non-rupee amount (US grouping, cents only when
 *  there are any). Safe on the UI thread. */
export function foreign(n: number, symbol: string): string {
  'worklet';
  const cents = Math.round(Math.max(0, n) * 100);
  const whole = Math.floor(cents / 100).toString();
  const frac = cents % 100;
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${symbol}${grouped}${frac ? `.${frac.toString().padStart(2, '0')}` : ''}`;
}

/** Like `inr` but keeps the sign: −₹450 for a discount line. */
export function signedInr(n: number): string {
  'worklet';
  return n < 0 ? `−${inr(-n)}` : inr(n);
}

/** "Android app" → "Android" (the build tiles read as the platform). */
export const buildName = (name: string) =>
  name.replace(/\s+app$/i, '').trim() || name;

export function shortDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const plural = (n: number, word: string) =>
  `${n} ${word}${n === 1 ? '' : 's'}`;

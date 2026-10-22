import type { MarketTemplate } from '@/api/templates';

import { wordOf } from './word-tiles';

/**
 * A tile's chips — pure. The template's category first, as its short word
 * ("Fashion & Apparel" → "Fashion"), then its API `tags`, cleaned up for
 * reading ("ecommerce" → "E-commerce", "hotel" → "Hotels"). Tags that are
 * about the gallery rather than the template (mobile, new, featured,
 * trending) are left out, and so is any tag that repeats the category.
 */

const SKIP = new Set(['mobile', 'new', 'featured', 'trending', 'web']);

const LABELS: Record<string, string> = {
  ecommerce: 'E-commerce',
  'e-commerce': 'E-commerce',
  saas: 'SaaS',
  crm: 'CRM',
  ai: 'AI',
  b2b: 'B2B',
  hotel: 'Hotels',
  booking: 'Bookings',
  'food delivery': 'Food delivery',
  'real estate': 'Real estate',
  restaurant: 'Restaurants',
  rides: 'Rides',
  events: 'Events',
  listings: 'Listings',
  pets: 'Pets',
  gifts: 'Gifts',
};

const labelOf = (tag: string) => {
  const k = tag.trim().toLowerCase();
  if (LABELS[k]) return LABELS[k];
  return k.charAt(0).toUpperCase() + k.slice(1);
};

const same = (a: string, b: string) => {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x === y || x.startsWith(y) || y.startsWith(x);
};

/** Every chip the template could show, best first: the category in full,
 *  then the tags. */
function candidates(t: MarketTemplate): string[] {
  const out: string[] = [];
  const category = t.kind === 'code' ? t.category : null;
  if (category) out.push(category);
  const word = category ? wordOf(category) : '';
  for (const tag of t.tags ?? []) {
    if (!tag || SKIP.has(tag.trim().toLowerCase())) continue;
    const label = labelOf(tag);
    if (word && same(label, word)) continue;
    if (out.some((o) => same(o, label))) continue;
    out.push(label);
  }
  return out;
}

/** A chip's width at 10pt Inter Medium, erring wide (~6pt a character)
 *  plus its padding — so a chip that is counted in always fits whole. */
export const chipW = (label: string) => Math.ceil(label.length * 6 + 14);
export const CHIP_GAP = 4;

/** A label too wide for the tile, as two lines split at the word gap that
 *  balances them best ("Construction &" / "Industrial"). The break is
 *  explicit, so the text never relies on wrapping and is never cut. */
export function splitLabel(label: string): string[] {
  const words = label.split(' ');
  if (words.length < 2) return [label];
  let best = [label];
  let worst = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const m = Math.max(a.length, b.length);
    if (m < worst) {
      worst = m;
      best = [a, b];
    }
  }
  return best;
}
/** The category and at most two tags — compact, never a wall of chips. */
const MAX_CHIPS = 3;

/** The chips that fit WHOLE in `lines` lines of `width` (wrapping), in
 *  order; a chip that would not fit is left out, never cut. The category
 *  always shows, even when it alone needs both lines (its text wraps). */
export function chipsOf(
  t: MarketTemplate,
  { width, lines }: { width: number; lines: number }
): string[] {
  const all = candidates(t);
  const out: string[] = [];
  let line = 1;
  let x = 0;
  for (const label of all.slice(0, MAX_CHIPS)) {
    const w = Math.min(chipW(label), width);
    const at = x === 0 ? 0 : x + CHIP_GAP;
    if (at + w <= width) {
      out.push(label);
      x = at + w;
    } else if (line < lines) {
      line++;
      out.push(label);
      x = w;
    } else if (out.length === 0) {
      out.push(label);
    }
    if (chipW(label) > width) line = lines; // a wrapped chip fills both
  }
  return out;
}

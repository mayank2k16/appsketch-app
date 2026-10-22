import type { MarketTemplate } from '@/api/templates';

import { isMobile } from '../TemplateReel/layout';
import { wordOf } from './word-tiles';

/**
 * The black showcase's three story cards (App Store "Today" style) as data
 * — pure. All three share one design (three screenshots on paper sheets,
 * fanned out) and differ in tint and content, each built from real
 * templates of one category:
 *  - `fan`: a category's collection; the card opens the category, its
 *    pill the first template.
 *  - `phone`: a featured app (and two more apps of its category).
 *  - `browser`: a website (and two more of its category).
 * The three use different categories where the list allows. The tab words are true to the data: "Editor's pick"
 * only for a template the API marks featured, "New arrival" only for one
 * tagged new, "Trending now" only for a collection with a trending tag.
 */

export type StoryKind = 'fan' | 'phone' | 'browser';

export type Tint = {
  /** Border, tab, and the vivid body the text sits on. */
  edge: string;
  /** The near-black top of the art. */
  deep: string;
  /** The bottom row's band (a shade darker than the body). */
  band: string;
  /** Eyebrow / subtitle / caption text. */
  light: string;
};

/** In card order: violet (the App Store's "Happening now"), copper ("Now
 *  available"), crimson. */
export const TINTS: readonly Tint[] = [
  { edge: '#6C00CF', deep: '#140037', band: '#6300BD', light: '#E88AFC' },
  { edge: '#95571E', deep: '#1E0F04', band: '#874E1A', light: '#F7CB98' },
  { edge: '#B8123A', deep: '#2A040F', band: '#A60F34', light: '#FFADC0' },
];

export type Story = {
  key: string;
  kind: StoryKind;
  tab: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  /** The category the card is about (fan opens it). */
  category: string;
  /** The three sheets the art fans out (the lead in the middle). */
  art: MarketTemplate[];
  /** The bottom row's template and the pill's target. */
  lead: MarketTemplate;
  /** The product page swipes through this (the category, lead first). */
  list: MarketTemplate[];
  tint: Tint;
};

/** Eyebrow + title per category; anything else gets the generic pair. */
const COPY: Record<string, [string, string]> = {
  'Fashion & Apparel': ['FASHION STORES', 'A storefront for every collection'],
  'Food & Grocery': ['GROCERY & DELIVERY', 'Groceries to the door, in a tap'],
  'Home & Furniture': ['HOME & FURNITURE', 'Rooms worth scrolling through'],
  'Beauty & Cosmetics': ['BEAUTY STORES', 'Beauty brands, beautifully sold'],
  'Real Estate': ['REAL ESTATE', 'Listings that open the door'],
  'Restaurants & Cafes': ['RESTAURANTS', 'Menus, orders and tables, sorted'],
  'Cabs & Rentals': ['RIDES & RENTALS', 'A ride, booked in a few taps'],
  'Home Services': ['HOME SERVICES', 'Book trusted help for the home'],
  Resorts: ['STAYS & RESORTS', 'Rooms, rates and bookings in one place'],
  'Agency & Studio': ['AGENCIES & STUDIOS', 'Portfolios with real presence'],
  'Entertainment & Events': ['EVENTS', 'Line-ups, tickets and nights out'],
  'Sports & Fitness': ['FITNESS', 'Classes, plans and members, together'],
  'Jewelry & Luxury Goods': ['LUXURY', 'Fine pieces, finely presented'],
  'Electronics & Gadgets': ['ELECTRONICS', 'Gadgets, specs and checkout'],
  'SaaS & Technology': ['SOFTWARE', 'A launch page for your product'],
};

const copyOf = (category: string): [string, string] =>
  COPY[category] ?? [
    category.toUpperCase(),
    `${wordOf(category)} templates, ready to launch`,
  ];

const has = (t: MarketTemplate, tag: string) =>
  (t.tags ?? []).some((x) => x.toLowerCase() === tag);
const isFeatured = (t: MarketTemplate) =>
  t.kind === 'code' && (!!t.featured || has(t, 'featured'));
const categoryOfT = (t: MarketTemplate) =>
  (t.kind === 'code' && t.category) || '';

/** The description's first sentence, or a fallback. */
function firstLine(t: MarketTemplate, fallback: string) {
  const d = (t.description ?? '').trim();
  if (!d) return fallback;
  const m = d.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : d).trim();
}

/** Featured first, then tagged new, then list order. */
const rank = (t: MarketTemplate) =>
  (isFeatured(t) ? 0 : 2) + (has(t, 'new') ? 0 : 1);
const byRank = (list: MarketTemplate[]) =>
  list
    .map((t, i) => ({ t, i }))
    .sort((a, b) => rank(a.t) - rank(b.t) || a.i - b.i)
    .map((x) => x.t);

type Ctx = {
  byCat: Map<string, MarketTemplate[]>;
  used: Set<string>;
  tints: Set<number>;
};

function tintFor(ctx: Ctx): Tint {
  const k = ctx.tints.size % TINTS.length;
  ctx.tints.add(k);
  return TINTS[k];
}

const listFor = (lead: MarketTemplate, ctx: Ctx) => [
  lead,
  ...(ctx.byCat.get(categoryOfT(lead)) ?? []).filter((t) => t !== lead),
];

function fanStory(ctx: Ctx): Story | null {
  const cats = [...ctx.byCat.entries()]
    .filter(([c, l]) => c && !ctx.used.has(c) && l.length >= 3)
    .sort((a, b) => b[1].length - a[1].length);
  if (!cats.length) return null;
  const [category, all] = cats[0];
  ctx.used.add(category);
  const art = byRank(all).slice(0, 3);
  const [eyebrow, title] = copyOf(category);
  return {
    key: `fan-${category}`,
    kind: 'fan',
    tab: all.some((t) => has(t, 'trending')) ? 'TRENDING NOW' : 'COLLECTION',
    eyebrow,
    title,
    subtitle: `${all.length} ${category} templates to start from`,
    category,
    art,
    lead: art[0],
    list: listFor(art[0], ctx),
    tint: tintFor(ctx),
  };
}

function singleStory(
  ctx: Ctx,
  { kind, pool }: { kind: 'phone' | 'browser'; pool: MarketTemplate[] }
): Story | null {
  // A category with three templates for the sheets, unused if possible.
  const full = (t: MarketTemplate) =>
    (ctx.byCat.get(categoryOfT(t))?.length ?? 0) >= 3;
  const fresh = pool.filter((t) => !ctx.used.has(categoryOfT(t)));
  const lead = byRank(
    [fresh.filter(full), fresh, pool].find((l) => l.length) ?? []
  )[0];
  if (!lead) return null;
  const category = categoryOfT(lead) || 'Templates';
  ctx.used.add(category);
  const [eyebrow, title] = copyOf(category);
  // The website was picked for being new, so it says so (and the two
  // single cards do not both read "Editor's pick").
  const isNew = has(lead, 'new');
  const tab =
    kind === 'browser' && isNew
      ? 'NEW ARRIVAL'
      : isFeatured(lead)
        ? "EDITOR'S PICK"
        : isNew
          ? 'NEW ARRIVAL'
          : 'SPOTLIGHT';
  const fallback =
    kind === 'phone' ? 'A native iOS and Android app' : 'A live website';
  return {
    key: `${kind}-${lead.key}`,
    kind,
    tab,
    eyebrow,
    title,
    subtitle: firstLine(lead, fallback),
    category,
    art: sheetsFor(lead, ctx, pool),
    lead,
    list: listFor(lead, ctx),
    tint: tintFor(ctx),
  };
}

/** The lead, then two more from its category (else from its pool). */
function sheetsFor(
  lead: MarketTemplate,
  ctx: Ctx,
  pool: MarketTemplate[]
): MarketTemplate[] {
  const rest = byRank(ctx.byCat.get(categoryOfT(lead)) ?? []);
  const more = [...rest, ...pool].filter((t) => t !== lead);
  return [lead, ...[...new Set(more)].slice(0, 2)];
}

/** Up to three stories (fewer when the list is small), in card order. */
export function pickStories(templates: MarketTemplate[]): Story[] {
  const byCat = new Map<string, MarketTemplate[]>();
  for (const t of templates) {
    const c = categoryOfT(t);
    if (!c) continue;
    byCat.set(c, [...(byCat.get(c) ?? []), t]);
  }
  const ctx: Ctx = { byCat, used: new Set(), tints: new Set() };
  const fan = fanStory(ctx);
  const apps = templates.filter(isMobile);
  const phone = singleStory(ctx, {
    kind: 'phone',
    pool: apps.some(isFeatured) ? apps.filter(isFeatured) : apps,
  });
  // A website tagged new first (its tab then says so), any website else.
  const webs = templates.filter((t) => !isMobile(t) && t.kind === 'code');
  const browser = singleStory(ctx, {
    kind: 'browser',
    pool: webs.some((t) => has(t, 'new'))
      ? webs.filter((t) => has(t, 'new'))
      : webs,
  });
  return [fan, phone, browser].filter((s): s is Story => !!s);
}

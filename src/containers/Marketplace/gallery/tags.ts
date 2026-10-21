/**
 * The coloured chips beside a card's name, and whether it wears the red
 * "Featured" tag. A port of the web gallery's templateTags.ts
 * (frontend next/src/app/_containers/AITemplates); keep the two in step.
 */
type Tagged = { tags?: string[]; category?: string; featured?: boolean };

export type Tone =
  | 'orange'
  | 'blue'
  | 'red'
  | 'green'
  | 'violet'
  | 'teal'
  | 'pink'
  | 'slate';

/** Each tone as `r, g, b`, the web's `--tag`. */
export const TONE_RGB: Record<Tone, string> = {
  orange: '234, 88, 12',
  blue: '37, 99, 235',
  red: '220, 38, 38',
  green: '22, 163, 74',
  violet: '124, 58, 237',
  teal: '13, 148, 136',
  pink: '219, 39, 119',
  slate: '100, 116, 139',
};

const MOST = 2;

const KNOWN: Record<string, { label: string; tone: Tone }> = {
  ecommerce: { label: 'Ecommerce', tone: 'orange' },
  store: { label: 'Ecommerce', tone: 'orange' },
  shop: { label: 'Ecommerce', tone: 'orange' },
  marketplace: { label: 'Marketplace', tone: 'orange' },
  booking: { label: 'Booking', tone: 'blue' },
  hotel: { label: 'Hotel', tone: 'blue' },
  resorts: { label: 'Resorts', tone: 'blue' },
  resort: { label: 'Resort', tone: 'blue' },
  travel: { label: 'Travel', tone: 'blue' },
  traveltourism: { label: 'Travel', tone: 'blue' },
  logistics: { label: 'Mobility', tone: 'teal' },
  mobility: { label: 'Mobility', tone: 'teal' },
  rides: { label: 'Rides', tone: 'teal' },
  automotive: { label: 'Automotive', tone: 'teal' },
  food: { label: 'Food', tone: 'red' },
  fooddelivery: { label: 'Food delivery', tone: 'red' },
  foodgrocery: { label: 'Food', tone: 'red' },
  restaurant: { label: 'Restaurant', tone: 'red' },
  restaurantscafes: { label: 'Restaurant', tone: 'red' },
  grocery: { label: 'Grocery', tone: 'green' },
  health: { label: 'Health', tone: 'green' },
  healthcare: { label: 'Health', tone: 'green' },
  fitness: { label: 'Fitness', tone: 'green' },
  sportsfitness: { label: 'Fitness', tone: 'green' },
  saas: { label: 'SaaS', tone: 'violet' },
  saastechnology: { label: 'SaaS', tone: 'violet' },
  portfolio: { label: 'Portfolio', tone: 'violet' },
  agency: { label: 'Agency', tone: 'violet' },
  agencystudio: { label: 'Agency', tone: 'violet' },
  ecosystem: { label: 'Ecosystem', tone: 'violet' },
  fashion: { label: 'Fashion', tone: 'pink' },
  fashionapparel: { label: 'Fashion', tone: 'pink' },
  beauty: { label: 'Beauty', tone: 'pink' },
  beautycosmetics: { label: 'Beauty', tone: 'pink' },
  salonspa: { label: 'Salon', tone: 'pink' },
  jewelry: { label: 'Jewellery', tone: 'pink' },
  jewelryluxurygoods: { label: 'Luxury', tone: 'pink' },
  homefurniture: { label: 'Furniture', tone: 'orange' },
  furniture: { label: 'Furniture', tone: 'orange' },
  realestate: { label: 'Real estate', tone: 'blue' },
  edtech: { label: 'Education', tone: 'violet' },
  education: { label: 'Education', tone: 'violet' },
  mobile: { label: 'Mobile', tone: 'teal' },
  new: { label: 'New', tone: 'green' },
  trending: { label: 'Trending', tone: 'red' },
};

const key = (tag: string) => tag.toLowerCase().replace(/[\s&_-]+/g, '');

const FEATURED = 'featured';

export const isFeatured = (t: Tagged) =>
  Boolean(t.featured) || (t.tags ?? []).some((tag) => key(tag) === FEATURED);

const TONES: Tone[] = ['slate', 'blue', 'teal', 'violet', 'green', 'pink'];
const toneOf = (tag: string) => {
  let h = 0;
  for (const ch of tag) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
};

const titled = (tag: string) => {
  const words = tag.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const cardTags = (t: Tagged): { label: string; tone: Tone }[] => {
  const tags = [...(t.tags ?? []), t.category ?? ''].filter(Boolean);
  const known: { label: string; tone: Tone }[] = [];
  const other: { label: string; tone: Tone }[] = [];
  for (const tag of tags) {
    const k = key(tag);
    if (!k || k === FEATURED) continue;
    if (KNOWN[k]) known.push(KNOWN[k]);
    else if (tag.length <= 14)
      other.push({ label: titled(tag), tone: toneOf(k) });
  }
  const out: { label: string; tone: Tone }[] = [];
  for (const chip of [...known, ...other]) {
    if (out.length === MOST) break;
    if (!out.some((c) => c.label === chip.label)) out.push(chip);
  }
  return out;
};

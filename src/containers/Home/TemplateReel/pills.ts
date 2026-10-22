/**
 * Category pill colours, as on the web /templates gallery: a soft tint, the
 * hue as text and a hairline in the same hue. Dark uses the same hues at
 * ~18% alpha with lighter text.
 */
export type PillTone = { bg: string; fg: string; edge: string };

type Hue = { light: string; lightBg: string; darkFg: string };

const hue = (light: string, lightBg: string, darkFg: string): Hue => ({
  light,
  lightBg,
  darkFg,
});

const ORANGE = hue('#E2580A', '#FFF1E8', '#FF9A5C');
const VIOLET = hue('#7C3AED', '#F3EEFF', '#B79CFF');
const BLUE = hue('#2563EB', '#EEF4FF', '#8FB3FF');
const RED = hue('#DC2626', '#FFF0F0', '#FF8A8A');
const PINK = hue('#DB2777', '#FFF0F7', '#FF8CC6');
const TEAL = hue('#0F8A7E', '#E8F7F5', '#6FE0D2');
const GREEN = hue('#15803D', '#ECF8F0', '#7FDB9C');
const INDIGO = hue('#4F46E5', '#EFEFFF', '#A5A1FF');
const FUCHSIA = hue('#B427C4', '#FBEEFD', '#EB8CF7');
const AMBER = hue('#B45309', '#FFF5E6', '#FBBF6B');
const SKY = hue('#0369A1', '#E9F5FC', '#7CC8F2');
const ROSE = hue('#BE123C', '#FFEEF2', '#FF8FA8');
const SLATE = hue('#475569', '#F1F3F6', '#B4C0D0');

/** First match wins, so the specific words come before the broad ones.
 *  Every category (and the common tags) gets its own hue; the product
 *  page's pills use the same rules, so a category is one colour
 *  everywhere. */
const RULES: [RegExp, Hue][] = [
  [/restaurant|cafe|food delivery|bakery|kitchen/, RED],
  [/grocery|food|organic|pets|aquatic/, GREEN],
  [/real estate|propert|listing/, BLUE],
  [/hotel|resort|stay|travel|touris/, TEAL],
  [/booking/, SKY],
  [/cab|rental|ride|transit|mobility|logistic|automotive/, INDIGO],
  [/fashion|apparel|tailor/, FUCHSIA],
  [/jewel|luxury|furniture|decor|home|construction|industrial/, AMBER],
  [/beauty|cosmetic|salon|spa|tattoo/, PINK],
  [/health|fitness|sport|clinic|wellness|gym/, SKY],
  [/entertain|event|media|news|art|craft/, ROSE],
  [
    /agency|studio|portfolio|ecosystem|saas|tech|ai\b|crm|b2b|marketing/,
    VIOLET,
  ],
  [/finance|consult|business|startup|ed-tech|educat|security/, SLATE],
  [/commerce|shop|store|retail|electronic|gadget|gift|flower/, ORANGE],
];

const NEUTRAL_LIGHT: PillTone = {
  bg: '#F4F4F2',
  fg: '#0B0B0C',
  edge: '#E7E7E4',
};
const NEUTRAL_DARK: PillTone = {
  bg: 'rgba(255,255,255,0.08)',
  fg: '#E6E6E8',
  edge: 'rgba(255,255,255,0.12)',
};

const cache = new Map<string, PillTone>();

/** The tone for a label; 'App' / 'Website' and unknown labels are neutral. */
export function pillTone(label: string, dark: boolean): PillTone {
  const key = `${dark ? 'd' : 'l'}:${label}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const lower = label.toLowerCase();
  const hue = RULES.find(([re]) => re.test(lower))?.[1];
  let tone: PillTone;
  if (!hue) tone = dark ? NEUTRAL_DARK : NEUTRAL_LIGHT;
  else if (dark)
    tone = { bg: `${hue.light}2E`, fg: hue.darkFg, edge: `${hue.light}55` };
  else tone = { bg: hue.lightBg, fg: hue.light, edge: `${hue.light}33` };
  cache.set(key, tone);
  return tone;
}

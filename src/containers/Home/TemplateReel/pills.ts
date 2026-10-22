/**
 * Category pill colours, as on the web /templates gallery: a soft tint, the
 * hue as text and a hairline in the same hue. Dark uses the same hues at
 * ~18% alpha with lighter text.
 */
export type PillTone = { bg: string; fg: string; edge: string };

type Hue = { light: string; lightBg: string; darkFg: string };

const ORANGE: Hue = { light: '#F2600C', lightBg: '#FFF1E8', darkFg: '#FF9A5C' };
const VIOLET: Hue = { light: '#7C3AED', lightBg: '#F3EEFF', darkFg: '#B79CFF' };
const BLUE: Hue = { light: '#2563EB', lightBg: '#EEF4FF', darkFg: '#8FB3FF' };
const RED: Hue = { light: '#DC2626', lightBg: '#FFF0F0', darkFg: '#FF8A8A' };
const PINK: Hue = { light: '#DB2777', lightBg: '#FFF0F7', darkFg: '#FF8CC6' };

const RULES: [RegExp, Hue][] = [
  [/commerce|shop|store|fashion|retail|jewel|furniture|decor/, ORANGE],
  [/agency|studio|portfolio|ecosystem|saas|tech/, VIOLET],
  [/book|hotel|travel|real estate|propert|cab|rental|transit|mobility/, BLUE],
  [/food|restaurant|cafe|bakery|grocery|kitchen/, RED],
  [/health|beauty|cosmetic|salon|spa|fitness|clinic|wellness/, PINK],
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

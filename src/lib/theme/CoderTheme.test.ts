import fs from 'node:fs';
import path from 'node:path';

import { appTheme } from './AppTheme';
import { useCoderTheme } from './CoderTheme';

const SRC = path.join(__dirname, '..', '..');

/** Every surface that must be achromatic: the coder screens (a port of the
 * web workspace), plus the three tabs the brand indigo was showing through on
 * and the tab bar itself. Home is deliberately absent — it stays branded. */
const ACHROMATIC_DIRS = [
  path.join(SRC, 'containers', 'CodeEditor'),
  path.join(SRC, 'containers', 'Agent'),
  path.join(SRC, 'containers', 'Studio'),
  path.join(SRC, 'containers', 'Marketplace'),
  path.join(SRC, 'components', 'bottom-tabs'),
];

/** The brand indigo, and the blues/violets that ramp into it. Correct on Home;
 * wrong on any of the directories above. */
const BRAND =
  /#6C5CE7|108\s*,\s*92\s*,\s*231|#8B5CF6|#A78BFA|#4C8BFF|#3B82F6|#EC4899|#4F7DFF|79\s*,\s*125\s*,\s*255/i;

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)
      ? [full]
      : [];
  });
}

const achromaticFiles = () => ACHROMATIC_DIRS.flatMap(walk);

/** Flatten a token to a string so a gradient array is searchable too. */
const asText = (v: unknown) => (Array.isArray(v) ? v.join(' ') : String(v));

/** `useCoderTheme` is hook-NAMED but is a pure lookup into a frozen object —
 * no state, no context, no order dependence. Aliasing it keeps
 * `react-hooks/rules-of-hooks` from flagging the loops below, which would
 * otherwise have to be unrolled for no reason. */
const paletteFor = useCoderTheme;

/** The tokens the scope exists to retune. If someone adds a new branded token
 * to a scoped screen, add it here — that is the point of the list.
 *
 * `tabLabelGradient` is deliberately NOT here: the bottom tab bar's active
 * icon/label was explicitly asked to keep the brand indigo (#6C5CE7 /
 * rgb(108,92,231)) rather than go achromatic, so `useCoderTheme` passes it
 * through unchanged from `AppTheme` — see the same note in CoderTheme.ts. */
const SCOPED = [
  'accent',
  'accentSoft',
  'accentOn',
  'agentSendGradient',
  'agentBorderGradient',
  'agentGlowBlue',
  'agentGlowOrange',
  'agentTabActiveBg',
  'agentTabActiveText',
  'templatesTagBg',
  'templatesTagText',
  'studioRailActiveBg',
] as const;

describe('the achromatic scope', () => {
  it('scopes every chromatic token away from the brand ramp', () => {
    expect(asText(appTheme.dark.accent)).toMatch(BRAND); // the app at large

    for (const scheme of ['dark', 'light'] as const) {
      const t = paletteFor(scheme);
      for (const key of SCOPED) expect(asText(t[key])).not.toMatch(BRAND);
    }
  });

  it('changes nothing outside that list', () => {
    // Everything else must be the very same value, so a screen can swap hooks
    // and get a palette that differs only where it was meant to.
    for (const scheme of ['dark', 'light'] as const) {
      const t = paletteFor(scheme);
      const base = appTheme[scheme];
      for (const key of Object.keys(base) as (keyof typeof base)[]) {
        if ((SCOPED as readonly string[]).includes(key)) continue;
        expect(asText(t[key])).toBe(asText(base[key]));
      }
    }
  });

  it('keeps text legible on an accent fill', () => {
    // `accent` is near-white in dark mode, so anything sitting on it has to be
    // near-black. This is the invariant `accentOn` was introduced for.
    expect(paletteFor('dark').accentOn).toBe('#010203');
    expect(paletteFor('light').accentOn).toBe('#FFFFFF');
  });

  it('leaves no hardcoded brand colour on an achromatic surface', () => {
    // The scope swap only covers `colors.*`. A literal typed into a style is
    // invisible to it — which is how the inspector's selection outline stayed
    // violet long after the theme stopped being.
    const offenders = achromaticFiles().filter((f) =>
      BRAND.test(fs.readFileSync(f, 'utf8'))
    );
    expect(offenders).toEqual([]);
  });

  it('never calls useAppTheme on an achromatic surface', () => {
    // A screen that reads the unscoped palette gets the brand indigo back.
    // `type AppColors` in a type position is fine — the shape is the same
    // object — so only reject the call.
    const offenders = achromaticFiles().filter((f) =>
      /\buseAppTheme\s*\(/.test(fs.readFileSync(f, 'utf8'))
    );
    expect(offenders).toEqual([]);
  });
});

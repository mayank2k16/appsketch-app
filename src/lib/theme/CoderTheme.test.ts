import fs from 'node:fs';
import path from 'node:path';

import { appTheme, BRAND_RAMP } from './AppTheme';
import { useBrandedCoderTheme } from './BrandScope';
import { useCoderTheme } from './CoderTheme';

const SRC = path.join(__dirname, '..', '..');

/** Every surface that must be achromatic.
 *
 * This list used to include Agent, Studio, Marketplace and the tab bar. It no
 * longer does: those four are the TABS, the screens a user reaches straight
 * from Home, and greying them left every primary action ("Preview", "Sign
 * In", the selected chip, the send button) as a white or grey pill unrelated
 * to the screen the user just came from. They now run `useBrandedCoderTheme`
 * — the same grey ladder with the ramp put back on what a user taps. See
 * BrandScope.ts, and the tests below it in this file.
 *
 * What is left is the code editor, where a coloured control would fight the
 * syntax highlighting, and that is the whole reason the achromatic scope was
 * built. Home is absent for the opposite reason — it was always branded. */
const ACHROMATIC_DIRS = [path.join(SRC, 'containers', 'CodeEditor')];

/** Carved OUT of the achromatic list above. The editor's CHAT panel is the
 * one part of the workspace that is a conversation rather than code: no
 * syntax highlighting for a coloured control to fight, and the same agent,
 * composer and primary actions the user just used on Home and the Agent tab.
 * Greying it made those look like a different product mid-flow. It runs
 * `useBrandedCoderTheme` with the rest of the branded surfaces. */
const ACHROMATIC_EXCEPT = [path.join(SRC, 'containers', 'CodeEditor', 'Chat')];

/** The screens that keep the grey ladder but take the ramp on their action
 *  surfaces. Listed so the assertions below can hold them to that split
 *  rather than to a blanket "no brand colour here". */
const BRANDED_TAB_DIRS = [
  path.join(SRC, 'containers', 'Agent'),
  path.join(SRC, 'containers', 'Studio'),
  path.join(SRC, 'containers', 'Marketplace'),
  path.join(SRC, 'components', 'bottom-tabs'),
  ...ACHROMATIC_EXCEPT,
];

/** The brand indigo, and the blues/violets that ramp into it. Correct on Home
 * and on the branded tabs; wrong inside the code editor. */
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

const achromaticFiles = () =>
  ACHROMATIC_DIRS.flatMap(walk).filter(
    (f) => !ACHROMATIC_EXCEPT.some((dir) => f.startsWith(dir + path.sep))
  );
const brandedTabFiles = () => BRANDED_TAB_DIRS.flatMap(walk);

/** Flatten a token to a string so a gradient array is searchable too. */
const asText = (v: unknown) => (Array.isArray(v) ? v.join(' ') : String(v));

/** `useCoderTheme` is hook-NAMED but is a pure lookup into a frozen object —
 * no state, no context, no order dependence. Aliasing it keeps
 * `react-hooks/rules-of-hooks` from flagging the loops below, which would
 * otherwise have to be unrolled for no reason. */
const paletteFor = useCoderTheme;
/** Same reasoning for the second scope. */
const brandedPaletteFor = useBrandedCoderTheme;

/** The ramp itself, for the branded-tab assertions below. Built from
 *  `BRAND_RAMP` rather than typed out, so changing a stop cannot leave this
 *  test asserting the old one. */
const BRAND_RAMP_RE = new RegExp(
  BRAND_RAMP.map((c) => c.replace('#', '#?')).join('|'),
  'i'
);

/** What the branded scope must move onto the ramp. `accentOn` and
 *  `agentTabActiveText` are deliberately absent: they are the text that sits
 *  ON those fills, so they are white by definition — the legibility test
 *  below is what holds them. */
const BRANDED_ON_RAMP = [
  'accent',
  'accentSoft',
  'tagText',
  'tagBorder',
  'agentSendGradient',
  'agentBorderGradient',
  'agentTabActiveBg',
  'codeEditorUserBubbleFrom',
  'codeEditorUserBubbleTo',
  'codeEditorToolChipActiveBg',
  'codeEditorToolChipActiveBorder',
  'codeEditorToolChipActiveText',
  'studioRailActiveBg',
] as const;

/** The full set the branded scope touches — the ramp tokens plus the two
 *  white "on" values. Nothing else may differ from the achromatic palette. */
const BRANDED = [...BRANDED_ON_RAMP, 'accentOn', 'agentTabActiveText'] as const;

/** The tokens the scope exists to retune. If someone adds a new branded token
 * to a scoped screen, add it here — that is the point of the list.
 *
 * `tabLabelGradient` is deliberately NOT here: the bottom tab bar's active
 * icon/label was always meant to stay branded rather than go achromatic, so
 * `useCoderTheme` passes it through unchanged from `AppTheme` — see the same
 * note in CoderTheme.ts. (It carries the ramp now, not the old indigo.) */
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

/** The rest of what the scope touches: the surface ladder. These are not
 *  chromatic, so the ramp assertion above does not apply to them — they are
 *  listed only so "changes nothing outside these lists" stays a real check
 *  rather than an out-of-date one. Both lists together are the whole diff
 *  between `appTheme` and `useCoderTheme`. */
const SCOPED_SURFACES = [
  'bg',
  'card',
  'headerBg',
  'sheetBg',
  'studioCardBorder',
  'studioRailBg',
  'surface',
  'tabBarBg',
  'toastBg',
] as const;

describe('the achromatic scope', () => {
  it('scopes every chromatic token away from the brand ramp', () => {
    expect(asText(appTheme.dark.accent)).toMatch(BRAND); // the app at large

    for (const scheme of ['dark', 'light'] as const) {
      const t = paletteFor(scheme);
      for (const key of SCOPED) expect(asText(t[key])).not.toMatch(BRAND);
    }
  });

  it('changes nothing outside those lists', () => {
    // Everything else must be the very same value, so a screen can swap hooks
    // and get a palette that differs only where it was meant to.
    const touched: readonly string[] = [...SCOPED, ...SCOPED_SURFACES];
    for (const scheme of ['dark', 'light'] as const) {
      const t = paletteFor(scheme);
      const base = appTheme[scheme];
      for (const key of Object.keys(base) as (keyof typeof base)[]) {
        if (touched.includes(key)) continue;
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

describe('the branded-tab scope', () => {
  it('puts the ramp back on the action tokens', () => {
    // The point of the second scope: these are what a user taps, and they
    // must land on the ramp rather than the grey ladder underneath.
    for (const scheme of ['dark', 'light'] as const) {
      const t = brandedPaletteFor(scheme);
      for (const key of BRANDED_ON_RAMP)
        expect(asText(t[key])).toMatch(BRAND_RAMP_RE);
    }
  });

  it('leaves the grey ladder alone', () => {
    // Backgrounds, cards and body text stay neutral — that split is why
    // these screens still read as workspace and not as a second Home.
    for (const scheme of ['dark', 'light'] as const) {
      const coder = paletteFor(scheme);
      const branded = brandedPaletteFor(scheme);
      for (const key of SCOPED_SURFACES) {
        expect(asText(branded[key])).toBe(asText(coder[key]));
      }
    }
  });

  it('changes nothing outside the action list', () => {
    const touched: readonly string[] = BRANDED;
    for (const scheme of ['dark', 'light'] as const) {
      const coder = paletteFor(scheme);
      const branded = brandedPaletteFor(scheme);
      for (const key of Object.keys(coder) as (keyof typeof coder)[]) {
        if (touched.includes(key)) continue;
        expect(asText(branded[key])).toBe(asText(coder[key]));
      }
    }
  });

  it('keeps text legible on the branded accent fill', () => {
    // The mirror of the achromatic invariant: `accent` is magenta in both
    // schemes now, so what sits on it is white in both — not the near-black
    // the near-white achromatic `accent` needed.
    for (const scheme of ['dark', 'light'] as const) {
      expect(brandedPaletteFor(scheme).accentOn).toBe('#FFFFFF');
    }
  });

  it('never hardcodes a colour that is not on the ramp', () => {
    // Brand hex in these files is now expected — what is not is a hue from
    // outside the ramp (the old indigo, the blues and cyans that came with
    // it), which is exactly what the sweep of these screens removed.
    const OFF_RAMP =
      /#6C5CE7|108\s*,\s*92\s*,\s*231|#4C8BFF|#3B82F6|#4F7DFF|79\s*,\s*125\s*,\s*255|#22D3EE/i;
    const offenders = brandedTabFiles().filter((f) =>
      OFF_RAMP.test(fs.readFileSync(f, 'utf8'))
    );
    expect(offenders).toEqual([]);
  });
});

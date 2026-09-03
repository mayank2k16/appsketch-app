/**
 * BrandScope — puts the brand ramp back onto the *action* surfaces of the
 * achromatic screens, and nothing else.
 *
 * The achromatic pass (see CoderTheme.ts) greyed Agent, Studio and
 * Marketplace along with the code editor, on the reasoning that they are
 * workspace chrome. That reading held for the editor and stopped holding for
 * the other three: they are the tabs a user lands on from Home, and greying
 * them left every primary action — "Preview", "Sign In", the selected
 * category chip, the send button — as a plain white or grey pill with no
 * relation to the screen the user just came from.
 *
 * So this is a second, narrower scope layered on top of the first:
 *
 *   useCoderTheme  → the greyscale ladder (surfaces, borders, text)
 *   scopeBrand     → the ramp, on the handful of tokens a user reaches for
 *
 * The split is the point. Backgrounds, cards, borders and body text stay on
 * the neutral ladder, so these screens still read as workspace rather than
 * marketing; only the thing you tap is branded. The code editor itself does
 * NOT get this — it is the one surface where a coloured control would fight
 * the syntax highlighting.
 *
 * Every value here comes from `BRAND_RAMP`, never a literal, so the ramp
 * stays changeable in exactly one place.
 */
import { BRAND_RAMP, type AppColors } from './AppTheme';
import { useCoderTheme } from './CoderTheme';

/** `useCoderTheme` is hook-NAMED but is a pure lookup into a frozen object —
 *  no state, no context, no order dependence. Aliasing it keeps
 *  `react-hooks/rules-of-hooks` from flagging the module-level calls below,
 *  the same trick CoderTheme.test.ts uses for the same reason. */
const coderPaletteFor = useCoderTheme;

const [ORANGE, MAGENTA, VIOLET] = BRAND_RAMP;

/** Ramp midpoint — the flat stand-in wherever a gradient will not go.
 *  `accent` is read as a plain string by icon tints, borders, dots and
 *  `ActivityIndicator`, none of which can take three stops. */
export const BRAND_MID = MAGENTA;

/** Alpha rides on the hex (`RRGGBBAA`) rather than a hand-written rgba(), so
 *  a wash can only ever be changed by changing the stop it is derived from. */
const wash = (hex: string, alpha: string) => `${hex}${alpha}`;

export function scopeBrand(base: AppColors): AppColors {
  return {
    ...base,

    // ── The primary action ────────────────────────────────────────────────
    // One token, three screens: Marketplace's selected category chip and its
    // "Preview" button, and Studio's "Sign In". All three already read
    // `accent`/`accentOn`, so they only ever needed the palette to change.
    // `accentOn` flips to white — the achromatic `accent` was near-white and
    // paired with near-black text; on magenta that inverts.
    accent: BRAND_MID,
    accentOn: '#FFFFFF',
    accentSoft: wash(MAGENTA, '26'),

    // Section eyebrows ("AI TEMPLATE LIBRARY", "MANAGE EVERY APPLICATION")
    // and their leading dot. These were still the app-wide indigo — the one
    // hue on these screens that belonged to neither the grey ladder nor the
    // ramp.
    tagText: BRAND_MID,
    tagBorder: wash(MAGENTA, '8C'),

    // ── The composer ──────────────────────────────────────────────────────
    // Send button, the lit edge on the prompt box, and the selected
    // Web/Mobile pill beside it. Same three stops and same direction as the
    // hero heading on Home, so the composer reads as the same control on
    // both screens.
    agentSendGradient: [ORANGE, VIOLET],
    agentBorderGradient: [...BRAND_RAMP],
    agentTabActiveBg: BRAND_MID,
    agentTabActiveText: '#FFFFFF',

    // ── Agent's identity marks ────────────────────────────────────────────
    // The two sparkle avatars, which were flat #0D0D0D on #0D0D0D — a white
    // glyph floating on nothing — and the "⚡ AI Agent" badge.
    codeEditorUserBubbleFrom: ORANGE,
    codeEditorUserBubbleTo: VIOLET,
    codeEditorToolChipActiveBg: wash(MAGENTA, '29'),
    codeEditorToolChipActiveBorder: wash(MAGENTA, '66'),
    codeEditorToolChipActiveText: BRAND_MID,

    // Studio's section rail — a tint, matching the chip treatment above.
    studioRailActiveBg: wash(MAGENTA, '2E'),
  };
}

// Precomputed per scheme, exactly as `useCoderTheme` does — `scope` and
// `scopeBrand` are both pure lookups over a frozen palette, so building the
// two schemes once at module load keeps this a plain object read rather than
// a new object every render.
const brandedCoderTheme = {
  dark: scopeBrand(coderPaletteFor('dark')),
  light: scopeBrand(coderPaletteFor('light')),
};

/** Drop-in replacement for `useCoderTheme` on the three tab screens that keep
 *  the grey ladder but want the ramp on what a user taps. */
export function useBrandedCoderTheme(
  colorScheme: string | null | undefined
): AppColors {
  return brandedCoderTheme[colorScheme === 'dark' ? 'dark' : 'light'];
}

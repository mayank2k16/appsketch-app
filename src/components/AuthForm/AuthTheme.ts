// Colour tokens for the auth flow (LoginScreen / AuthSheet), pulled out of
// the component file so a future light-mode design has one place to change
// values instead of hunting through inline hex codes. Light === dark for now
// (no visual change) — the auth screens don't yet re-render on scheme change,
// so wiring up live switching is a separate follow-up once light mode exists.
export const authColors = {
  dark: {
    RED:   '#C41230',
    BLACK: '#0C0C0C',
    DARK:  '#111111', // dark text on white
    MID:   '#1A0005', // dark panel background
    GOLD:  '#FFD166',
  },
  light: {
    RED:   '#C41230',
    BLACK: '#0C0C0C',
    DARK:  '#111111',
    MID:   '#1A0005',
    GOLD:  '#FFD166',
  },
} as const;

export type AuthColorScheme = keyof typeof authColors;
export type AuthColors = typeof authColors.dark;

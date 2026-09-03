export { appTheme, BRAND_RAMP, brandGradient, useAppTheme } from './AppTheme';
// The achromatic surfaces — the AI coder screens (a port of the web
// workspace), plus Agent, Studio, Marketplace and the bottom tab bar — use
// this instead: the same palette with every brand-indigo token retuned to the
// web's greyscale ladder. Home stays branded. See CoderTheme.ts.
export type { AppColors, AppScheme } from './AppTheme';
export { SURFACE_CANVAS, SURFACE_RAISED, useCoderTheme } from './CoderTheme';
// …and the narrower scope layered back on top of it, for the three of those
// screens that are tabs rather than editor chrome. See BrandScope.ts.
export { BRAND_MID, scopeBrand, useBrandedCoderTheme } from './BrandScope';

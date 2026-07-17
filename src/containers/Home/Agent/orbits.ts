/**
 * Shared orbit math for the Agent glow system. `AgentScreen` owns the actual
 * clocks (Animated.Value loops) and orbit paths; `CipherField` draws the two
 * soft glow orbs along them (and lights nearby characters as they pass);
 * `PromptBar` draws a matching border rim-light at the same live position.
 *
 * The orbit path is the PromptBar card's own measured rounded-rect boundary,
 * inflated outward by `ORBIT_OUTSET` — so the glow visibly hugs the input's
 * edge, steadily travelling all the way around it, instead of floating
 * around an unrelated point in the field.
 *
 * Both orbits share one clock duration (`ORBIT_DURATION`) with a fixed
 * half-lap phase offset baked into the path itself — if the two ran on
 * different durations they'd drift in and out of alignment and periodically
 * collide as they pass the same side of the (small, wide) card.
 */

export const STEPS = 32;

export type Orbit = { input: number[]; xs: number[]; ys: number[] };
export type Rect = { x: number; y: number; width: number; height: number };

// Shared with PromptBar so the drawn border and the orbit path describe the
// same shape (offset outward for the orbit).
export const PROMPT_CARD_RADIUS = 26;
export const PROMPT_BORDER_W = 1.5;
export const ORBIT_OUTSET = 8;

export const ORB_SIZE = 160;
export const CHAR_INFLUENCE_RADIUS = 130;
export const ORBIT_DURATION = 25000;

function clampRadius(r: number, w: number, h: number) {
  return Math.max(0, Math.min(r, w / 2, h / 2));
}

export function roundedRectPerimeter(width: number, height: number, radius: number) {
  const r = clampRadius(radius, width, height);
  return 2 * (width - 2 * r) + 2 * (height - 2 * r) + 2 * Math.PI * r;
}

/**
 * Point at arc-length fraction `frac` (wraps past 0/1) around a rounded
 * rect's outline — walking clockwise starting at (x+r, y).
 */
function roundedRectPoint(rect: Rect, radius: number, frac: number) {
  const { x, y, width: w, height: h } = rect;
  const r = clampRadius(radius, w, h);
  const straight = { top: w - 2 * r, right: h - 2 * r, bottom: w - 2 * r, left: h - 2 * r };
  const arc = (Math.PI * r) / 2;

  let d = (((frac % 1) + 1) % 1) * (straight.top + straight.right + straight.bottom + straight.left + arc * 4);

  if (d <= straight.top) return { x: x + r + d, y };
  d -= straight.top;

  if (d <= arc) {
    const theta = -Math.PI / 2 + (d / arc) * (Math.PI / 2);
    return { x: x + w - r + r * Math.cos(theta), y: y + r + r * Math.sin(theta) };
  }
  d -= arc;

  if (d <= straight.right) return { x: x + w, y: y + r + d };
  d -= straight.right;

  if (d <= arc) {
    const theta = 0 + (d / arc) * (Math.PI / 2);
    return { x: x + w - r + r * Math.cos(theta), y: y + h - r + r * Math.sin(theta) };
  }
  d -= arc;

  if (d <= straight.bottom) return { x: x + w - r - d, y: y + h };
  d -= straight.bottom;

  if (d <= arc) {
    const theta = Math.PI / 2 + (d / arc) * (Math.PI / 2);
    return { x: x + r + r * Math.cos(theta), y: y + h - r + r * Math.sin(theta) };
  }
  d -= arc;

  if (d <= straight.left) return { x, y: y + h - r - d };
  d -= straight.left;

  const theta = Math.PI + (d / arc) * (Math.PI / 2);
  return { x: x + r + r * Math.cos(theta), y: y + r + r * Math.sin(theta) };
}

/** Samples STEPS+1 points around `rect`'s boundary, expanded by `outset`,
 * starting `phaseFrac` of the way around so two orbits can share a rect
 * without sitting on top of each other. */
export function buildRoundedRectOrbit(rect: Rect, radius: number, outset: number, phaseFrac: number): Orbit {
  const outer: Rect = {
    x: rect.x - outset,
    y: rect.y - outset,
    width: rect.width + outset * 2,
    height: rect.height + outset * 2,
  };
  const outerRadius = radius + outset;

  const input: number[] = [];
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const p = roundedRectPoint(outer, outerRadius, t + phaseFrac);
    input.push(t);
    xs.push(p.x);
    ys.push(p.y);
  }
  return { input, xs, ys };
}

/** 0 at `radius`+ away, ramping to 1 at the point itself — no floor, so
 * anything outside the radius is fully off. Used for cipher-character glow. */
export function proximityCurve(pointX: number, pointY: number, orbit: Orbit, radius: number) {
  let minDist = Infinity;
  const curve: number[] = [];
  for (let i = 0; i < orbit.input.length; i++) {
    const dx = pointX - orbit.xs[i];
    const dy = pointY - orbit.ys[i];
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) minDist = dist;
    curve.push(Math.max(0, 1 - dist / radius));
  }
  return { curve, minDist };
}

/**
 * How long each kind of load takes ON THIS PHONE, learned from the loads it
 * has actually done: every finished load nudges its kind's estimate (an
 * exponential moving average), so the ETA a loader shows gets truer with use.
 * A kind it has never timed starts from a measured default.
 */
import { getItem, setItem } from '@/lib/storage';

export type EtaKind =
  | 'site' // a published website's live render
  | 'app-web' // a mobile app's web render (/preview/<uuid>/, may cold-start)
  | 'native' // a mobile app's JS bundles, run natively here
  | 'clone' // copying a template into the account
  | 'create' // creating a layout site from a template
  | 'preview'; // the builder's own dev-server preview (may cold-start)

const DEFAULTS: Record<EtaKind, number> = {
  site: 5000,
  'app-web': 25000,
  native: 8000,
  clone: 6000,
  create: 6000,
  preview: 15000,
};

const KEY = 'eta_estimates_v1';
const MIN_MS = 600;
const MAX_MS = 120000;
/** Weight of the newest load: recent network and server speed lead. */
const ALPHA = 0.4;

type Learned = Partial<Record<EtaKind, number>>;

let learned: Learned | null = null;

function read(): Learned {
  if (!learned) {
    try {
      learned = getItem<Learned>(KEY) ?? {};
    } catch {
      learned = {};
    }
  }
  return learned;
}

/** The expected duration of a `kind` load, in ms. */
export function expectedMs(kind: EtaKind): number {
  return read()[kind] ?? DEFAULTS[kind];
}

/** Records a finished load's real duration. */
export function recordMs(kind: EtaKind, ms: number): void {
  if (!(ms > 0)) return;
  const clamped = Math.min(MAX_MS, Math.max(MIN_MS, ms));
  const prev = read()[kind];
  const next = prev ? prev + ALPHA * (clamped - prev) : clamped;
  learned = { ...read(), [kind]: Math.round(next) };
  void setItem(KEY, learned);
}

/** Progress (0..0.95) and the time left for a load `elapsed` ms in: eased
 *  so it moves quickly at first and never claims done before it is. */
export function progressOf(elapsed: number, expected: number) {
  const p = Math.min(0.95, 1 - Math.exp((-2.3 * elapsed) / expected));
  const leftMs = expected - elapsed;
  return { p, leftS: leftMs > 0 ? Math.ceil(leftMs / 1000) : 0 };
}

import type { ShortVideoItem } from '@/api/short-videos';

function fmtDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Mirrors the API's visibility rule: active AND inside [start_at, end_at],
 * where either bound may be empty (= unbounded on that side). */
export function lifetimeLabel(video: Pick<ShortVideoItem, 'start_at' | 'end_at'>): string {
  const start = fmtDate(video.start_at);
  const end = fmtDate(video.end_at);
  if (!start && !end) return 'Visible forever';
  if (start && end) return `${start} → ${end}`;
  if (start) return `From ${start}`;
  return `Until ${end}`;
}

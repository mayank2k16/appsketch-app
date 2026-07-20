import type { PresenceState } from '@/api/support';

export function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const PRESENCE: Record<PresenceState, { label: string; color: string }> = {
  // "In the room" is shown simply as Online; only a real disconnect is Offline.
  online: { label: 'Online', color: '#10B981' },
  typing: { label: 'typing…', color: '#10B981' },
  idle: { label: 'Online', color: '#10B981' },
  left: { label: 'Offline', color: '#9CA3AF' },
  closed: { label: 'Conversation closed', color: '#9CA3AF' },
};

// Brief network blips can drop+restore the customer's socket; wait this long
// before actually showing "Offline" so presence doesn't flicker.
export const OFFLINE_DEBOUNCE_MS = 4000;

export function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function clockTime(iso?: string): string {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
}

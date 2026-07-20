import type { NoteType } from '@/api/credit-debit-notes';

import type { CmsStatusMeta } from '../components';

const NOTE_TYPE_META: Record<NoteType, CmsStatusMeta> = {
  CREDIT: { label: 'Credit', color: '#16A34A', kind: 'success' },
  DEBIT: { label: 'Debit', color: '#D97706', kind: 'warning' },
};

export function getNoteTypeMeta(type: NoteType | string): CmsStatusMeta {
  return NOTE_TYPE_META[type as NoteType] ?? { label: type || 'N/A', color: '#94A3B8', kind: 'info' };
}

export function money(v: number | string | undefined | null): string {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

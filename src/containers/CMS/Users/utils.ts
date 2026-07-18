import type { CmsStatusMeta } from '../components';

export type UserSegment = 'app' | 'staff';

export const STATUS_OPTS: { value: 'active' | 'inactive' | 'all'; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'all', label: 'All' },
];

export const ROLE_COLORS: Record<string, string> = {
  C: '#6366f1',
  DP: '#0ea5e9',
  SK: '#f59e0b',
  ADMIN: '#ef4444',
  DOCTOR: '#10b981',
  SURGERY_BOY: '#8b5cf6',
};

export function getRoleColor(role?: string): string {
  return (role && ROLE_COLORS[role]) || '#94a3b8';
}

export function getRoleMeta(role: string | undefined, label: string): CmsStatusMeta {
  return { label, color: getRoleColor(role), kind: 'info' };
}

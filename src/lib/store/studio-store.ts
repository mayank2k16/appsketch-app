import { create } from 'zustand';

import { createSelectors } from '../utils';
import { getItem, removeItem, setItem } from '../storage';
import type { TenantSummary } from '@/api/studio';

const ATTACHED_TENANT_KEY = 'studio_attached_tenant';

type StudioState = {
  attachedTenant: TenantSummary | null;
  setAttachedTenant: (tenant: TenantSummary) => void;
  clearAttachedTenant: () => void;
  hydrate: () => void;
};

const _useStudio = create<StudioState>((set) => ({
  attachedTenant: null,

  setAttachedTenant: (tenant) => {
    void setItem(ATTACHED_TENANT_KEY, tenant);
    set({ attachedTenant: tenant });
  },

  clearAttachedTenant: () => {
    void removeItem(ATTACHED_TENANT_KEY);
    set({ attachedTenant: null });
  },

  hydrate: () => {
    const stored = getItem<TenantSummary>(ATTACHED_TENANT_KEY);
    if (stored) set({ attachedTenant: stored });
  },
}));

export const useStudio = createSelectors(_useStudio);

export const hydrateStudio = () => _useStudio.getState().hydrate();

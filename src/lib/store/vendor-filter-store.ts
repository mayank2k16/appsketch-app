import { create } from 'zustand';

import { createSelectors } from '../utils';
import type { VendorListItem } from '@/api/vendors';

type VendorFilterState = {
  // Session-only (not persisted) — scopes CMS list screens to one vendor's
  // data on marketplace tenants; `null` means "All Vendors".
  selectedVendor: VendorListItem | null;
  setSelectedVendor: (vendor: VendorListItem | null) => void;
  clearSelectedVendor: () => void;
};

const _useVendorFilter = create<VendorFilterState>((set) => ({
  selectedVendor: null,
  setSelectedVendor: (vendor) => set({ selectedVendor: vendor }),
  clearSelectedVendor: () => set({ selectedVendor: null }),
}));

export const useVendorFilter = createSelectors(_useVendorFilter);

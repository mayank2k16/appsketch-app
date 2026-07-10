import { create } from 'zustand';

export type WishlistItem = {
  id: string;
  title: string;
  price: number;
  image?: string;
  brand?: string;
  originalPrice?: number;
  addedAt: number;
};

type WishlistStore = {
  items: WishlistItem[];
  addToWishlist: (item: Omit<WishlistItem, 'addedAt'>) => void;
  removeFromWishlist: (itemId: string) => void;
  isInWishlist: (itemId: string) => boolean;
  clearWishlist: () => void;
};

export const useWishlist = create<WishlistStore>((set, get) => ({
  items: [],
  addToWishlist: (item) => {
    const existingItem = get().items.find((i) => i.id === item.id);
    if (!existingItem) {
      set((state) => ({
        items: [...state.items, { ...item, addedAt: Date.now() }],
      }));
    }
  },
  removeFromWishlist: (itemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
    }));
  },
  isInWishlist: (itemId) => {
    return get().items.some((i) => i.id === itemId);
  },
  clearWishlist: () => {
    set({ items: [] });
  },
}));


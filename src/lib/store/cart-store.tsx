import { create } from 'zustand';
import * as Haptics from 'expo-haptics';
import { authenticatedClient } from '@/api/common/client';
import { toast } from '@/lib/toast';

export type DeliveryLocation = {
  latitude: number;
  longitude: number;
  displayName: string;
  city: string;
  state: string;
  pincode: string;
  fullAddress: string;
};

type CartItem = {
  id: number;
  product_name: string;
  quantity: number;
  original_price: number;
  final_price: number;
  photo: string;
  quantity_remaining: number;
};

/** Minimal snapshot passed from product screens so optimistic new-item renders
 *  correctly before the server responds. */
export type GuestProductSnapshot = {
  product_name:       string;
  final_price:        number;
  original_price:     number;
  photo:              string;
  quantity_remaining?: number;
};

type CartState = {
  cartItems: CartItem[];
  subTotal: number;
  finalPrice: number;
  totalItems: number;
  shippingAmount: number;
  discountAmount: number;
  loadingProductId: number | null;
  address: {
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  paymentMethod: 'CASH' | 'ONLINE';
  deliveryLocation: DeliveryLocation | null;
  cartId: null;

  setDeliveryLocation: (loc: DeliveryLocation | null) => void;
  setAddress: (data: CartState['address']) => void;
  setPaymentMethod: (method: 'CASH' | 'ONLINE') => void;

  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity: number, snapshot?: GuestProductSnapshot) => Promise<void>;
  updateQuantity: (productId: number, newQuantity: number, snapshot?: GuestProductSnapshot) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;

  /**
   * After a guest signs in, call this with the product IDs that were in their
   * unauthenticated session cart so they get merged into the authenticated cart.
   */
  syncPendingCartItems: (items: { id: number; quantity: number }[]) => Promise<void>;

  clearCart: () => void;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const calculateCartTotals = (items: CartItem[], shipping: number, discount: number) => {
  const subTotal   = items.reduce((sum, item) => sum + Number(item.original_price) * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const finalPrice = subTotal - discount + shipping;
  return { subTotal, totalItems, finalPrice };
};

// ─── store ────────────────────────────────────────────────────────────────────

export const useCart = create<CartState>((set, get) => ({
  cartItems:        [],
  subTotal:         0,
  finalPrice:       0,
  totalItems:       0,
  shippingAmount:   0,
  discountAmount:   0,
  loadingProductId: null,
  cartId:           null,
  address:          null,
  paymentMethod:    'CASH',
  deliveryLocation: null,

  setDeliveryLocation: (loc)    => set({ deliveryLocation: loc }),
  setAddress:          (data)   => set({ address: data }),
  setPaymentMethod:    (method) => set({ paymentMethod: method }),

  clearCart: () => set({
    cartItems: [], subTotal: 0, finalPrice: 0, totalItems: 0,
    shippingAmount: 0, discountAmount: 0, cartId: null,
  }),

  // ── fetchCart ──────────────────────────────────────────────────────────────
  // Works for both authenticated users (returns account cart) and guests
  // (returns session cart — no Authorization header when token is null).
  fetchCart: async () => {
    try {
      const response = await authenticatedClient.get('api/shop/get_cart/');
      const cart = response?.data?.get_cart ?? response?.data;
      if (cart) {
        const rawItems = cart.cartitem ?? cart.cartItem ?? cart.items ?? [];
        const items = rawItems.map((it: Record<string, unknown>) => ({
          ...it,
          id: (it.product as number) ?? (it.id as number),
        })) as CartItem[];
        const shipping = cart.shipping_amount ?? 0;
        const discount = cart.discount_amount ?? 0;
        const cartId   = cart.id ?? null;
        set({
          cartItems: items,
          shippingAmount: shipping,
          discountAmount: discount,
          cartId,
          ...calculateCartTotals(items, shipping, discount),
        });
      }
    } catch (error) {
      console.log('Fetch cart error:', error);
    }
  },

  // ── addToCart — OPTIMISTIC ─────────────────────────────────────────────────
  // 1. Apply delta to cartItems immediately (UI updates on this frame).
  // 2. Fire API in background.
  // 3. On success: reconcile with server truth (prices, totals).
  // 4. On any failure: rollback to previous state + show error toast.
  addToCart: async (productId, quantity, snapshot?) => {
    const { cartItems, shippingAmount, discountAmount } = get();
    const pid = Number(productId);

    // ── snapshot for rollback ───────────────────────────────────────────────
    const prevItems    = cartItems;
    const prevShipping = shippingAmount;
    const prevDiscount = discountAmount;

    // ── compute optimistic next state ───────────────────────────────────────
    const existingIdx = cartItems.findIndex(
      item => Number(item.id) === pid || Number((item as any).product) === pid,
    );

    let nextItems: CartItem[];

    if (quantity <= 0) {
      // Remove item
      nextItems = cartItems.filter(
        item => Number(item.id) !== pid && Number((item as any).product) !== pid,
      );
    } else if (existingIdx >= 0) {
      // Update existing quantity
      nextItems = cartItems.map((item, i) =>
        i === existingIdx ? { ...item, quantity } : item,
      );
    } else {
      // Add new item — use snapshot for immediate display until server confirms
      nextItems = [
        ...cartItems,
        {
          id:                 pid,
          product_name:       snapshot?.product_name       ?? '',
          quantity,
          original_price:     snapshot?.original_price     ?? snapshot?.final_price ?? 0,
          final_price:        snapshot?.final_price        ?? 0,
          photo:              snapshot?.photo              ?? '',
          quantity_remaining: snapshot?.quantity_remaining ?? 99,
        } as CartItem,
      ];
    }

    // Apply immediately — UI reflects this on the current frame
    set({ cartItems: nextItems, ...calculateCartTotals(nextItems, prevShipping, prevDiscount) });

    // Haptic feedback — fires on the same frame as the UI update
    Haptics.impactAsync(
      quantity <= 0
        ? Haptics.ImpactFeedbackStyle.Light   // remove: soft tap
        : Haptics.ImpactFeedbackStyle.Medium, // add/update: satisfying bump
    ).catch(() => {}); // silently ignore if haptics unavailable

    // ── background API call ─────────────────────────────────────────────────
    try {
      const response = await authenticatedClient.post('api/shop/add_to_cart/', {
        items: [{ product: productId, quantity }],
      });
      const data = response?.data;

      if (data?.add_to_cart?.status === 201) {
        // Reconcile: replace optimistic items with server-confirmed data
        const cart     = data.get_cart ?? data;
        const rawItems = cart?.cartitem ?? cart?.cartItem ?? cart?.items ?? [];
        const items    = rawItems.map((it: Record<string, unknown>) => ({
          ...it,
          id: (it.product as number) ?? (it.id as number),
        })) as CartItem[];
        const shipping = cart?.shipping_amount ?? 0;
        const discount = cart?.discount_amount ?? 0;
        set({ cartItems: items, shippingAmount: shipping, discountAmount: discount,
              ...calculateCartTotals(items, shipping, discount) });
      } else {
        // Server rejected — roll back silently + notify
        set({ cartItems: prevItems, shippingAmount: prevShipping, discountAmount: prevDiscount,
              ...calculateCartTotals(prevItems, prevShipping, prevDiscount) });
        toast.error('Something went wrong. Please try again.');
      }
    } catch {
      // Network/server error — roll back + notify
      set({ cartItems: prevItems, shippingAmount: prevShipping, discountAmount: prevDiscount,
            ...calculateCartTotals(prevItems, prevShipping, prevDiscount) });
      toast.error('Failed to update cart. Please try again.');
    }
  },

  // ── updateQuantity ─────────────────────────────────────────────────────────
  updateQuantity: async (productId, newQuantity, snapshot?) => {
    if (newQuantity < 0) return;
    return get().addToCart(productId, newQuantity, snapshot);
    // quantity = 0 is handled inside addToCart as a remove
  },

  // ── removeFromCart ─────────────────────────────────────────────────────────
  removeFromCart: async (productId) => get().addToCart(productId, 0),

  // ── syncPendingCartItems ───────────────────────────────────────────────────
  // After a guest logs in, replay their session cart items into the
  // authenticated cart in a single batch call, then refresh.
  syncPendingCartItems: async (items) => {
    if (!items.length) return;
    try {
      await authenticatedClient.post('api/shop/add_to_cart/', {
        items: items.map((i) => ({ product: i.id, quantity: i.quantity })),
      });
    } catch (e) {
      console.warn('Cart sync error:', e);
    }
    // Always refresh so the screen shows the merged cart
    await get().fetchCart();
  },
}));

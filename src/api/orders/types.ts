/**
 * Order domain types. Formalizes what the Vite CMS left as untyped JS
 * (`Cms/Dashboard/CreateOrderModal`, `Cms/Dashboard/utils.js`). Delivery/
 * dispatch-only fields (assignment_status, delivery_partner*, last_location)
 * are intentionally omitted — that's a separate feature, not ported yet.
 */

export type OrderStatus =
  | 'INITIALISED'
  | 'CANCELLED'
  | 'DELIVERED'
  | 'IN_TRANSIT'
  | 'INVOICE_GENERATED'
  | 'ORDER_PLACED'
  | 'REFUND_INITIATED'
  | 'REFUNDED_AND_CLOSED'
  | 'DISCARDED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'CHECKOUT' | 'FAILED';

export type FulfilmentType = 'DELIVERY' | 'TAKE_AWAY' | 'SURGERY';

export type DeliveryType = 'EXPRESS' | 'EXPRESS_DELIVERY' | 'EVERYTHING' | 'TAKE_AWAY';

export type OrderAddress = {
  address: string;
  landmark?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  label?: string;
  primary?: boolean;
  verified?: boolean;
};

export type OrderCustomer = {
  name: string;
  phone_number: string;
  email?: string;
};

export type OrderListItem = {
  id: number;
  created_on: string;
  customer: OrderCustomer;
  payment_status: PaymentStatus;
  total_price: string;
  address?: OrderAddress;
  status: OrderStatus;
};

export type CartLineItem = {
  id: number;
  product_id: number;
  title: string;
  product_name?: string;
  quantity: string | number;
  variant?: string | null;
  price: string | number;
  final_price: string | number;
  market_price?: string | number;
  images?: string[];
  photo?: string;
  variation_options?: { type?: string; name: string; color_hex?: string }[];
  discount_code?: { code: string; value?: string | number } | null;
  sku?: string;
};

export type InventoryDetail = {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
};

export type OrderDetail = Omit<OrderListItem, 'customer'> & {
  // The detail endpoint is inconsistent about this field's shape across the
  // Vite reference (CreateOrderModal reads it as a bare customer id;
  // ViewOrderDetailsModal treats it as possibly an object) — handle both.
  customer: OrderCustomer | number;
  customer_name?: string;
  user?: { name?: string; phone?: string; email?: string };
  cart: CartLineItem[];
  inventory: number;
  inventory_detail?: InventoryDetail;
  items_subtotal?: string | number;
  delivery_charge: string | number;
  packaging_charge: string | number;
  discount?: number | null;
  fulfilment_type?: FulfilmentType;
  delivery_type?: DeliveryType;
  delivery_date?: string;
  delivery_time?: string;
  invoice_url?: string;
  source?: string;
  fulfilment_address?: string;
  delivery_address?: string;
};

export type CreateOrderPayload = {
  customer_id: string | number;
  customer_name: string;
  phone_number: string;
  delivery_charge: number;
  packaging_charge: number;
  address: OrderAddress;
  inv_id: string | number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  fulfilment_type: FulfilmentType;
  delivery_type: DeliveryType;
  delivery_date?: string;
  delivery_time?: string;
  order_list: { product_id: number | string; quantity: number | string }[];
  discount_id?: string | number | null;
  order_id?: number; // present only on update
};

export type PreviewOrderPayload = {
  inv_id: string | number;
  order_list: { product_id: number | string; quantity: number | string }[];
  delivery_charge: number;
  packaging_charge: number;
  discount_id?: string | number | null;
};

export type PreviewOrderResponse = {
  subtotal: number;
  discount_amount: number;
  delivery_charge: number;
  packaging_charge: number;
  total: number;
  discount_error?: string;
};

export type Discount = {
  id: number;
  code: string;
  discount_code_type: 'P' | 'PERCENTAGE' | string;
  value: number | string;
  is_active: boolean;
  code_description?: string;
};

export type InventoryOption = {
  id: number;
  address: string;
};

export type TenantUserOption = {
  id: number;
  name: string;
  phone_number: string;
};

export type ProductSearchResult = {
  id: number;
  product_name: string;
  photo?: string;
  price?: string | number;
  market_price?: string | number;
};

/**
 * CMS discount-codes domain types — ported from Vite's
 * `Containers/Cms/DiscountCodes` (`DiscountCode.jsx` +
 * `CreateDiscountModal/index.jsx`) + `Api/cmsAPI.js`. The "Challans" and
 * "Logistics" apply-on scopes are dropped — neither is wired to a save
 * payload key in Vite (see the implementation plan), so only the 6 scopes
 * that actually persist are modeled here.
 *
 * Named `DiscountCodeItem` (not `Discount`) — `@/api/orders` already exports
 * a narrower `Discount` type for its own order-creation dropdown consumer;
 * same shape, different endpoint/purpose, same precedent as `InventoryOption`
 * vs `InventoryLocation` documented in the CMS README.
 */

export type DiscountCodeType = 'PERCENTAGE' | 'ABSOLUTE';
export type DiscountApplyType = 'cart' | 'items';
export type DiscountAppliedOn = 'inventory' | 'products' | 'customer' | 'category' | 'invoices' | 'entity';

export type DiscountAttribute = {
  applied_on: DiscountAppliedOn | string;
  apply_on_all: boolean;
  category: (string | number)[];
  inventory: (string | number)[];
  product: (string | number)[];
  invoice: (string | number)[];
  customer: (string | number)[];
  entity: (string | number)[];
  first_order_per_user: boolean;
  one_time_per_user: boolean;
  recurring: boolean;
  recursion_depth: number;
  attribute_type: 'transactional';
};

export type DiscountCodeItem = {
  id: number;
  code: string;
  code_description?: string;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  apply_type: DiscountApplyType | string;
  discount_code_type: DiscountCodeType | string;
  value: string | number;
  maximum_discount: string | number;
  minimum_order_value: string | number;
  discount_attributes?: DiscountAttribute[];
};

export type DiscountPayload = {
  start_time: string;
  end_time: string;
  discount_code_type: string;
  value: string | number;
  maximum_discount: string | number;
  code: string;
  code_description: string;
  is_active: boolean;
  minimum_order_value: string | number;
  apply_type: DiscountApplyType;
  discount_attributes: [
    Omit<DiscountAttribute, 'attribute_type'> & { attribute_type: 'transactional' },
  ];
};

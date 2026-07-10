/**
 * Inventory *locations* (warehouses/branches) — matches the Vite reference's
 * `Containers/Inventory` (name, address, code, pincode, active flag). This is
 * distinct from `InventoryOption` in `@/api/orders/types`, which is a
 * lightweight `{id, address}` lookup used only to populate the inventory
 * picker on the order-creation form — same underlying entity, different
 * (narrower) shop-facing endpoint.
 */

export type InventoryLocation = {
  id: number;
  name: string;
  address: string;
  code: string;
  pincode: string;
  is_active: boolean;
};

export type InventoryLocationPayload = {
  name: string;
  address: string;
  code: string;
  pincode: string;
  is_active: boolean;
};

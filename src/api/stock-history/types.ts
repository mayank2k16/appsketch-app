/**
 * Stock History domain types — ported from Vite's
 * `Containers/Cms/StockHistory/StockHistory.jsx` (`StockCard`'s 11 display
 * fields) + `Api/cmsAPI.js`. Read-only audit log, no create/edit/delete.
 */

export type StockHistoryEntry = {
  id: number;
  inventory?: { name?: string } | null;
  product?: { product_name?: string } | null;
  added_by?: { name?: string } | null;
  quantity?: string | number | null;
  batch_number?: string | null;
  net_rate?: string | number | null;
  purchase_trade_rate?: string | number | null;
  serial_number?: string | null;
  catalogue_number?: string | null;
  manufacturer_date?: string | null;
  procurement_price_per_product?: string | number | null;
};

export type StockHistoryPage = {
  results: StockHistoryEntry[];
  next: string | null;
  count: number;
};

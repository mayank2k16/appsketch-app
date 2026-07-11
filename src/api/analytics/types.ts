/**
 * Sales analytics — ported from Vite's `Containers/Cms/Analytics`. One
 * endpoint (`get_order_sales_data`) returns everything: a revenue time
 * series plus a `summary` block with visitor stats, top categories, and top
 * products. Numeric fields come back as strings from the backend in places,
 * so most are typed permissively and coerced with `Number(...)` at the call
 * site (matches how the Vite reference handles them).
 */

export type SalesRangeValue = '7' | '15' | '30' | '180' | '365' | '99999';

export type SalesRangeOption = { label: string; value: SalesRangeValue };

export type OrdersDataPoint = {
  date: string;
  total_sales: number | string;
};

export type VisitorSource = { source: string; page_views: number | string };
export type VisitorReferrer = { referrer: string; page_views: number | string };
export type VisitorPath = { path: string; page_views: number | string };

export type VisitorStats = {
  total_unique_visitors?: number | string;
  sources?: VisitorSource[];
  referrers?: VisitorReferrer[];
  paths?: VisitorPath[];
};

export type TopCategory = { category_name: string; total_quantity_sold: number | string };
export type TopProduct = {
  product_name: string;
  total_quantity_sold: number | string;
  total_sales: number | string;
};

export type SalesSummary = {
  total_sales?: number | string;
  all_time_sales?: number | string;
  visitor_stats?: VisitorStats;
  top_selling_categories?: TopCategory[];
  top_selling_products?: TopProduct[];
};

export type SalesAnalytics = {
  summary?: SalesSummary;
  orders_data?: OrdersDataPoint[];
};

export type SalesAnalyticsParams = { start_date: string; end_date: string };

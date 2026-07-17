/**
 * CMS invoices domain types — ported from Vite's `Containers/Cms/Invoices`
 * (`Invoice.jsx` + `AddModal/`) + `Api/cmsAPI.js` / `Api/tenantAPI.js`.
 * Marketplace invoices and the (never-functional in Vite) discount
 * apply/remove flow are intentionally not ported — see the CMS README /
 * implementation plan for why.
 */

export type InvoiceType = 'PROFORMA' | 'GENERAL' | 'CONTRACTOR';

export type InvoiceListItem = {
  id: number;
  invoice_id: string;
  created_on: string;
  order_id?: number;
  entity?: number | string;
  final_price: string | number;
  type: InvoiceType | string;
  status: string;
  invoice_url?: string;
};

export type InvoiceListResponse = {
  results: InvoiceListItem[];
};

export type InvoiceCustomerDetails = {
  customer_details?: { customer_name?: string };
};

export type InvoiceItemDetail = {
  product_id: number;
  quantity: string | number;
  price: string | number;
  cgst?: string | number;
  sgst?: string | number;
  igst?: string | number;
  final_price?: string | number;
};

export type InvoiceDetail = {
  id: number;
  type: InvoiceType | string;
  invoice_id: string;
  invoice_date?: string;
  created_on: string;
  order_id?: number;
  inventory?: number;
  customer_details?: InvoiceCustomerDetails;
  cgst?: string | number;
  sgst?: string | number;
  subtotal?: string | number;
  sub_total?: string | number;
  final_price?: string | number;
  challan_details?: { challan_id?: string | number };
};

export type InvoiceDetailResponse = {
  data: InvoiceDetail;
  items?: InvoiceItemDetail[];
};

export type InvoiceProductLine = {
  productId: string | number;
  quantity: string;
  mrp: string;
  rate: string;
  cgst: string;
  sgst: string;
  igst: string;
  finalPrice: string;
};

export type InvoiceLineItemPayload = {
  product_id: string | number;
  quantity: string | number;
  rate: string | number;
  mrp: string | number;
  cgst?: string | number;
  sgst?: string | number;
  igst?: string | number;
};

export type CreateInvoicePayload = {
  update_sellable: boolean;
  inventory_id: string | number;
  invoice: {
    type: string;
    customer_name: string;
    invoice_date: string;
    invoice_id: string;
    challan_id?: string | number | null;
  };
  invoice_items: InvoiceLineItemPayload[];
};

export type UpdateInvoiceDateAndNoPayload = {
  invoice_id: string;
  invoice_date: string;
  challan_id?: string | number | null;
};

export type ChallanOption = {
  id: number;
  challan_id: string;
};

export type InvoiceInventoryOption = {
  id: number;
  name: string;
};

export type InvoiceProductOption = {
  id: number;
  product_name: string;
  market_price?: string | number;
  price?: (string | number)[];
};

export type CompanyDetails = {
  title?: string;
  address?: string;
};

export type InvoiceFilters = {
  entity?: (string | number)[];
  type?: string[];
  startDate?: string;
  endDate?: string;
};

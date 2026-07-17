import type { InvoiceType } from '@/api/invoices';

/**
 * Trimmed port of Vite's `AddModal/Constant.js` — MARKETPLACE (a ~35-field
 * alternate schema) and the discount field (`showWhen: 'hasDiscount'`, which
 * was never reachable — see the implementation plan) are dropped. Only
 * PROFORMA / GENERAL / CONTRACTOR remain, all sharing one product-field set.
 */

export type InvoiceHeaderField = {
  name: 'invoiceDate' | 'invoiceNo' | 'challan' | 'updateSellableInventory';
  label: string;
  type: 'date' | 'text' | 'searchable-select' | 'checkbox';
  required: boolean;
};

export const INVOICE_TYPE_OPTIONS: { value: InvoiceType; label: string }[] = [
  { value: 'PROFORMA', label: 'PROFORMA' },
  { value: 'GENERAL', label: 'GENERAL' },
  { value: 'CONTRACTOR', label: 'CONTRACTOR' },
];

const HEADER_FIELDS_BY_TYPE: Record<InvoiceType, InvoiceHeaderField[]> = {
  PROFORMA: [
    { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
    { name: 'invoiceNo', label: 'Invoice Number', type: 'text', required: true },
    { name: 'challan', label: 'Challan', type: 'searchable-select', required: false },
    { name: 'updateSellableInventory', label: 'Update Sellable Inventory', type: 'checkbox', required: false },
  ],
  GENERAL: [
    { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
    { name: 'invoiceNo', label: 'Invoice Number', type: 'text', required: true },
    { name: 'challan', label: 'Challan', type: 'searchable-select', required: true },
  ],
  CONTRACTOR: [
    { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
    { name: 'invoiceNo', label: 'Invoice Number', type: 'text', required: true },
  ],
};

export function getHeaderFieldsForInvoiceType(type: InvoiceType): InvoiceHeaderField[] {
  return HEADER_FIELDS_BY_TYPE[type] ?? HEADER_FIELDS_BY_TYPE.PROFORMA;
}

export type InvoiceProductRow = {
  productId: string | number;
  quantity: string;
  mrp: string;
  rate: string;
  cgst: string;
  sgst: string;
  igst: string;
  finalPrice: string;
};

export const EMPTY_PRODUCT_ROW: InvoiceProductRow = {
  productId: '',
  quantity: '',
  mrp: '',
  rate: '',
  cgst: '',
  sgst: '',
  igst: '',
  finalPrice: '',
};

export type InvoiceFormData = {
  invoiceType: InvoiceType;
  inventoryId: string | number | null;
  invoiceDate: string;
  invoiceNo: string;
  customerName: string;
  challan: string | number | null;
  challanLabel: string;
  addedProducts: InvoiceProductRow[];
  updateSellableInventory: boolean;
};

export function getDefaultInvoiceFormData(invoiceType: InvoiceType = 'PROFORMA'): InvoiceFormData {
  return {
    invoiceType,
    inventoryId: null,
    invoiceDate: '',
    invoiceNo: '',
    customerName: '',
    challan: null,
    challanLabel: '',
    addedProducts: [{ ...EMPTY_PRODUCT_ROW }],
    updateSellableInventory: true,
  };
}

/**
 * Credit/Debit Notes — ported from Vite's `Containers/Cms/CreditDebitNote`
 * (`CreditDebitNote.jsx`, `CreateNoteModal.jsx`, `AddProductForm.jsx`) +
 * `Api/cmsAPI.js`'s `fetchAllNotes`/`createNote`/`get_sellable_instances`.
 */

export type NoteType = 'CREDIT' | 'DEBIT';
export type NoteAppliedOn = 'INVOICES' | 'PRODUCTS';

export type NoteListItem = {
  id: number;
  reference_number: string;
  type: NoteType | string;
  final_price: string | number;
  note_url?: string;
  entity_details?: { title?: string };
};

/** One row of `fetchSellableInstances` — a specific batch/serial of a product
 * at an entity+inventory, with the historical contract rates available for it. */
export type SellableInstance = {
  batch_number?: string;
  serial_number?: string;
  rates?: {
    price?: string | number;
    market_price?: string | number;
    contract_title?: string;
    valid_from?: string;
  }[];
};

export type CreateNoteInvoiceItem = {
  invoice_id: string | number;
  rate: string;
};

export type CreateNoteProductItem = {
  product_id: number;
  batch_number: string;
  serial_number: string;
  quantity: string;
  rate: string;
  mrp: string;
  hsn_code: string;
};

export type CreateNotePayload = {
  inventory_id: number;
  update_sellable: boolean;
  note: {
    applied_on: NoteAppliedOn;
    reference_number: string;
    type: NoteType;
    entity_id: number;
  };
  note_items: CreateNoteInvoiceItem[] | CreateNoteProductItem[];
};

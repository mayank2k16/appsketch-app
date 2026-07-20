/**
 * CMS payments domain types — ported from Vite's `Containers/Cms/Payments`
 * (RegularPayments, BulkPayment, VendorSettlements) + `Api/paymentAPI.js` /
 * `Api/cmsAPI.js`. Distinct bounded context from `payments/payment-api.tsx`
 * (checkout/gateway calls used by CartScreen) — that file is untouched.
 *
 * `PaymentStatus` is intentionally *not* redefined here — it already exists
 * in `@/api/orders` with the exact same value set Vite's payment records use
 * (PENDING/SUCCESS/CHECKOUT/FAILED), and both domains are `export *`-ed from
 * the flat `src/api/index.tsx` barrel, so redefining it would collide.
 */
import type { PaymentStatus } from '@/api/orders';

export type PaymentTransactionType = 'credit' | 'debit';

export type PaymentTxnMode =
  | 'electronic_cash_on_Delivery'
  | 'wallet'
  | 'Card'
  | 'upi'
  | 'cash'
  | 'netbanking';

export type PaymentInvoiceDetail = { id: number; title: string };
export type PaymentOrderDetail = { id: number; title: string };

export type PaymentListItem = {
  id: number;
  invoice_details?: PaymentInvoiceDetail;
  order_details?: PaymentOrderDetail;
  amount: string | number;
  partial_amount: string | number;
  transaction_type: PaymentTransactionType | string;
  status: PaymentStatus | string;
  created_on: string;
  payment_date?: string;
  txn_id?: string;
  ref_no?: string;
  txn_mode?: PaymentTxnMode | string;
};

export type PaymentAttachment = {
  id: number;
  payment_id: number;
  url: string;
};

export type PaymentComment = {
  message: string;
  commented_by: string;
};

export type CreatePaymentPayload = {
  invoice_id: string | number;
  amount: string | number;
  transaction_type: PaymentTransactionType;
  mode: PaymentTxnMode;
  date: string;
};

export type UpdatePaymentPayload = {
  payment_id: number;
  ref_no: string;
  txn_mode: string;
  date: string;
  amount?: string | number;
  partial_amount?: string | number;
  status?: PaymentStatus;
};

export type InvoiceOption = {
  id: number;
  invoice_id: string;
};

// `address`/`dl_no`/`gstin`/`phone_number` are the same `/shop/entities/`
// response, just fields only `CreditDebitNotes`' entity detail card reads —
// `BulkPayments` only ever needed `title`. Same entity/endpoint, not a collision.
export type EntityOption = {
  id: number;
  title: string;
  address?: string;
  dl_no?: string;
  gstin?: string;
  phone_number?: string;
};

// ── Bulk payments ────────────────────────────────────────────────────────

export type BulkPaymentListItem = {
  id: number;
  entity: string;
  amount: string | number;
  status: PaymentStatus | string;
  type: PaymentTransactionType | string;
  payment_date: string;
};

export type CorrespondingPayment = {
  invoice_details?: PaymentInvoiceDetail;
  created_on: string;
  amount: string | number;
  partial_amount: string | number;
  status: PaymentStatus | string;
};

export type BulkPaymentDetail = BulkPaymentListItem & {
  corresponding_payments?: CorrespondingPayment[];
};

export type BulkPaymentListResponse = {
  results: BulkPaymentListItem[];
};

export type PendingPaymentForEntity = {
  id: number;
  invoice_details?: PaymentInvoiceDetail;
  created_on: string;
  amount: string | number;
  partial_amount: string | number;
  status: PaymentStatus | string;
};

export type CreateBulkPaymentPayload = {
  entity: string | number;
  amount: string | number;
  payment_date: string;
  type: PaymentTransactionType;
  ref_no: string;
  comment: string;
  payments_to_mark: (string | number)[];
  automated_marking: boolean;
  attachments: { uri: string; name: string; type: string }[];
};

// ── Vendor settlements ───────────────────────────────────────────────────

export type SettlementTenant = { id: number; title: string };

export type VendorSettlementListItem = {
  id: number;
  vendor_order?: string | number;
  parent_order?: string | number;
  vendor_tenant?: SettlementTenant;
  parent_tenant?: SettlementTenant;
  total_commission: string | number;
  vendor_payout: string | number;
  gross_amount: string | number;
  status: PaymentStatus | string;
  created_on: string;
};

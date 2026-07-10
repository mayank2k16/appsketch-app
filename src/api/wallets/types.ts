/**
 * Wallet domain types — ported from Vite's `Containers/Cms/Wallets` +
 * `Api/cmsAPI.js` (`Wallets + Referrals — admin/CMS endpoints` section).
 * Tenant scoping is server-side (authenticated admin's tenant), no tenant
 * param needed from the client.
 */

export type WalletTransactionType = 'CREDIT' | 'DEBIT';

export type WalletTransactionSource =
  | 'RECHARGE'
  | 'ORDER_PAYMENT'
  | 'ORDER_REFUND'
  | 'REFERRAL_BONUS'
  | 'PROMO_CREDIT'
  | 'ADMIN_ADJUST'
  | 'LOCK'
  | 'UNLOCK'
  | 'REVERSAL';

export type WalletTransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REVERSED';

export type WalletListItem = {
  id: number;
  user: number;
  user_name?: string;
  user_phone?: string;
  user_email?: string;
  balance: string | number;
  locked_balance: string | number;
  spendable_balance: string | number;
  max_balance?: string | number;
  is_active: boolean;
  is_kyc_required?: boolean;
};

export type WalletTransaction = {
  id: number;
  transaction_type: WalletTransactionType;
  source: WalletTransactionSource;
  amount: string | number;
  closing_balance: string | number;
  status: WalletTransactionStatus;
  note?: string;
  transaction_id?: string;
  created_on: string;
};

export type WalletActiveFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export type WalletListParams = {
  limit?: number;
  cursor?: string | number | null;
  q?: string;
  active?: 'true' | 'false';
};

export type WalletListResponse = {
  data: WalletListItem[];
  next_cursor: string | number | null;
};

export type WalletTransactionsParams = {
  wallet: number;
  limit?: number;
};

export type WalletTransactionsResponse = {
  data: WalletTransaction[];
};

export type AdjustWalletPayload = {
  profile_id: number;
  direction: WalletTransactionType;
  amount: string;
  note: string;
};

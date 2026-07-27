/**
 * Payment merchants — tenant's own payment-gateway onboarding (Razorpay/
 * Stripe/Paytm business credentials so the tenant's store can accept
 * customer payments). A completely separate bounded context from
 * subscription/plan payments — ported from the web reference
 * (`Studio/Settings/Payments/index.jsx` + `PaymentForm.jsx`,
 * `Api/tenantAPI.fetchMerchants`/`addPaymentMerchant`).
 */
export type PaymentProvider = 'razorpay' | 'stripe' | 'paytm' | string;
export type PaymentMerchantStatus = 'pending' | 'completed' | string;

export type PaymentMerchant = {
  id?: number;
  email?: string;
  phone?: string;
  provider?: PaymentProvider;
  status?: PaymentMerchantStatus;
  tenant?: number;
  _api_key?: string;
  _api_secret?: string;
  // Web reads this back as `legalBusinessName` on edit but writes
  // `legal_business_name` on create — same inconsistency ported here,
  // checked defensively wherever it's read.
  legal_business_name?: string;
  legalBusinessName?: string;
};

export type MerchantsResponse = { results: PaymentMerchant[] } | PaymentMerchant[];

export type AddPaymentMerchantPayload = {
  email: string;
  phone: string;
  _api_key: string;
  _api_secret: string;
  legal_business_name: string;
  business_type: string;
  provider: PaymentProvider;
  contactName: string;
  tenant_id: number | string;
};

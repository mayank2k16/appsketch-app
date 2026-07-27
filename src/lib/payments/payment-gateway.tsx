/**
 * lib/payments/payment-gateway.ts
 *
 * ─── HOW TO ADD A NEW GATEWAY ────────────────────────────────────────────────
 * 1. Add the provider name to GatewayProvider union type
 * 2. Write a handler: async function handleStripe(...): Promise<PaymentResult>
 * 3. Add one case in openPaymentGateway() switch
 * Nothing in CartScreen or OrderSuccessScreen needs changing.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Dependencies:
 *   npm install react-native-razorpay          (Razorpay)
 *   npx pod-install                            (iOS)
 *   npm install react-native-inappbrowser-reborn  (PayU)
 */

import { Alert, Linking, Platform } from 'react-native';

// ── Types ──────────────────────────────────────────────────────────────────────

export type GatewayProvider = 'Razorpay' | 'PayU' | string;

export type CheckoutDetails = {
  provider:      GatewayProvider;
  // Razorpay
  order_id?:     string;
  key_id?:       string;
  amount_minor?: number;
  currency?:     string;
  // PayU
  key?:          string;
  txnid?:        string;
  amount?:       number | string;
  productinfo?:  string;
  firstname?:    string;
  email?:        string;
  phone?:        string;
  surl?:         string;
  furl?:         string;
  hash?:         string;
  action?:       string;
};

export type CheckoutV2Response = {
  status:                  number;
  order_id:                number;
  order_amount:            number;
  customer_name:           string;
  checkout:                CheckoutDetails;
  mode_of_payment:         string;
  operational:             boolean;
  unoperational_message?:  string;
  delivery_charge:         number;
  default_delivery_charge: number;
  inventory_status:        Record<string, any>;
};

export type PaymentResult =
  | {
      success:             true;
      orderId:             number;
      razorpay_payment_id?: string;
      razorpay_order_id?:   string;
      razorpay_signature?:  string;
    }
  | {
      success:  false;
      reason:   'cancelled' | 'failed' | 'error';
      message?: string;
    };

// ── Extra context passed from CartScreen ───────────────────────────────────────
export type PaymentContext = {
  primaryColor?:    string;
  prefillPhone?:    string;   // from address.phone — fixes black screen + keyboard bug
  prefillEmail?:    string;   // from user profile if available
  logoUrl?:         string;   // your tenant logo URL — fixes black header
};

// ── Razorpay ───────────────────────────────────────────────────────────────────
function buildRazorpayOptions(checkout: CheckoutDetails, customerName: string, ctx: PaymentContext): Record<string, any> {
  // ─────────────────────────────────────────────────────────────────────────
  // FIX: ALL THREE prefill fields must be non-empty real strings.
  //
  // Passing empty strings ('') causes:
  //   • Black top half of the Razorpay modal (header area stays dark)
  //   • Phone number field is unresponsive / keyboard won't open
  //
  // Use values from the cart delivery address form.
  // Strip non-digits from phone and take the last 10 digits.
  // Fall back to safe placeholders — Razorpay accepts them fine,
  // the user can still edit everything inside the checkout screen.
  // ─────────────────────────────────────────────────────────────────────────
  const contact = ctx.prefillPhone
    ? ctx.prefillPhone.replace(/\D/g, '').slice(-10).padStart(10, '0')
    : '9999999999';   // placeholder — user can edit inside Razorpay

  const email = ctx.prefillEmail || 'customer@order.com';  // placeholder

  return {
    description: 'Order Payment',
    currency:    checkout.currency ?? 'INR',
    key:         checkout.key_id   ?? '',
    amount:      String(checkout.amount_minor ?? 0),  // paise as string
    name:        customerName || 'Store',
    order_id:    checkout.order_id ?? '',
    prefill: {
      name:    customerName || 'Customer',
      contact,    // ← must be non-empty
      email,      // ← must be non-empty
    },
    theme: { color: ctx.primaryColor ?? '#111111' },
    // FIX: Do NOT pass image as empty string — it causes the black header.
    // Only include it when you have a real URL.
    ...(ctx.logoUrl ? { image: ctx.logoUrl } : {}),
  };
}

async function handleRazorpayNative(orderId: number, options: Record<string, any>): Promise<PaymentResult> {
  try {
    const RazorpayCheckout = require('react-native-razorpay').default;
    const data = await RazorpayCheckout.open(options);

    return {
      success:             true,
      orderId,
      razorpay_payment_id: data.razorpay_payment_id,
      razorpay_order_id:   data.razorpay_order_id,
      razorpay_signature:  data.razorpay_signature,
    };
  } catch (err: any) {
    // Razorpay throws { code: 0, description: 'Cancelled by user' } on dismiss
    if (err?.code === 0) return { success: false, reason: 'cancelled' };
    return {
      success: false,
      reason:  'failed',
      message: err?.description ?? err?.message ?? 'Razorpay payment failed',
    };
  }
}

// react-native-razorpay is native-bridge only — on Expo web `require(...).default`
// resolves to undefined, so calling `.open()` throws
// "Cannot read properties of undefined (reading 'open')" (seen testing via
// `expo start --web`). Web gets Razorpay's own checkout.js instead, same
// approach as the Vite web reference (Containers/HomeV3/CartPage/Cart.jsx).
const RAZORPAY_WEB_SCRIPT_ID = 'razorpay-checkout-script';

function loadRazorpayWebScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    let script = document.getElementById(RAZORPAY_WEB_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = RAZORPAY_WEB_SCRIPT_ID;
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', () => resolve(true));
    script.addEventListener('error', () => resolve(false));
  });
}

async function handleRazorpayWeb(orderId: number, options: Record<string, any>): Promise<PaymentResult> {
  const loaded = await loadRazorpayWebScript();
  if (!loaded || !(window as any).Razorpay) {
    return { success: false, reason: 'error', message: 'Payment gateway failed to load. Please refresh and try again.' };
  }

  return new Promise((resolve) => {
    const rzp = new (window as any).Razorpay({
      ...options,
      handler: (response: any) => {
        resolve({
          success:             true,
          orderId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id:   response.razorpay_order_id,
          razorpay_signature:  response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => resolve({ success: false, reason: 'cancelled' }),
      },
    });
    rzp.on('payment.failed', (resp: any) => {
      resolve({
        success: false,
        reason:  'failed',
        message: resp?.error?.description ?? 'Razorpay payment failed',
      });
    });
    rzp.open();
  });
}

async function handleRazorpay(
  orderId:      number,
  checkout:     CheckoutDetails,
  customerName: string,
  ctx:          PaymentContext,
): Promise<PaymentResult> {
  const options = buildRazorpayOptions(checkout, customerName, ctx);
  return Platform.OS === 'web'
    ? handleRazorpayWeb(orderId, options)
    : handleRazorpayNative(orderId, options);
}

// ── PayU ───────────────────────────────────────────────────────────────────────
async function handlePayU(
  orderId:  number,
  checkout: CheckoutDetails,
): Promise<PaymentResult> {
  const params = new URLSearchParams({
    key:         checkout.key         ?? '',
    txnid:       checkout.txnid       ?? '',
    amount:      String(checkout.amount ?? '0'),
    productinfo: checkout.productinfo ?? 'Order',
    firstname:   checkout.firstname   ?? '',
    email:       checkout.email       ?? '',
    phone:       checkout.phone       ?? '',
    surl:        checkout.surl        ?? '',
    furl:        checkout.furl        ?? '',
    hash:        checkout.hash        ?? '',
  });

  const payuUrl = `${checkout.action ?? 'https://secure.payu.in/_payment'}?${params}`;

  try {
    const InAppBrowser = require('react-native-inappbrowser-reborn').default;
    if (await InAppBrowser.isAvailable()) {
      const result = await InAppBrowser.openAuth(payuUrl, checkout.surl ?? '', {
        showTitle:               true,
        enableUrlBarHiding:      true,
        enableDefaultShare:      false,
        forceCloseOnRedirection: true,
        animations: {
          startEnter: 'slide_in_right', startExit: 'slide_out_left',
          endEnter:   'slide_in_left',  endExit:   'slide_out_right',
        },
      });
      if (result.type === 'success') return { success: true, orderId };
      return { success: false, reason: 'cancelled' };
    }
  } catch (_) {
    // InAppBrowser not installed — fall back to system browser
  }

  await Linking.openURL(payuUrl);
  return { success: true, orderId };
}

// ── Main dispatcher ────────────────────────────────────────────────────────────
export async function openPaymentGateway(
  response: CheckoutV2Response,
  ctx:      PaymentContext = {},
): Promise<PaymentResult> {
  if (!response.operational) {
    Alert.alert(
      'Store unavailable',
      response.unoperational_message ?? 'We are not accepting orders right now.',
    );
    return { success: false, reason: 'error', message: 'Not operational' };
  }

  const provider = (response.checkout?.provider ?? '').toLowerCase().trim();

  switch (provider) {
    case 'razorpay':
      return handleRazorpay(
        response.order_id,
        response.checkout,
        response.customer_name,
        ctx,
      );

    case 'payu':
      return handlePayU(response.order_id, response.checkout);

    // ── Add new gateways here ──────────────────────────────────────────────
    // case 'stripe':
    //   return handleStripe(response.order_id, response.checkout, ctx);
    // ──────────────────────────────────────────────────────────────────────

    default:
      Alert.alert(
        'Payment unavailable',
        `Unsupported payment provider "${response.checkout?.provider}". Contact support.`,
      );
      return {
        success: false,
        reason:  'error',
        message: `Unknown provider: ${response.checkout?.provider}`,
      };
  }
}
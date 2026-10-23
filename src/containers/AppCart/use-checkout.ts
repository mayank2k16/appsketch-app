import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  checkout,
  type CheckoutBody,
  type CheckoutResponse,
  confirmPayment,
} from '@/api/app-cart';
import { DISCOUNT_KEY, PLAN_REQUIRED } from '@/api/app-cart';
import {
  apiError,
  apiErrorCode,
  type RegistrantContact,
} from '@/api/app-domains';
import { inr } from '@/components/services';
import { useAuth } from '@/hooks/useAuth';
import {
  type CheckoutV2Response,
  openPaymentGateway,
} from '@/lib/payments/payment-gateway';
import { useAppCart } from '@/lib/store/app-cart-store';
import { toast } from '@/lib/toast';

import { contactMissing } from './contact-form';

/** The server's Razorpay block in the shape openPaymentGateway expects. */
function toGateway(r: CheckoutResponse): CheckoutV2Response {
  return {
    status: 200,
    order_id: r.order_id,
    order_amount: r.total_inr,
    customer_name: r.razorpay.name || 'AppSketch',
    checkout: {
      provider: 'Razorpay',
      order_id: r.razorpay.order_id,
      key_id: r.razorpay.key_id,
      amount_minor: r.razorpay.amount_paise,
      currency: r.razorpay.currency || 'INR',
    },
    mode_of_payment: 'online',
    operational: true,
    delivery_charge: 0,
    default_delivery_charge: 0,
    inventory_status: {},
  };
}

function body(discountCode: string | null): CheckoutBody | string {
  const { addonIds, domain, contact } = useAppCart.getState();
  if (!domain)
    return { addon_ids: addonIds, domain: null, discount_code: discountCode };
  const missing = contactMissing(contact);
  if (missing) return `Add the registrant's ${missing.toLowerCase()}`;
  return {
    addon_ids: addonIds,
    discount_code: discountCode,
    domain: {
      name: domain.name,
      years: domain.years,
      tenant_id: domain.tenant_id,
      contacts: { registrant: contact as RegistrantContact },
    },
  };
}

async function pay(r: CheckoutResponse): Promise<number | null> {
  const result = await openPaymentGateway(toGateway(r), {
    primaryColor: '#F2600C',
    prefillEmail: r.razorpay.prefill?.email,
    prefillPhone: r.razorpay.prefill?.contact,
    prefillName: r.razorpay.prefill?.name,
    description: r.razorpay.description,
  });
  if (!result.success) {
    if (result.reason !== 'cancelled')
      toast.error('Payment failed', result.message);
    return null;
  }
  try {
    const order = await confirmPayment({
      order_id: r.order_id,
      razorpay_payment_id: result.razorpay_payment_id ?? '',
      razorpay_order_id: result.razorpay_order_id ?? r.razorpay.order_id,
      razorpay_signature: result.razorpay_signature ?? '',
    });
    return order.id;
  } catch (e) {
    // The money moved; the order screen keeps checking the server.
    toast.warning('Payment received', apiError(e, "We're confirming it now."));
    return r.order_id;
  }
}

/** Pay: sign-in gate → checkout → Razorpay → confirm. Cancel is silent;
 *  server errors are shown as the server wrote them. `shown` is the total on
 *  screen; Razorpay always charges the server's total (its lines carry the
 *  discount), and a difference is announced first. `plan_required` opens
 *  the plan step. `discountCode` is sent only once validated. */
export function useCheckout(onPaid: (orderId: number) => void) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = useAuth.use.status();
  const [busy, setBusy] = React.useState(false);
  const start = async (shown: number, discountCode: string | null) => {
    if (status !== 'signIn') {
      toast.info('Sign in to check out');
      router.push({ pathname: '/welcome', params: { return: '1' } });
      return;
    }
    const b = body(discountCode);
    if (typeof b === 'string') return toast.warning(b);
    setBusy(true);
    try {
      const quote = await checkout(b);
      if (quote.total_inr !== shown)
        toast.info(
          `Your total is ${inr(quote.total_inr)}`,
          quote.lines.map((l) => l.label).join(' · ')
        );
      const id = await pay(quote);
      if (id != null) {
        useAppCart.getState().clear();
        onPaid(id);
      }
    } catch (e) {
      if (apiErrorCode(e) === PLAN_REQUIRED) {
        useAppCart.getState().setPlanRequired(true);
        toast.info('Add a plan to continue', apiError(e));
        return;
      }
      // A code that went bad since validation: re-check so the chip shows why.
      if (discountCode && apiErrorCode(e))
        void queryClient.invalidateQueries({ queryKey: DISCOUNT_KEY });
      toast.error("Couldn't complete checkout", apiError(e));
    } finally {
      setBusy(false);
    }
  };
  return { busy, start };
}

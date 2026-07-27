import { accountClient } from '@/api/common/client';

import type {
  ConfirmSubscriptionPaymentFailurePayload,
  ConfirmSubscriptionPaymentSuccessPayload,
  InitiateSubscriptionPaymentPayload,
  InitiateSubscriptionPaymentResponse,
  SubscriptionPlan,
  SubscriptionPlansResponse,
} from './types';

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await accountClient.get<SubscriptionPlansResponse>('account/subscription-plans/');
  return data.results ?? [];
}

export async function initiateSubscriptionPayment(
  payload: InitiateSubscriptionPaymentPayload
): Promise<InitiateSubscriptionPaymentResponse> {
  const { data } = await accountClient.post<InitiateSubscriptionPaymentResponse>(
    'account/payment/initiate/',
    payload
  );
  return data;
}

export async function confirmSubscriptionPaymentSuccess(
  payload: ConfirmSubscriptionPaymentSuccessPayload
): Promise<void> {
  await accountClient.post('account/payment/success/', payload);
}

export async function confirmSubscriptionPaymentFailure(
  payload: ConfirmSubscriptionPaymentFailurePayload
): Promise<void> {
  await accountClient.post('account/payment/failure/', payload);
}

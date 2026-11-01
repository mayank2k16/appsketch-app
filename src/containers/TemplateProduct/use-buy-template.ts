import { useRouter } from 'expo-router';
import * as React from 'react';

import type { MarketTemplate } from '@/api/templates';
import { hasPaidPlan } from '@/containers/AppCart/use-cart-totals';
import {
  isMobile,
  thumbOf,
  titleOf,
} from '@/containers/Home/TemplateReel/layout';
import { getUserSubscription, useAuth } from '@/hooks/useAuth';
import { useAppCart } from '@/lib/store/app-cart-store';
import { toast } from '@/lib/toast';

import { useCloneAndOpen } from './use-use-template';

/**
 * "Buy now" on an app or website template.
 * - Signed out: sign in first (back to this page after).
 * - On a paid plan: same as "Use this template" — copy it, open the builder.
 * - Otherwise: the template goes in the cart with the Basic plan (yearly,
 *   ≈ ₹1,250/month, an App Store subscription on iOS). Once the plan is
 *   active the cart copies it and opens the builder (template-buy.tsx).
 */
export function useBuyTemplate(template: MarketTemplate) {
  const router = useRouter();
  const { use, usingKey } = useCloneAndOpen();
  const setTemplateBuy = useAppCart((c) => c.setTemplateBuy);
  const buy = React.useCallback(() => {
    if (template.kind !== 'code') return;
    const auth = useAuth.getState();
    if (auth.status !== 'signIn') {
      toast.info('Sign in to buy this template.');
      router.push({ pathname: '/welcome', params: { return: '1' } } as never);
      return;
    }
    if (hasPaidPlan(getUserSubscription(auth.user))) {
      use(template);
      return;
    }
    setTemplateBuy({
      id: template.id,
      key: template.key,
      uuid: template.uuid,
      title: titleOf(template),
      thumb: thumbOf(template),
      app_type: template.app_type,
      mobile: isMobile(template),
      ecosystem: !!template.ecosystem,
    });
    router.push('/cart');
  }, [template, router, use, setTemplateBuy]);
  return {
    buy,
    busy: usingKey === template.key,
    available: template.kind === 'code',
  };
}

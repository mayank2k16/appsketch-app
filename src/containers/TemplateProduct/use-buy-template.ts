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
 * - Otherwise: the template is remembered (app-cart store) and the Pricing
 *   tab opens on Basic, billed yearly, with a floating Pay now bar
 *   (Pricing/pay-now-bar.tsx; App Store on iOS, Google Play on Android).
 *   Once the plan is active it is copied and the builder opens
 *   (useContinueTemplateBuy).
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
    // The Pricing tab, on Basic billed yearly, with a floating Pay now
    // (App Store on iOS, Google Play on Android). The template page is a
    // modal above the tabs: close it first.
    if (router.canDismiss()) router.dismissAll();
    router.navigate({
      pathname: '/pricing',
      params: { plan: 'basic', cycle: 'yearly' },
    } as never);
  }, [template, router, use, setTemplateBuy]);
  return {
    buy,
    busy: usingKey === template.key,
    available: template.kind === 'code',
  };
}

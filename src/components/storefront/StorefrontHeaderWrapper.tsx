/**
 * Centralized header wrapper for storefront screens.
 * Uses SCREEN_NAV_CONFIG to control header visibility per screen.
 * Renders HomeHeader (logo, search, cart, settings) when showHeader is true.
 */

import * as React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { HomeHeader } from '@/components/home/home-header';
import { getScreenNavConfig } from '@/lib/navigation';
import { useTenant } from '@/lib/tenant';

export type StorefrontScreenName =
  | 'cart'
  | 'explore'
  | 'wishlist'
  | 'index'
  | 'profile'
  | 'categories'
  | 'checkout'
  | '[id]'
  | 'terms'
  | 'privacy'
  | 'products';

type Props = {
  screenName: StorefrontScreenName;
  children: React.ReactNode;
  /** Override onMenuPress (e.g. for drawer) */
  onMenuPress?: () => void;
  /** Override onBackPress (e.g. for cart) */
  onBackPress?: () => void;
};

export function StorefrontHeaderWrapper({
  screenName,
  children,
  onMenuPress,
  onBackPress,
}: Props) {
  const router = useRouter();
  const config = getScreenNavConfig(screenName);
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.theme?.colors?.primary ?? '#111';

  if (!config.showHeader) {
    return <>{children}</>;
  }

  const handleBackPress = onBackPress ?? (() => router.back());

  return (
    <View style={{ flex: 1 }}>
      <HomeHeader
        primaryColor={primaryColor}
        showBackButton={config.showBackButton ?? false}
        onBackPress={handleBackPress}
        onMenuPress={onMenuPress}
      />
      {children}
    </View>
  );
}

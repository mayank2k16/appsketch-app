import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Catalogue codes (Django admin add-ons) → glyph + tone, as on the web. */
const ICON: Record<string, IconName> = {
  android_app: 'logo-android',
  ios_app: 'logo-apple',
  web_app: 'globe-outline',
  marketplace: 'storefront-outline',
  vendor_app: 'people-outline',
  delivery_partner_app: 'bicycle-outline',
  ecommerce: 'cart-outline',
};

const TONE: Record<string, [string, string]> = {
  android_app: ['#E6F6EC', '#2F9E5B'],
  ios_app: ['#EEF0F3', '#3C4150'],
  web_app: ['#E8F0FE', '#2F6BDE'],
  marketplace: ['#EFEAFE', '#6D4AE0'],
  vendor_app: ['#FDEFE6', '#E2733A'],
  delivery_partner_app: ['#E8F0FE', '#2F6BDE'],
  ecommerce: ['#E6F6EC', '#2F9E5B'],
};

export const iconOf = (code: string): IconName =>
  ICON[code] ?? 'pricetag-outline';

/** [background, glyph]; dark mode uses the glyph colour on a faint wash. */
export function toneOf(code: string, dark: boolean): [string, string] {
  const [bg, fg] = TONE[code] ?? ['#F4F4F2', '#5C5D63'];
  return dark ? [`${fg}2E`, fg] : [bg, fg];
}

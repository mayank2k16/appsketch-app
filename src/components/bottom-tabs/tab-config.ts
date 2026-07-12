import type { Ionicons } from '@expo/vector-icons';
import * as React from 'react';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export type TabConfig = {
  /** Route name inside the (tabs) group — must match the screen file name. */
  name: string;
  label: string;
  icon: IoniconName;       // inactive (outline)
  iconActive: IoniconName; // active (filled)
};

// Order here is the visual left→right order in the bar. It must line up with the
// <Tabs.Screen> order declared in src/app/(tabs)/_layout.tsx.
export const TAB_CONFIG: TabConfig[] = [
  { name: 'home',        label: 'Home',        icon: 'home-outline',          iconActive: 'home'          },
  { name: 'agent',       label: 'Agent',       icon: 'sparkles-outline',      iconActive: 'sparkles'      },
  { name: 'studio',      label: 'Studio',      icon: 'color-palette-outline', iconActive: 'color-palette' },
  { name: 'marketplace', label: 'Market',      icon: 'storefront-outline',    iconActive: 'storefront'    },
];

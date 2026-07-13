import type { TabIconKey } from './TabIcon';

export type TabConfig = {
  /** Route name inside the (tabs) group — must match the screen file name. */
  name: string;
  label: string;
  iconKey: TabIconKey;
};

// Order here is the visual left→right order in the bar. It must line up with the
// <Tabs.Screen> order declared in src/app/(tabs)/_layout.tsx.
export const TAB_CONFIG: TabConfig[] = [
  { name: 'home',        label: 'Home',   iconKey: 'home'   },
  { name: 'agent',       label: 'Agent',  iconKey: 'agent'  },
  { name: 'studio',      label: 'Studio', iconKey: 'studio' },
  { name: 'marketplace', label: 'Market', iconKey: 'market' },
];

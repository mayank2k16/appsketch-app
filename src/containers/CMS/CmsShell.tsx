import * as React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { PressableScale } from '@/components/ui';
import { useStudio } from '@/lib/store/studio-store';
import { useCmsTabIntent } from '@/lib/store/cms-tab-intent';

import { CmsDrawer } from './CmsDrawer';
import { getVisibleCmsTabs } from './tabs';
import type { CmsTabKey } from './tabs';
import { ThemeSwitcherButton, useCmsTheme } from './theme';
import { VendorFilterButton } from './VendorFilter/VendorFilterButton';

/**
 * Single-screen CMS entry point — replaces the old per-tab route group
 * (`src/app/cms/(tabs)/`). Owns which tab is active and renders it via plain
 * conditional mounting (only the active tab's component is rendered, so only
 * its data-fetching effects run); switching tabs is a local state change, not
 * a navigation — the drawer is how the user picks a tab.
 */
export function CmsShell() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useCmsTheme();
  const isFocused = useIsFocused();
  const isLight = colors.kind === 'light';

  const tenantType = useStudio.use.attachedTenant()?.tenant_type;
  const visibleTabs = React.useMemo(() => getVisibleCmsTabs(tenantType), [tenantType]);

  const [activeTab, setActiveTab] = React.useState<CmsTabKey>('analytics');
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some((t) => t.key === activeTab)) {
      setActiveTab(visibleTabs[0].key);
    }
  }, [visibleTabs, activeTab]);

  const activeMeta = visibleTabs.find((t) => t.key === activeTab);
  // A notification tap (e.g. "new order received") sets this before routing
  // here — jump straight to that tab, then clear the intent. Subscribed (not
  // just read on mount) because CmsShell may already be mounted when a second
  // notification is tapped — `router.push('/cms')` won't remount it.
  // The intent store types the key as a plain string (it sits below the CMS
  // screens in the dependency graph), so validate it against CMS_TABS here
  // rather than trusting an arbitrary push payload to name a real tab.
  React.useEffect(() => {
    const apply = (key: string | null) => {
      if (key && visibleTabs.some((t) => t.key === key)) {
        setActiveTab(key as CmsTabKey);
      }
    };

    apply(useCmsTabIntent.getState().consumePendingTab());

    return useCmsTabIntent.subscribe((state) => {
      if (state.pendingTab) {
        apply(useCmsTabIntent.getState().consumePendingTab());
      }
    });
  }, []);


  function selectTab(key: CmsTabKey) {
    setActiveTab(key);
    setDrawerOpen(false);
  }

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/studio' as never);
  }

  return (
    <View style={[st.root, { backgroundColor: colors.background }]}>
      {/* White: the status bar sits on the top bar, so its content follows the
          bar's own luminance (white default chrome → dark-content; a dark
          sidebar palette → light-content). Dark mode is left untouched. */}
      {isLight && isFocused && Platform.OS !== 'web' ? (
        <StatusBar style={isDarkColor(colors.sidebarBg) ? 'light' : 'dark'} />
      ) : null}
      <View
        style={[
          st.topBar,
          { backgroundColor: colors.sidebarBg, paddingTop: insets.top + 12 },
          isLight && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        ]}
      >
        <PressableScale
          onPress={handleBack}
          style={[st.iconBtn, { backgroundColor: colors.sidebarActiveBg }]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={20} color={colors.sidebarText} />
        </PressableScale>
        <Text style={[st.title, { color: colors.sidebarText }]} numberOfLines={1}>
          {activeMeta?.label}
        </Text>

        <View style={st.sideGroup}>
          {tenantType === 'marketplace' && <VendorFilterButton />}
          <ThemeSwitcherButton />
          <PressableScale
            onPress={() => setDrawerOpen(true)}
            style={[st.iconBtn, { backgroundColor: colors.sidebarActiveBg }]}
            hitSlop={8}
          >
            <Ionicons name="menu" size={20} color={colors.sidebarText} />
          </PressableScale>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {visibleTabs.map(
          (tab) =>
            activeTab === tab.key && (
              <tab.Component key={tab.key} onMenuPress={() => setDrawerOpen(true)} />
            )
        )}
      </View>

      <CmsDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tabs={visibleTabs}
        activeTab={activeTab}
        onSelectTab={selectTab}
      />
    </View>
  );
}

/** True for a dark hex colour (#RGB / #RRGGBB), by perceived luminance. */
function isDarkColor(hex: string) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return true;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 150;
}

const st = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  sideGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    marginHorizontal: 8,
  },
});

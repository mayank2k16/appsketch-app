import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useStudio } from '@/lib/store/studio-store';
import { useCmsTabIntent } from '@/lib/store/cms-tab-intent';

import { CmsDrawer } from './CmsDrawer';
import { getVisibleCmsTabs } from './tabs';
import type { CmsTabKey } from './tabs';
import { ThemeSwitcherButton, useCmsTheme } from './theme';

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
      <View style={[st.topBar, { backgroundColor: colors.sidebarBg, paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={handleBack}
          style={[st.iconBtn, { backgroundColor: colors.sidebarActiveBg }]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={20} color={colors.sidebarText} />
        </Pressable>
        <Text style={[st.title, { color: colors.sidebarText }]} numberOfLines={1}>
          {activeMeta?.label}
        </Text>

        <View style={st.sideGroup}>
          <ThemeSwitcherButton />
          <Pressable
            onPress={() => setDrawerOpen(true)}
            style={[st.iconBtn, { backgroundColor: colors.sidebarActiveBg }]}
            hitSlop={8}
          >
            <Ionicons name="menu" size={20} color={colors.sidebarText} />
          </Pressable>
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

const st = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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

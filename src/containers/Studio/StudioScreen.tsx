import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { useCoderTheme } from '@/lib/theme';

import { AppsScreen } from './Apps/AppsScreen';
import { DiscoverScreen } from './Discover/DiscoverScreen';
import { SettingsScreen } from './Settings/SettingsScreen';

type StudioSection = 'apps' | 'discover' | 'settings';

const SECTIONS: {
  key: StudioSection;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
    { key: 'apps', label: 'Apps', icon: 'grid-outline' },
    { key: 'discover', label: 'Discover', icon: 'compass-outline' },
    { key: 'settings', label: 'Settings', icon: 'settings-outline' },
  ];

/** Narrow enough that the store cards keep almost the full width — the rail is
 *  a navigation strip, not a panel. */
const RAIL_W = 65;
const SCREEN_INSET = 8;

export function StudioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const status = useAuth.use.status();
  const isLoggedIn = status === 'signIn';
  const { colorScheme } = useColorScheme();
  const t = useCoderTheme(colorScheme);

  const [section, setSection] = React.useState<StudioSection>('apps');
  const [search, setSearch] = React.useState('');

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <View style={[st.header, { paddingTop: insets.top + 14 }]}>
        <View style={st.eyebrowRow}>
          <View style={[st.eyebrowDot, { backgroundColor: t.accent }]} />
          <Text style={[st.eyebrow, { color: t.tagText }]}>
            MANAGE EVERY APPLICATION
          </Text>
        </View>

        {/* Search sits directly left of the "Studio" label rather than
            above it as its own row — the label is the only thing that needs
            full heading weight here, so the two share one compact line
            instead of the search bar eating its own vertical block. */}
        <View style={st.titleRow}>
          <Text style={[st.title, { color: t.text }]}>Studio</Text>
          <View
            style={[
              st.searchWrap,
              { backgroundColor: t.card, borderColor: t.studioCardBorder },
            ]}
          >
            <Ionicons name="search" size={15} color={t.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search your stores…"
              placeholderTextColor={t.textMuted}
              style={[st.searchInput, { color: t.text }]}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>
      </View>

      {!isLoggedIn ? (
        <View style={st.gate}>
          <Ionicons name="lock-closed-outline" size={36} color={t.textMuted} />
          <Text style={[st.gateTitle, { color: t.text }]}>
            Sign in to view your stores
          </Text>
          <Pressable onPress={() => router.push('/login' as never)}>
            <View style={[st.gateBtn, { backgroundColor: t.accent }]}>
              <Text style={[st.gateBtnText, { color: t.accentOn }]}>
                Sign In
              </Text>
            </View>
          </Pressable>
        </View>
      ) : (
        <View style={st.body}>
          {/* Vertical rail replaces the old horizontal pill row. */}
          <View style={[st.rail, { borderRightColor: t.studioCardBorder }]}>
            {SECTIONS.map((s) => {
              const active = s.key === section;
              return (
                <Pressable key={s.key} onPress={() => setSection(s.key)}>
                  <View
                    style={[
                      st.railItem,
                      {
                        backgroundColor: active
                          ? t.studioRailActiveBg
                          : t.studioRailBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name={s.icon}
                      size={19}
                      color={active ? t.text : t.textMuted}
                    />
                    <Text
                      style={[
                        st.railText,
                        { color: active ? t.text : t.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {s.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={st.content}>
            {section === 'apps' && <AppsScreen search={search} />}
            {section === 'discover' && <DiscoverScreen />}
            {section === 'settings' && <SettingsScreen />}
          </View>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: SCREEN_INSET,
    paddingBottom: 10,
    gap: 8,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrow: {
    fontFamily: F.sans700,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: 13, height: '100%' },
  title: {
    fontFamily: F.display900,
    fontSize: 24,
    letterSpacing: -0.5,
  },

  body: {
    flex: 1,
    flexDirection: 'row',
  },
  rail: {
    width: RAIL_W,
    gap: 8,
    paddingTop: 4,
    paddingLeft: SCREEN_INSET,
    paddingRight: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  railItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    borderRadius: 5,
  },
  railText: { fontFamily: F.sans600, fontSize: 10.5 },

  // 8px on both sides: from the separator line on the left, and from the
  // screen's own edge on the right — each tab's own inner content (see
  // AppsScreen/DiscoverScreen/DomainsScreen) adds at most 4px more of its
  // own, so the total offset from either boundary to an actual card is
  // 8+4, never the old rail-padding + body-gap + content-padding stack.
  content: { flex: 1, paddingHorizontal: 8 },

  gate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  gateTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  gateBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 5,
    marginTop: 4,
  },
  gateBtnText: { fontWeight: '700', fontSize: 14 },
});

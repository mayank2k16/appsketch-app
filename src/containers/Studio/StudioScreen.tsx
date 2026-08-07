import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';
import { SectionHeading } from '../Home/components/SectionHeading';

import { AppsScreen } from './Apps/AppsScreen';
import { DiscoverScreen } from './Discover/DiscoverScreen';
import { SettingsScreen } from './Settings/SettingsScreen';

type StudioSection = 'apps' | 'discover' | 'settings';

const SECTIONS: { key: StudioSection; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'apps', label: 'Apps', icon: 'grid-outline' },
  { key: 'discover', label: 'Discover', icon: 'compass-outline' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline' },
];

/** Narrow enough that the store cards keep almost the full width — the rail is
 *  a navigation strip, not a panel. */
const RAIL_W = 74;
const SCREEN_INSET = 8;

export function StudioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const status = useAuth.use.status();
  const isLoggedIn = status === 'signIn';
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  const [section, setSection] = React.useState<StudioSection>('apps');

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      {/* Same eyebrow + gradient-heading block every Home section uses, so
          Studio's title matches the rest of the app instead of being its own
          one-off bold Text. */}
      <SectionHeading
        eyebrow="MANAGE EVERY STORE"
        lines={['Studio']}
        t={t}
        style={[st.header, { paddingTop: insets.top + 14 }]}
      />

      {!isLoggedIn ? (
        <View style={st.gate}>
          <Ionicons name="lock-closed-outline" size={36} color={t.textMuted} />
          <Text style={[st.gateTitle, { color: t.text }]}>Sign in to view your stores</Text>
          <Pressable onPress={() => router.push('/login' as never)}>
            <View style={[st.gateBtn, { backgroundColor: t.accent }]}>
              <Text style={st.gateBtnText}>Sign In</Text>
            </View>
          </Pressable>
        </View>
      ) : (
        <View style={st.body}>
          {/* Vertical rail replaces the old horizontal pill row. */}
          <View style={st.rail}>
            {SECTIONS.map((s) => {
              const active = s.key === section;
              return (
                <Pressable key={s.key} onPress={() => setSection(s.key)}>
                  <View
                    style={[
                      st.railItem,
                      { backgroundColor: active ? t.studioRailActiveBg : t.studioRailBg },
                    ]}
                  >
                    <Ionicons name={s.icon} size={19} color={active ? t.accent : t.textMuted} />
                    <Text
                      style={[st.railText, { color: active ? t.accent : t.textMuted }]}
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
            {section === 'apps' && <AppsScreen />}
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
    paddingBottom: 4,
  },

  body: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: SCREEN_INSET,
    gap: 8,
  },
  rail: {
    width: RAIL_W,
    gap: 8,
    paddingTop: 4,
  },
  railItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    borderRadius: 14,
  },
  railText: { fontFamily: F.sans600, fontSize: 11 },

  content: { flex: 1 },

  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  gateTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  gateBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 4 },
  gateBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/lib/theme';

import { AppsScreen } from './Apps/AppsScreen';

type StudioSection = 'apps' | 'discover' | 'settings';

const SECTIONS: { key: StudioSection; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'apps', label: 'Apps', icon: 'grid-outline' },
  { key: 'discover', label: 'Discover', icon: 'compass-outline' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline' },
];

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
      <View style={[st.header, { paddingTop: insets.top + 14, backgroundColor: t.card }]}>
        <Text style={[st.headerTitle, { color: t.text }]}>Studio</Text>
        <Text style={[st.headerSubtitle, { color: t.textSub }]}>Manage every store on your account</Text>
      </View>

      {!isLoggedIn ? (
        <View style={st.gate}>
          <Ionicons name="lock-closed-outline" size={36} color={t.textMuted} />
          <Text style={[st.gateTitle, { color: t.text }]}>Sign in to view your stores</Text>
          <Pressable style={[st.gateBtn, { backgroundColor: t.accent }]} onPress={() => router.push('/login' as never)}>
            <Text style={st.gateBtnText}>Sign In</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={st.tabRow}>
            {SECTIONS.map((s) => {
              const active = s.key === section;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => setSection(s.key)}
                  style={[st.tab, { backgroundColor: t.surface }, active && { backgroundColor: t.accentSoft }]}
                >
                  <Ionicons name={s.icon} size={15} color={active ? t.accent : t.textMuted} />
                  <Text style={[st.tabText, { color: t.textMuted }, active && { color: t.accent }]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flex: 1 }}>
            {section === 'apps' && <AppsScreen />}
            {section === 'discover' && <ComingSoon label="Discover" />}
            {section === 'settings' && <ComingSoon label="Settings" />}
          </View>
        </>
      )}
    </View>
  );
}

function ComingSoon({ label }: { label: string }) {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  return (
    <View style={st.gate}>
      <Ionicons name="hourglass-outline" size={32} color={t.textMuted} />
      <Text style={[st.gateTitle, { color: t.text }]}>{label} is coming soon</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, marginTop: 4 },

  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabText: { fontSize: 13, fontWeight: '600' },

  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  gateTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  gateBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 4 },
  gateBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

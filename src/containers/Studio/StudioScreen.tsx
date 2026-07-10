import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';

import { AppsScreen } from './Apps/AppsScreen';

// Uses the app's global brand palette (same RED/BLACK/WHITE used by
// Profile/MyOrders/Auth) rather than the CMS's own switchable theme system —
// Studio is part of the main account experience, not the CMS shell.
const RED = '#C41230';
const BLACK = '#0D0D0D';
const MUTED = '#8A8A8A';
const BG = '#F8F8F8';

// Mirrors the Vite reference's sidebar sections (Apps | Discover | Settings)
// as a plain state switch. Only "Apps" (the store list) is wired up today —
// add further sections here the same way: a new key in `SECTIONS`, a new
// branch below.
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

  const [section, setSection] = React.useState<StudioSection>('apps');

  return (
    <View style={st.root}>
      <View style={[st.header, { paddingTop: insets.top + 14 }]}>
        <Text style={st.headerTitle}>Studio</Text>
        <Text style={st.headerSubtitle}>Manage every store on your account</Text>
      </View>

      {!isLoggedIn ? (
        <View style={st.gate}>
          <Ionicons name="lock-closed-outline" size={36} color={MUTED} />
          <Text style={st.gateTitle}>Sign in to view your stores</Text>
          <Pressable style={st.gateBtn} onPress={() => router.push('/login' as never)}>
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
                  style={[st.tab, active && st.tabActive]}
                >
                  <Ionicons name={s.icon} size={15} color={active ? RED : MUTED} />
                  <Text style={[st.tabText, active && st.tabTextActive]}>{s.label}</Text>
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
  return (
    <View style={st.gate}>
      <Ionicons name="hourglass-outline" size={32} color={MUTED} />
      <Text style={st.gateTitle}>{label} is coming soon</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    backgroundColor: BLACK,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

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
    backgroundColor: '#fff',
  },
  tabActive: { backgroundColor: '#FFF0F3' },
  tabText: { fontSize: 13, fontWeight: '600', color: MUTED },
  tabTextActive: { color: RED },

  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  gateTitle: { fontSize: 15, fontWeight: '700', color: BLACK, textAlign: 'center' },
  gateBtn: { backgroundColor: RED, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 4 },
  gateBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

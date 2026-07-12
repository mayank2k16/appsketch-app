import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { F } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type ComingSoonProps = {
  title: string;
  subtitle: string;
  icon: IoniconName;
};

/**
 * Themed placeholder for tab destinations that aren't built yet (Agent,
 * Marketplace). Header + centered branded "coming soon" state, so both screens
 * share one look. Swap for the real screen when ready.
 */
export function ComingSoon({ title, subtitle, icon }: ComingSoonProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />

      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[s.title, { color: t.text }]}>{title}</Text>
      </View>

      <View style={s.body}>
        <View style={[s.iconBadge, { backgroundColor: t.accentSoft, borderColor: t.accent }]}>
          <Ionicons name={icon} size={34} color={t.accent} />
        </View>
        <Text style={[s.soonTitle, { color: t.text }]}>Coming soon</Text>
        <Text style={[s.soonSub, { color: t.textSub }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontFamily: F.sans900,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  iconBadge: {
    width: 76,
    height: 76,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  soonTitle: {
    fontFamily: F.sans700,
    fontSize: 18,
  },
  soonSub: {
    fontFamily: F.sans500,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
  },
});

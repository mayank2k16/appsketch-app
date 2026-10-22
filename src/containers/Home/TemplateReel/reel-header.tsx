import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import type { HomeColors } from '../theme/HomeTheme';

/** "Made with AppSketch" + a real "See all" link to the Market tab. */
export const ReelHeader = React.memo(function ReelHeader({
  t,
}: {
  t: HomeColors;
}) {
  const router = useRouter();
  return (
    <View style={s.head}>
      <Text style={[s.title, { color: t.text }]}>Made with AppSketch</Text>
      <PressableScale
        accessibilityLabel="See all templates"
        hitSlop={10}
        onPress={() => router.navigate('/marketplace')}
        style={s.link}
      >
        <Text style={[s.linkText, { color: t.textSub }]}>See all</Text>
        <Ionicons name="chevron-forward" size={13} color={t.textSub} />
      </PressableScale>
    </View>
  );
});

const s = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  title: { fontFamily: F.sans600, fontSize: 15, letterSpacing: -0.2 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { fontFamily: F.sans500, fontSize: 13 },
});

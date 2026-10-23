import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import type { ServicesPalette } from './palette';

/** Back chevron + title for the pushed services screens (solid, no blur). */
export function ScreenHeader({
  s,
  title,
  right,
}: {
  s: ServicesPalette;
  title: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const back = () =>
    router.canGoBack() ? router.back() : router.replace('/pricing');
  return (
    <View
      style={[
        st.bar,
        {
          paddingTop: insets.top + 6,
          backgroundColor: s.canvas,
          borderColor: s.hairline,
        },
      ]}
    >
      <PressableScale
        onPress={back}
        hitSlop={10}
        style={st.btn}
        accessibilityLabel="Back"
      >
        <Ionicons name="chevron-back" size={22} color={s.text} />
      </PressableScale>
      <Text style={[st.title, { color: s.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={st.right}>{right}</View>
    </View>
  );
}

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: F.sans700,
    fontSize: 16,
    textAlign: 'center',
  },
  right: { minWidth: 40, alignItems: 'flex-end', paddingRight: 6 },
});

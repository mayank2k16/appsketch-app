import { BlurView } from 'expo-blur';
import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import type { AppColors } from '@/lib/theme';

import { Skeleton } from './Skeleton';

const RADIUS = 16;

type Props = {
  t: AppColors;
  isDark: boolean;
};

/** Mirrors TemplateCard's glass shell + content layout so the loading grid
 * doesn't jump/reflow once real cards swap in. */
export function TemplateCardSkeleton({ t, isDark }: Props) {
  return (
    <View style={[styles.card, { borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(17,17,17,0.10)' }]}>
      <BlurView intensity={Platform.OS === 'android' ? 50 : 30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: t.card, opacity: isDark ? 0.55 : 0.5 }]} />

      <View style={styles.content}>
        <Skeleton t={t} borderRadius={11} style={styles.imageWrap} />

        <Skeleton t={t} height={12} width="70%" borderRadius={4} />
        <Skeleton t={t} height={10} width="90%" borderRadius={4} />

        <View style={styles.tagRow}>
          <Skeleton t={t} height={16} width={40} borderRadius={7} />
          <Skeleton t={t} height={16} width={52} borderRadius={7} />
          <Skeleton t={t} height={16} width={34} borderRadius={7} />
        </View>

        <View style={styles.btnRow}>
          <Skeleton t={t} height={28} borderRadius={8} />
          <Skeleton t={t} height={28} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    padding: 8,
    gap: 6,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1.4,
  },
  tagRow: { flexDirection: 'row', gap: 4 },
  btnRow: { gap: 5, marginTop: 2 },
});

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import { BOX_RADIUS, HERO_RADIUS, pageGeometry } from './geometry';
import { LiveLoader } from './live-loader';
import { type PageTheme, pageTheme } from './theme';

function Bar(p: { w: number | `${number}%`; h: number; c: string }) {
  return (
    <View
      style={{
        width: p.w,
        height: p.h,
        borderRadius: p.h / 2,
        backgroundColor: p.c,
      }}
    />
  );
}

/** A cold open still fetching: the page's own two panels, as skeletons —
 *  the hero's blurred loader and placeholder details. */
function PageSkeleton({ t, dark }: { t: PageTheme; dark: boolean }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const g = pageGeometry(width, height, insets);
  const c = t.chip;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: t.page }]}>
      <View
        style={[
          s.panel,
          { ...rectOf(g.hero), borderRadius: HERO_RADIUS },
          { borderColor: t.panelEdge },
        ]}
      >
        <LiveLoader seed="loading" dark={dark} animate />
      </View>
      <View
        style={[
          s.panel,
          s.box,
          { ...rectOf(g.box), borderRadius: BOX_RADIUS },
          { backgroundColor: t.panel, borderColor: t.panelEdge },
        ]}
      >
        <Bar w="55%" h={20} c={c} />
        <View style={s.row}>
          <Bar w={92} h={22} c={c} />
          <Bar w={64} h={22} c={c} />
        </View>
        <Bar w="92%" h={11} c={c} />
        <Bar w="70%" h={11} c={c} />
        <View style={s.flex} />
        <View style={s.row}>
          <View style={[s.skelBtn, { backgroundColor: c }]} />
          <View style={[s.skelBtn, { backgroundColor: c }]} />
        </View>
      </View>
    </View>
  );
}

const rectOf = (r: {
  x: number;
  y: number;
  width: number;
  height: number;
}) => ({
  left: r.x,
  top: r.y,
  width: r.width,
  height: r.height,
});

/** Cold open with nothing to show yet: still loading (skeletons), or no
 *  such template. */
export function ProductFallback({ loading }: { loading: boolean }) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  const t = pageTheme(dark);
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home' as never);
  };
  return (
    <View style={[s.root, { backgroundColor: t.page }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      {loading ? (
        <PageSkeleton t={t} dark={dark} />
      ) : (
        <>
          <Text style={[s.title, { color: t.ink }]}>Template not found</Text>
          <Text style={[s.body, { color: t.muted }]}>
            It may have been unpublished.
          </Text>
          <PressableScale
            onPress={back}
            style={[s.btn, { backgroundColor: t.primaryBg }]}
          >
            <Text style={[s.btnText, { color: t.primaryFg }]}>Go back</Text>
          </PressableScale>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    position: 'absolute',
    overflow: 'hidden',
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  box: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  skelBtn: { flex: 1, height: 48, borderRadius: 24 },
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: { fontFamily: F.display900, fontSize: 24 },
  body: { fontFamily: F.sans400, fontSize: 15, marginTop: 8 },
  btn: {
    marginTop: 24,
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 24,
    justifyContent: 'center',
  },
  btnText: { fontFamily: F.sans700, fontSize: 15 },
});

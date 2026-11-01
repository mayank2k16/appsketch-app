import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { MarketTemplate, TemplateScreenshot } from '@/api/templates';
import { PhoneFrame } from '@/containers/Home/TemplateReel/phone-frame';
import { F } from '@/lib/fonts';

import { AppDetails } from './app-details';
import { CLOSE_INSET, CLOSE_SIZE } from './geometry';

/**
 * A mobile app's hero when it has several captured screens: each screen in
 * its own iPhone frame, two to a row, captioned ("Home", "Our menu"…), like
 * an App Store screenshot set. It scrolls up and down; the pager's pan is
 * horizontal-only, so left/right still moves between templates. The top
 * row leaves room for the close button. Below the screens come the
 * App Store-style details (app-details/).
 */

const COLS = 2;
const GAP = 10;
const SIDE = 0;

type Props = {
  template: MarketTemplate;
  screens: TemplateScreenshot[];
  /** Room left under the content for the details box floating over it. */
  bottomPad: number;
  /** Fetch the details (the page is centred or next to it). */
  near: boolean;
  width: number;
  /** Centred page: scrollable. Neighbours just show the grid. */
  interactive: boolean;
  dark: boolean;
  onShown: () => void;
};

export function AppGallery({
  template,
  screens,
  bottomPad,
  near,
  width,
  interactive,
  dark,
  onShown,
}: Props) {
  const w = Math.floor((width - SIDE * 2 - GAP * (COLS - 1)) / COLS);
  React.useEffect(() => {
    onShown();
  }, [onShown]);
  const ink = dark ? '#E4E4E7' : '#3F3F46';
  return (
    <ScrollView
      scrollEnabled={interactive}
      pointerEvents={interactive ? 'auto' : 'none'}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[s.content, { paddingBottom: bottomPad }]}
      style={StyleSheet.absoluteFill}
    >
      <View style={s.head}>
        <Text style={[s.count, { color: ink }]}>{screens.length} screens</Text>
      </View>
      <View style={[s.grid, { gap: GAP }]}>
        {screens.map((shot, i) => (
          <Animated.View
            key={shot.url}
            entering={FadeIn.delay(i * 60).duration(220)}
            style={{ width: w }}
          >
            <PhoneFrame uri={shot.url} w={w} dark={dark} />
            {shot.caption ? (
              <Text style={[s.caption, { color: ink }]} numberOfLines={1}>
                {shot.caption}
              </Text>
            ) : null}
          </Animated.View>
        ))}
      </View>
      <AppDetails template={template} dark={dark} enabled={near} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: SIDE },
  head: {
    height: CLOSE_SIZE + CLOSE_INSET * 2,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  count: { fontFamily: F.sans700, fontSize: 12, letterSpacing: 0.4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  caption: {
    fontFamily: F.sans700,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
});

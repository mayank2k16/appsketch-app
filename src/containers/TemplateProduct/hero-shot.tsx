import { Image, type ImageLoadEventData } from 'expo-image';
import * as React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/**
 * A mobile app's hero: its screenshot and nothing else — no WebView, no
 * live render. The image fills the panel's width at its natural aspect
 * ratio, anchored top-left, and never shorter than the panel (a short
 * image is cropped by cover, so it always fills: no letterbox, no white
 * band). It sits in a vertical scroll view; the hero's pager pan is
 * horizontal-only, so up/down scrolls the screenshot and left/right still
 * pages. The flowing loader underneath shows until the image has decoded,
 * then the image fades in over ~200ms.
 */

const FADE_MS = 200;

type Props = {
  uri: string;
  size: { width: number; height: number };
  /** Centred page: scrollable. Neighbours just show the image. */
  interactive: boolean;
  dark: boolean;
  onShown: () => void;
};

export function HeroShot({ uri, size, interactive, dark, onShown }: Props) {
  const [ratio, setRatio] = React.useState(0);
  const shown = useSharedValue(0);
  const fade = useAnimatedStyle(() => ({ opacity: shown.value }));
  const onLoad = React.useCallback(
    (e: ImageLoadEventData) => {
      const { width, height } = e.source;
      if (width > 0 && height > 0) setRatio(height / width);
      shown.value = withTiming(1, {
        duration: FADE_MS,
        easing: Easing.out(Easing.quad),
      });
      onShown();
    },
    [shown, onShown]
  );
  // Full width at its natural aspect, but never shorter than the panel
  // (cover, top-left): no letterbox, no empty band under a short image.
  const h = Math.max(size.height, ratio ? size.width * ratio : 0);
  return (
    <Animated.View
      pointerEvents={interactive ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFill, fade]}
    >
      <ScrollView
        scrollEnabled={interactive}
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{ backgroundColor: dark ? '#0B0B0C' : '#FFFFFF' }}
      >
        <Image
          source={{ uri }}
          onLoad={onLoad}
          contentFit="cover"
          contentPosition="top left"
          cachePolicy="memory-disk"
          style={{ width: size.width, height: h }}
        />
      </ScrollView>
    </Animated.View>
  );
}

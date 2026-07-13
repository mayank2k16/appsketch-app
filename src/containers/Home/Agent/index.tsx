import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Animated, Easing, KeyboardAvoidingView, LayoutChangeEvent, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { F } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

import { CipherField } from './CipherField';
import {
  buildRoundedRectOrbit,
  ORBIT_DURATION_BLUE,
  ORBIT_DURATION_ORANGE,
  ORBIT_OUTSET,
  PROMPT_CARD_RADIUS,
  type Orbit,
  type Rect,
} from './orbits';
import { PromptBar } from './PromptBar';

export function AgentScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  const [fieldSize, setFieldSize] = React.useState<{ width: number; height: number } | null>(null);

  function handleLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setFieldSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }

  // The PromptBar reports its own measured position/size here (relative to
  // this same `field` container) so the orbits can trace ITS boundary
  // instead of an arbitrary point in the field.
  const [cardRect, setCardRect] = React.useState<Rect | null>(null);

  function handleCardLayout(rect: Rect) {
    setCardRect((prev) =>
      prev && prev.x === rect.x && prev.y === rect.y && prev.width === rect.width && prev.height === rect.height
        ? prev
        : rect
    );
  }

  // Owned here (not inside CipherField) so PromptBar's border can react to
  // the exact same live orbit clocks as the background glow.
  const orangeClock = React.useRef(new Animated.Value(0)).current;
  const blueClock = React.useRef(new Animated.Value(0)).current;

  const { orangeOrbit, blueOrbit } = React.useMemo<{ orangeOrbit: Orbit | null; blueOrbit: Orbit | null }>(() => {
    if (!cardRect || cardRect.width <= 0 || cardRect.height <= 0) {
      return { orangeOrbit: null, blueOrbit: null };
    }
    return {
      orangeOrbit: buildRoundedRectOrbit(cardRect, PROMPT_CARD_RADIUS, ORBIT_OUTSET, 0),
      blueOrbit: buildRoundedRectOrbit(cardRect, PROMPT_CARD_RADIUS, ORBIT_OUTSET, 0.5),
    };
  }, [cardRect]);

  React.useEffect(() => {
    if (!orangeOrbit || !blueOrbit) return;

    orangeClock.setValue(0);
    blueClock.setValue(0);

    const orangeLoop = Animated.loop(
      Animated.timing(orangeClock, {
        toValue: 1,
        duration: ORBIT_DURATION_ORANGE,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      })
    );
    const blueLoop = Animated.loop(
      Animated.timing(blueClock, {
        toValue: 1,
        duration: ORBIT_DURATION_BLUE,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      })
    );
    orangeLoop.start();
    blueLoop.start();
    return () => {
      orangeLoop.stop();
      blueLoop.stop();
    };
  }, [orangeOrbit, blueOrbit, orangeClock, blueClock]);

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />
      <View style={[s.field, { backgroundColor: t.bg }]} onLayout={handleLayout}>
        {fieldSize ? (
          <CipherField
            width={fieldSize.width}
            height={fieldSize.height}
            t={t}
            orangeOrbit={orangeOrbit}
            blueOrbit={blueOrbit}
            orangeClock={orangeClock}
            blueClock={blueClock}
          />
        ) : null}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.promptWrap}
          pointerEvents="box-none"
        >
          <PromptBar
            t={t}
            onCardLayout={handleCardLayout}
          />
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  title: {
    fontFamily: F.sans900,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  field: {
    flex: 1,
    paddingTop: 100,
    paddingBottom: 50,
  },
  promptWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
});

export default AgentScreen;

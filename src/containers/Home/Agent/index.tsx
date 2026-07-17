import { useIsFocused } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Animated, Easing, KeyboardAvoidingView, LayoutChangeEvent, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { F } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

import { CipherField } from './CipherField';
import { buildRoundedRectOrbit, ORBIT_DURATION, ORBIT_OUTSET, PROMPT_CARD_RADIUS, type Orbit, type Rect } from './orbits';
import { PromptBar } from './PromptBar';

export function AgentScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  // Bottom tabs keep every tab screen mounted, so without this the orbit
  // clock (JS-driven — see note below) would keep burning JS-thread time
  // even while the user is on a different tab, starving taps/navigation
  // elsewhere in the app. Only run while this screen is actually focused.
  const isFocused = useIsFocused();

  const fieldRef = React.useRef<View>(null);
  const [fieldSize, setFieldSize] = React.useState<{ width: number; height: number } | null>(null);

  function handleLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setFieldSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }

  // The PromptBar reports its own on-screen (window) rect; we measure `field`'s
  // own window position too and subtract, so `cardRect` ends up genuinely
  // relative to `field` regardless of how RN resolves padding vs. absolute
  // positioning internally — sidesteps that ambiguity entirely instead of
  // relying on nested onLayout values from different ancestors.
  const [cardRect, setCardRect] = React.useState<Rect | null>(null);

  function handleCardWindowRect(windowRect: Rect) {
    fieldRef.current?.measureInWindow((fx, fy) => {
      const rect: Rect = {
        x: windowRect.x - fx,
        y: windowRect.y - fy,
        width: windowRect.width,
        height: windowRect.height,
      };
      setCardRect((prev) =>
        prev && prev.x === rect.x && prev.y === rect.y && prev.width === rect.width && prev.height === rect.height
          ? prev
          : rect
      );
    });
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
    if (!orangeOrbit || !blueOrbit || !isFocused) return;

    orangeClock.setValue(0);
    blueClock.setValue(0);

    // JS-driven (not native): PromptBar feeds these clocks into an SVG
    // `strokeDashoffset`, a custom react-native-svg attribute the native
    // driver can't animate under Fabric — using it there hangs the native
    // render commit for the whole screen (seen as a black screen on device).
    const orangeLoop = Animated.loop(
      Animated.timing(orangeClock, {
        toValue: 1,
        duration: ORBIT_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      })
    );
    const blueLoop = Animated.loop(
      Animated.timing(blueClock, {
        toValue: 1,
        duration: ORBIT_DURATION,
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
  }, [orangeOrbit, blueOrbit, orangeClock, blueClock, isFocused]);

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />
      <View ref={fieldRef} style={[s.field, { backgroundColor: t.bg }]} onLayout={handleLayout}>
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
            onCardWindowRect={handleCardWindowRect}
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
    paddingTop: 0,
    paddingBottom: 0,
  },
  promptWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
});

export default AgentScreen;

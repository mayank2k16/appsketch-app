import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import ReAnimated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthSheet } from '@/components/AuthForm/AuthSheet';
import {
  COLLAGE_OVERHANG,
  WhiteCollage,
} from '@/components/splash/white-collage';
import { PressableScale } from '@/components/ui';
import { signInAsGuest } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';

import {
  useCollageClock,
  useRiseIn,
  useSpringIn,
  WELCOME_T,
  type WelcomeTheme,
  welcomeTheme,
} from './use-welcome-intro';
import { WelcomeActions } from './welcome-actions';

/** The app's own gradient icon. */
const ICON = require('../../../assets/splash-mark.png');
const WORD_H = 38;
const TAG_H = 22;

/** Icon, wordmark and the hero's line. The two lines rise out of clipped
 *  slots, so nothing fades. */
function Brand({ t }: { t: WelcomeTheme }) {
  const icon = useSpringIn(WELCOME_T.icon);
  const word = useRiseIn(WELCOME_T.word, WORD_H);
  const tag = useRiseIn(WELCOME_T.tagline, TAG_H);
  return (
    <View style={st.brand}>
      <ReAnimated.View style={[st.icon, icon]}>
        <Image source={ICON} style={st.iconImg} />
      </ReAnimated.View>
      <View style={[st.slot, { height: WORD_H }]}>
        <ReAnimated.Text style={[st.word, { color: t.ink }, word]}>
          appsketch<Text style={st.accent}>.</Text>ai
        </ReAnimated.Text>
      </View>
      <View style={[st.slot, { height: TAG_H, marginTop: 6 }]}>
        <ReAnimated.Text style={[st.tagline, { color: t.sub }, tag]}>
          Create unlimited beautiful apps.
        </ReAnimated.Text>
      </View>
    </View>
  );
}

/** Browse without an account (guest mode), like the login screen's
 *  "Continue as Guest". */
function SkipButton({ t, onPress }: { t: WelcomeTheme; onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const pop = useSpringIn(WELCOME_T.actions);
  return (
    <ReAnimated.View style={[st.skip, { top: insets.top + 8 }, pop]}>
      <PressableScale
        onPress={onPress}
        accessibilityLabel="Skip and browse as a guest"
        style={[
          st.skipPill,
          { backgroundColor: t.googleBg, borderColor: t.googleBorder },
        ]}
      >
        <Text style={[st.skipText, { color: t.ink }]}>Skip</Text>
      </PressableScale>
    </ReAnimated.View>
  );
}

/**
 * The signed-out front door, right after the splash: a tilted collage of real
 * template screens, the brand, and the sign-in stack (Google, phone or email).
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  const t = welcomeTheme(dark);
  const clock = useCollageClock();
  const [brandY, setBrandY] = React.useState<number | null>(null);
  const [sheet, setSheet] = React.useState(false);
  const goHome = React.useCallback(() => router.replace('/home'), [router]);
  const browseAsGuest = React.useCallback(() => {
    signInAsGuest();
    goHome();
  }, [goHome]);

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={t.statusBar}
      />
      {brandY !== null && (
        <WhiteCollage
          clock={clock}
          bottom={brandY - COLLAGE_OVERHANG}
          dark={dark}
        />
      )}
      {brandY !== null && <CollageFade top={brandY} bg={t.bg} />}
      <SkipButton t={t} onPress={browseAsGuest} />
      <View
        onLayout={(e) => setBrandY(e.nativeEvent.layout.y)}
        style={[st.bottom, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
      >
        <Brand t={t} />
        <WelcomeActions
          t={t}
          onPhoneEmail={() => setSheet(true)}
          onSuccess={goHome}
        />
      </View>
      <AuthSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        onSuccess={goHome}
      />
    </View>
  );
}

/** The outer columns' fourth screens hang below the collage: fade them out
 *  just above the brand, and keep everything under it plain paper. */
const FADE_H = 110;
function CollageFade({ top, bg }: { top: number; bg: string }) {
  return (
    <View pointerEvents="none" style={[st.fade, { top: top - FADE_H }]}>
      <LinearGradient colors={[`${bg}00`, bg]} style={{ height: FADE_H }} />
      <View style={[st.fill, { backgroundColor: bg }]} />
    </View>
  );
}

const st = StyleSheet.create({
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  fill: { flex: 1 },
  root: { flex: 1, overflow: 'hidden', justifyContent: 'flex-end' },
  bottom: { paddingHorizontal: 24 },
  brand: { alignItems: 'center', marginBottom: 22 },
  icon: { width: 48, height: 48, marginBottom: 14 },
  iconImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  slot: { overflow: 'hidden', alignSelf: 'stretch', alignItems: 'center' },
  word: {
    fontFamily: F.display900,
    fontSize: 32,
    lineHeight: WORD_H,
    letterSpacing: -1,
  },
  accent: { color: '#F2600C' },
  tagline: { fontFamily: F.sans500, fontSize: 15, lineHeight: TAG_H },
  skip: { position: 'absolute', right: 16 },
  skipPill: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { fontFamily: F.sans600, fontSize: 14 },
});

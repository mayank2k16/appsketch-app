// Import  global CSS file
import '../../global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useFonts } from 'expo-font';
import { Image as ExpoImage } from 'expo-image';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { APIProvider } from '@/api';
import { hydrateAuth } from '@/hooks/useAuth';
import { loadSelectedTheme } from '@/lib';
import { LOGIN_MONTAGE_IMAGES } from '@/lib/login-montage-images';
import { hydrateStudio } from '@/lib/store/studio-store';
import { TenantProvider } from '@/lib/tenant';
import { appTheme } from '@/lib/theme';
import { ToastContainer } from '@/lib/toast-container';
import { useThemeConfig } from '@/lib/use-theme-config';

export { ErrorBoundary } from 'expo-router';

// Show Fashion splash first, then redirect to login or home
export const unstable_settings = {
  initialRouteName: 'splash',
};

hydrateAuth();
loadSelectedTheme();
hydrateStudio();
// Fire at app-launch time (splash is shown for ~2.6s regardless), so the
// login montage's images are already decoded and disk/memory-cached by the
// time the login screen mounts — whichever path gets there (splash, sign-out,
// session expiry, pricing gate, etc.), not just the splash->login route.
ExpoImage.prefetch(LOGIN_MONTAGE_IMAGES, 'memory-disk');
// The in-memory image cache is unbounded by default and the template feed
// shows hundreds of screenshots: cap it (bytes of decoded pixels) so a deep
// scroll recycles old images instead of growing until iOS kills the app.
ExpoImage.configureCache({ maxMemoryCost: 160 * 1024 * 1024 });
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
// Set the animation options. This is optional.
// The in-app splash starts on the launch screen's exact picture, so the fade
// is only a guard against a first paint that lands a frame late.
SplashScreen.setOptions({
  duration: 200,
  fade: true,
});

function RootLayoutContent() {
  const { colorScheme } = useColorScheme();
  const screenBg = appTheme[colorScheme === 'dark' ? 'dark' : 'light'].bg;

  const [fontsLoaded] = useFonts({
    // ── Inter (replaces Proxima Nova app-wide, mapped via @/lib/fonts) ──
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  // Keep splash until fonts ready — avoids flash of unstyled text
  if (!fontsLoaded) return null;

  return (
    <Stack
      initialRouteName="splash"
      // React Navigation renders each screen on an opaque card that defaults to
      // the nav theme's `background` — which is WHITE here (`useThemeConfig`
      // returns LightTheme regardless of scheme). Screens paint their own dark
      // backgrounds, so during a push/replace, and for the frame or two before
      // a heavy screen's first paint, that white card was visible as a flash.
      // Pin the card to the same background the screens actually use.
      screenOptions={{ contentStyle: { backgroundColor: screenBg } }}
    >
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* The splash irises into the canvas the welcome screen starts on, so
          it arrives with no stack animation. */}
      <Stack.Screen
        name="welcome"
        options={{ headerShown: false, animation: 'none' }}
      />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="cms" options={{ headerShown: false }} />
      <Stack.Screen name="app-preview" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ headerShown: false }} />
      <Stack.Screen name="open" options={{ headerShown: false }} />
      <Stack.Screen name="about" options={{ headerShown: false }} />
      <Stack.Screen name="contact" options={{ headerShown: false }} />
      <Stack.Screen name="code-editor" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
      <Stack.Screen name="tnc" options={{ headerShown: false }} />
      {/* `/pricing` is a tab now; Marketplace is a pushed screen. */}
      <Stack.Screen name="marketplace" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="support" options={{ headerShown: false }} />
      <Stack.Screen name="support-chat" options={{ headerShown: false }} />
      <Stack.Screen name="category/[name]" options={{ headerShown: false }} />
      {/* The template product page draws its own grow-from-tile motion over
          a still-visible Home, so: no stack animation, transparent card. */}
      <Stack.Screen
        name="template/[key]"
        options={{
          headerShown: false,
          presentation: 'transparentModal',
          animation: 'none',
          gestureEnabled: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Providers>
      <RootLayoutContent />
    </Providers>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  return (
    <GestureHandlerRootView
      style={styles.container}
      className={theme.dark ? `dark` : undefined}
    >
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <APIProvider>
            <TenantProvider>
              <BottomSheetModalProvider>
                {children}
                <ToastContainer />
              </BottomSheetModalProvider>
            </TenantProvider>
          </APIProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

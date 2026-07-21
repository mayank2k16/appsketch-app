// Import  global CSS file
import '../../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { ToastContainer } from '@/lib/toast-container';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { APIProvider } from '@/api';
import { loadSelectedTheme, useAppStartup } from '@/lib';
import { hydrateAuth } from '@/hooks/useAuth';
import { hydrateStudio } from '@/lib/store/studio-store';
import { TenantProvider } from '@/lib/tenant';
import { useThemeConfig } from '@/lib/use-theme-config';

export { ErrorBoundary } from 'expo-router';

// Show Fashion splash first, then redirect to login or home
export const unstable_settings = {
  initialRouteName: 'splash',
};

hydrateAuth();
loadSelectedTheme();
hydrateStudio();
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

function RootLayoutContent() {
  useAppStartup();

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
    <Stack initialRouteName="splash">
      <Stack.Screen name="splash"     options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)"     options={{ headerShown: false }} />
      <Stack.Screen name="login"      options={{ headerShown: false }} />
      <Stack.Screen name="(app)"      options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="cms"        options={{ headerShown: false }} />
      <Stack.Screen name="app-preview" options={{ headerShown: false }} />
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

import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { DrawerMenu } from '@/components/drawer-menu';
import { Footer } from '@/components/footer';
import { HomeScreen } from '@/components/home';
import { Text } from '@/components/ui';
import { Settings as MenuIcon } from '@/components/ui/icons';
import { ConfigRenderer } from '@/lib/config-renderer/renderer';
import { useTenant } from '@/lib/tenant';
import type { ScreenConfig } from '@/types/config';

function ConfigHomeContent({
  screenConfig,
  onMenuPress,
  drawerVisible,
  onCloseDrawer,
}: {
  screenConfig: ScreenConfig;
  onMenuPress: () => void;
  drawerVisible: boolean;
  onCloseDrawer: () => void;
}) {
  const { tenantConfig } = useTenant();
  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 pb-4 pt-12">
        <Text className="text-2xl font-bold">{tenantConfig?.name}</Text>
        <Pressable onPress={onMenuPress}>
          <MenuIcon color="#111827" width={24} height={24} />
        </Pressable>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ConfigRenderer screenConfig={screenConfig} />
        <Footer />
      </ScrollView>
      <DrawerMenu visible={drawerVisible} onClose={onCloseDrawer} />
    </View>
  );
}

export default function StorefrontHome() {
  const { tenantConfig, isLoading } = useTenant();
  const [drawerVisible, setDrawerVisible] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && tenantConfig) SplashScreen.hideAsync().catch(() => {});
  }, [isLoading, tenantConfig]);

  if (isLoading || !tenantConfig) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Loading storefront...</Text>
      </View>
    );
  }

  const useApiHome = true;
  if (useApiHome) {
    return (
      <View className="flex-1 bg-white">
        <HomeScreen onMenuPress={() => setDrawerVisible(true)} />
        <DrawerMenu
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
        />
      </View>
    );
  }

  const homeScreen = tenantConfig.screens.find((s) => s.route === '/');
  if (!homeScreen) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">
          Home screen not found in configuration
        </Text>
      </View>
    );
  }

  return (
    <ConfigHomeContent
      screenConfig={homeScreen}
      onMenuPress={() => setDrawerVisible(true)}
      drawerVisible={drawerVisible}
      onCloseDrawer={() => setDrawerVisible(false)}
    />
  );
}

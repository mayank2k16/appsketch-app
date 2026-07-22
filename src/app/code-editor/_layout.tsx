import { Ionicons } from '@expo/vector-icons';
import type {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import type {
  ParamListBase,
  TabNavigationState,
} from '@react-navigation/native';
import {
  useLocalSearchParams,
  useRouter,
  withLayoutContext,
} from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppTypeKey } from '@/api/coder';
import { CodeEditorProvider } from '@/containers/CodeEditor/CodeEditorProvider';
import { type AppColors, useAppTheme } from '@/lib/theme';

const { Navigator } = createMaterialTopTabNavigator();

// Standard expo-router recipe for hosting a non-file-system navigator
// (here: React Navigation's material top tabs) inside a layout route.
const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

const TAB_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> =
{
  chat: 'chatbubble-ellipses-outline',
  code: 'code-slash-outline',
  preview: 'phone-portrait-outline',
  terminal: 'terminal-outline',
  data: 'server-outline',
  changes: 'git-branch-outline',
};

type TabBarProps = {
  state: TabNavigationState<ParamListBase>;
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: {
    emit: (e: { type: string; target: string; canPreventDefault: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
};

function CodeEditorTabBar({ state, descriptors, navigation }: TabBarProps) {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: t.codeEditorTabBarBg,
          borderColor: t.codeEditorBorder,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </TouchableOpacity>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const label = descriptors[route.key]?.options.title ?? route.name;
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented)
                navigation.navigate(route.name);
            };
            return (
              <Pressable key={route.key} onPress={onPress} style={styles.tab}>
                <Ionicons
                  name={TAB_ICONS[route.name] ?? 'ellipse-outline'}
                  size={16}
                  color={
                    isFocused ? t.codeEditorTabActiveText : t.codeEditorTabText
                  }
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused
                        ? t.codeEditorTabActiveText
                        : t.codeEditorTabText,
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

export default function CodeEditorLayout() {
  const { tenantId, tenantUid, appType, userPrompt, model, images } =
    useLocalSearchParams<{
      tenantId: string;
      tenantUid?: string;
      appType?: AppTypeKey;
      userPrompt?: string;
      model?: string;
      images?: string;
    }>();
  const { colorScheme } = useColorScheme();
  const t: AppColors = useAppTheme(colorScheme);

  const params = React.useMemo(
    () => ({
      tenantId: String(tenantId ?? ''),
      tenantUid,
      appType: (appType as AppTypeKey) ?? 'web',
      userPrompt,
      model,
      images: images ? (JSON.parse(images) as string[]) : undefined,
    }),
    [tenantId, tenantUid, appType, userPrompt, model, images]
  );

  if (!tenantId) return null;

  return (
    <CodeEditorProvider params={params}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={t.statusBar}
      />
      <MaterialTopTabs
        tabBar={(props) => <CodeEditorTabBar {...(props as TabBarProps)} />}
        screenOptions={{ lazy: true, swipeEnabled: true }}
      >
        <MaterialTopTabs.Screen name="chat" options={{ title: 'Chat' }} />
        <MaterialTopTabs.Screen name="code" options={{ title: 'Code' }} />
        <MaterialTopTabs.Screen name="preview" options={{ title: 'Preview' }} />
        <MaterialTopTabs.Screen
          name="terminal"
          options={{ title: 'Terminal' }}
        />
        <MaterialTopTabs.Screen name="data" options={{ title: 'Data' }} />
        <MaterialTopTabs.Screen name="changes" options={{ title: 'Changes' }} />
      </MaterialTopTabs>
    </CodeEditorProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 4,
  },
  tabScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: '100%',
    paddingHorizontal: 14,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: -1,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
  },
});

import { Ionicons } from '@expo/vector-icons';
import {
  useLocalSearchParams,
  useRouter,
  withLayoutContext,
} from 'expo-router';
// Expo Router 56+ vendors React Navigation; the standalone packages are no
// longer compatible with it.
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
  type MaterialTopTabNavigationEventMap,
  type MaterialTopTabNavigationOptions,
} from 'expo-router/js-top-tabs';
import type {
  ParamListBase,
  TabNavigationState,
} from 'expo-router/react-navigation';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppTypeKey } from '@/api/coder';
import { PressableScale } from '@/components/ui';
import {
  CodeEditorProvider,
  useCodeEditor,
} from '@/containers/CodeEditor/CodeEditorProvider';
import { haptic } from '@/lib/haptics';
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

function TabButton({
  name,
  label,
  isFocused,
  onPress,
}: {
  name: string;
  label: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const color = isFocused ? t.codeEditorTabActiveText : t.codeEditorTabText;
  return (
    <PressableScale
      onPress={onPress}
      // A switch to another tab ticks from the bar's index effect (it covers
      // swipes too); only a re-press of the open tab taps here.
      haptic={isFocused}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
    >
      <Ionicons
        name={TAB_ICONS[name] ?? 'ellipse-outline'}
        size={16}
        color={color}
      />
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </PressableScale>
  );
}

function CodeEditorTabBar({ state, descriptors, navigation }: TabBarProps) {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Selection tick on every real tab change, tapped or swiped.
  const lastIndex = React.useRef(state.index);
  React.useEffect(() => {
    if (lastIndex.current !== state.index) haptic.select();
    lastIndex.current = state.index;
  }, [state.index]);

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
        <PressableScale
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backBtn}
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </PressableScale>
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
              <TabButton
                key={route.key}
                name={route.name}
                label={label}
                isFocused={isFocused}
                onPress={onPress}
              />
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

/** Rendered inside `CodeEditorProvider`, so it's the one that can actually
 * read `previewMode` back out of it — the layout function below only sets
 * the provider up, it isn't inside its own context. Swipe is locked while
 * any Preview edit tool is active: a horizontal drag meant for drawing an
 * annotation or dragging a selection handle would otherwise also flip the
 * page to the next tab. */
function CodeEditorTabs() {
  const { previewMode } = useCodeEditor();
  return (
    <MaterialTopTabs
      tabBar={(props: MaterialTopTabBarProps) => (
        <CodeEditorTabBar {...(props as TabBarProps)} />
      )}
      screenOptions={{ lazy: true, swipeEnabled: previewMode === null }}
    >
      <MaterialTopTabs.Screen name="chat" options={{ title: 'Chat' }} />
      <MaterialTopTabs.Screen name="code" options={{ title: 'Code' }} />
      <MaterialTopTabs.Screen name="preview" options={{ title: 'Preview' }} />
      <MaterialTopTabs.Screen name="terminal" options={{ title: 'Terminal' }} />
      <MaterialTopTabs.Screen name="data" options={{ title: 'Data' }} />
      <MaterialTopTabs.Screen name="changes" options={{ title: 'Changes' }} />
    </MaterialTopTabs>
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
      <CodeEditorTabs />
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

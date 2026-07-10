import { Tabs } from 'expo-router';
import * as React from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTenant } from '@/lib/tenant';
import { F } from '@/lib/fonts';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BLACK   = '#0C0C0C';
const RED     = '#C41230';
const WHITE   = '#FFFFFF';
const DIM     = 'rgba(255,255,255,0.50)';
const SUBTLE  = 'rgba(255,255,255,0.10)';

// ─── Tab config ───────────────────────────────────────────────────────────────
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: {
  name: string;
  label: string;
  icon: IoniconName;
  iconActive: IoniconName;
}[] = [
  { name: 'index',    label: 'Home',    icon: 'home-outline',    iconActive: 'home'    },
  { name: 'studio',  label: 'Studio', icon: 'compass-outline', iconActive: 'compass' },
  { name: 'wishlist', label: 'Favourites',icon: 'heart-outline',   iconActive: 'heart'   },
  { name: 'profile',  label: 'Profile', icon: 'person-outline',  iconActive: 'person'  },
];

// ─── Single tab item (hooks-safe, extracted from map) ─────────────────────────
function TabItem({
  route,
  isFocused,
  onPress,
}: {
  route: { name: string; key: string };
  isFocused: boolean;
  onPress: () => void;
}) {
  const conf = TAB_CONFIG.find(t => t.name === route.name) ?? TAB_CONFIG[0];

  // Icon scale spring
  const scale = React.useRef(new Animated.Value(isFocused ? 1.12 : 1)).current;
  // Pill opacity fade
  const pillOpacity = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  // Active dot scale
  const dotScale = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isFocused ? 1.15 : 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 220,
      }),
      Animated.timing(pillOpacity, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(dotScale, {
        toValue: isFocused ? 1 : 0,
        useNativeDriver: true,
        damping: 14,
        stiffness: 280,
      }),
    ]).start();
  }, [isFocused]);

  return (
    <Pressable
      onPress={onPress}
      style={tb.tabItem}
      hitSlop={6}
    >
      {/* Orange pill glow behind icon */}
      <Animated.View style={[tb.pill, { opacity: pillOpacity }]} />

      {/* Icon */}
      <Animated.View style={{ transform: [{ scale }], zIndex: 1 }}>
        <Ionicons
          name={isFocused ? conf.iconActive : conf.icon}
          size={22}
          color={isFocused ? RED : WHITE}
        />
      </Animated.View>

      {/* Label */}
      <TextInput
        editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
        value={conf.label}
        style={[tb.label, { color: isFocused ? RED : WHITE }]}
      />

      {/* Bottom active dot */}
      <Animated.View style={[tb.dot, { transform: [{ scale: dotScale }] }]} />
    </Pressable>
  );
}

// ─── Custom tab bar ───────────────────────────────────────────────────────────
function PremiumTabBar({
  state,
  navigation,
}: {
  state: any;
  navigation: any;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={tb.root}>

      {/* Tab row */}
      <View style={tb.row}>
        {state.routes.map((route: any, index: number) => (
          <TabItem
            key={route.key}
            route={route}
            isFocused={state.index === index}
            onPress={() => {
              if (state.index !== index) {
                navigation.navigate(route.name);
              }
            }}
          />
        ))}
      </View>

      {/* Safe-area spacer sits BELOW the row so it doesn't shift content up */}
      <View style={{ height: Math.max(insets.bottom, 2) }} />
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const { isLoading } = useTenant();

  if (isLoading) return null;

  return (
    <Tabs
      tabBar={props => <PremiumTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home'    }} />
      <Tabs.Screen name="studio"  options={{ title: 'Studio' }} />
      <Tabs.Screen name="wishlist" options={{ title: 'Favourites'}} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile' }} />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const tb = StyleSheet.create({
  root: {
    backgroundColor: BLACK,
    borderTopWidth: 2,
    borderTopColor: RED,
    ...Platform.select({
      ios: {
        shadowColor: RED,
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: { elevation: 20 },
    }),
  },

  // ── Tabs row ─────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },

  // ── Each tab item ─────────────────────────────────────────────────────────────
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
    position: 'relative',
  },

  // Orange glow pill behind icon
  pill: {
    position: 'absolute',
    top: 1,
    width: 44,
    height: 30,
    borderRadius: 15,
    backgroundColor: `${RED}22`,
    borderWidth: 1,
    borderColor: `${RED}55`,
  },

  // Tab label
  label: {
    fontSize: 9,
    fontFamily: F.sans700,
    letterSpacing: 0.6,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    height: 12,
    textAlign: 'center',
  },

  // Small orange dot at the very bottom of active tab
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: RED,
    marginTop: 0,
    ...Platform.select({
      ios: {
        shadowColor: RED,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 4,
      },
    }),
  },
});

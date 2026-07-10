import * as React from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useCmsTheme } from './theme';
import type { CmsTab, CmsTabKey } from './tabs';

// Same slide-in-from-right recipe as `src/components/drawer-menu.tsx` (Modal +
// Animated, dimming backdrop, tap-outside-to-close, staggered item entrance)
// — that component's content is storefront-specific (hardcoded routes), so
// this is a generic re-implementation driven by the CMS tab registry instead,
// themed with CMS colors rather than the app's storefront brand colors.
const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_W = Math.min(SCREEN_W * 0.75, 320);

type CmsDrawerProps = {
  visible: boolean;
  onClose: () => void;
  tabs: CmsTab[];
  activeTab: CmsTabKey;
  onSelectTab: (key: CmsTabKey) => void;
};

export function CmsDrawer({ visible, onClose, tabs, activeTab, onSelectTab }: CmsDrawerProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useCmsTheme();

  const translateX = React.useRef(new Animated.Value(DRAWER_W)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  const itemAnims = React.useRef(tabs.map(() => new Animated.Value(0))).current;
  const [modalVisible, setModalVisible] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setModalVisible(true);
      translateX.setValue(DRAWER_W);
      overlayOpacity.setValue(0);
      itemAnims.forEach((a) => a.setValue(0));

      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.stagger(
          50,
          itemAnims.map((a) => Animated.spring(a, { toValue: 1, tension: 95, friction: 13, useNativeDriver: true }))
        ),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: DRAWER_W, duration: 180, useNativeDriver: true }),
      ]).start(() => setModalVisible(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.55)', opacity: overlayOpacity }]} pointerEvents="none" />
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

      <Animated.View
        style={[
          st.drawer,
          { backgroundColor: colors.sidebarBg, paddingTop: insets.top + 16, transform: [{ translateX }] },
        ]}
      >
        <Text style={[st.brand, { color: colors.sidebarText }]}>CMS</Text>

        <View style={{ marginTop: 16 }}>
          {tabs.map((tab, idx) => {
            const active = tab.key === activeTab;
            const anim = itemAnims[idx];
            return (
              <Animated.View
                key={tab.key}
                style={{
                  opacity: anim,
                  transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
                }}
              >
                <Pressable
                  onPress={() => onSelectTab(tab.key)}
                  style={[st.row, active && { backgroundColor: colors.sidebarActiveBg }]}
                >
                  <Ionicons name={tab.icon} size={18} color={active ? colors.accent : colors.sidebarText} />
                  <Text style={[st.rowLabel, { color: active ? colors.accent : colors.sidebarText }]}>
                    {tab.label}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
    </Modal>
  );
}

const st = StyleSheet.create({
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: DRAWER_W,
    paddingHorizontal: 16,
  },
  brand: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});

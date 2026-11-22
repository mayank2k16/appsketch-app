import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { F } from '@/lib/fonts';

/** Floats over the bottom of the chat while the user has scrolled up:
 *  tap to go back to the latest and resume auto-scroll. */
export function JumpToLatest({ onPress }: { onPress: () => void }) {
  return (
    <View pointerEvents="box-none" style={s.wrap}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        accessibilityLabel="Jump to latest"
        style={s.pill}
      >
        <Ionicons name="arrow-down" size={14} color="#FFFFFF" />
        <Text style={s.text}>Latest</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: -44,
    height: 44,
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(17,17,19,0.88)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  text: { fontFamily: F.sans700, fontSize: 13, color: '#FFFFFF' },
});

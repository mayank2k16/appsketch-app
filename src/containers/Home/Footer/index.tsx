import { Image as ExpoImage } from 'expo-image';
import * as React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

// 16:6 (width:height) — matches the source asset's own 2048×768 ratio.
const ASPECT_RATIO = 16 / 6;

const IMAGE = require('../../../../assets/home/footer-banner.png');

// Final, full-bleed banner closing out the Home scroll — no heading, no
// copy, same "just the artwork" treatment as IntegrationsCatalogSection.
export function FooterSection() {
  return (
    <View style={s.section}>
      <ExpoImage
        source={IMAGE}
        style={s.image}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
      />
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    width: '100%',
  },
  image: {
    width: SCREEN_W,
    aspectRatio: ASPECT_RATIO,
  },
});

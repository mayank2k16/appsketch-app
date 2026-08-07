import { Image as ExpoImage } from 'expo-image';
import * as React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

// 1:2 (width:height) — matches the source asset's own 887×1774 ratio, so
// this is a plain cover-fit rather than a crop.
const ASPECT_RATIO = 887 / 1774;

const IMAGE = require('../../../../assets/home/integrations-catalog.png');

// Full-bleed showcase image between WhatsInside and Shipped — no heading, no
// copy, just the artwork edge to edge at a fixed 40:70 ratio.
export function IntegrationsCatalogSection() {
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

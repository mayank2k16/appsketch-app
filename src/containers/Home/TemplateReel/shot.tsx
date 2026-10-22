import { Image as ExpoImage } from 'expo-image';
import * as React from 'react';
import { StyleSheet } from 'react-native';

/** A template screenshot: the API's small thumbnail, cover-fit and top
 *  aligned, cached to memory+disk. Nothing is ever laid over it (no scrim,
 *  no fade, no opacity) — the solid `bg` shows while it loads. */
export const Shot = React.memo(function Shot({
  uri,
  bg = '#F4F4F2',
}: {
  uri: string;
  bg?: string;
}) {
  return (
    <ExpoImage
      source={{ uri }}
      recyclingKey={uri}
      style={[s.shot, { backgroundColor: bg }]}
      contentFit="cover"
      contentPosition="top"
      cachePolicy="memory-disk"
      transition={150}
    />
  );
});

const s = StyleSheet.create({
  shot: { flex: 1 },
});

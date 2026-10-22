import { Image as ExpoImage } from 'expo-image';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

/** Width / height of the API's screenshots: phones are 780×1688, sites
 *  1280×800 or 1920×1200. Close is enough — see `ShotFit`. */
export const SHOT_RATIO = { app: 780 / 1688, web: 1.6 } as const;

/** The box a screenshot fills, and the screenshot's width / height. */
export type ShotFit = { w: number; h: number; ratio: number };

/** The size of a `ratio` image covering a `w`×`h` box from its top-left. */
function coverOf({ w, h, ratio }: ShotFit) {
  return w / h > ratio
    ? { width: w, height: w / ratio }
    : { width: h * ratio, height: h };
}

/**
 * A template screenshot, cover-fit and anchored at the top-left corner (only
 * the bottom/right is ever trimmed), cached to memory+disk. Nothing is ever
 * laid over it (no scrim, no fade, no opacity) — the solid `bg` shows while it
 * loads.
 *
 * Pass `fit` wherever the box is known (every feed tile does). The image view
 * is then sized to the screenshot's own cover size — so "fit" and "cover" are
 * the same box — and decoded straight to that pixel size in the background
 * (`enforceEarlyResizing`). Without it, expo-image keeps the full screenshot
 * (a 780×1688 phone shot is 5 MB decoded) in its memory cache and redraws it
 * smaller ON THE MAIN THREAD every time a tile shows it, cache hit or not —
 * the hitches that grew the deeper the feed was scrolled.
 */
export const Shot = React.memo(function Shot({
  uri,
  bg = '#F4F4F2',
  fit,
}: {
  uri: string;
  bg?: string;
  fit?: ShotFit;
}) {
  const w = fit?.w ?? 0;
  const h = fit?.h ?? 0;
  const ratio = fit?.ratio ?? 0;
  const size = React.useMemo(
    () => (w > 0 && h > 0 && ratio > 0 ? coverOf({ w, h, ratio }) : null),
    [w, h, ratio]
  );
  if (!size) {
    return (
      <ExpoImage
        source={{ uri }}
        recyclingKey={uri}
        style={[s.shot, { backgroundColor: bg }]}
        contentFit="cover"
        contentPosition="top left"
        cachePolicy="memory-disk"
        transition={150}
      />
    );
  }
  return (
    <View style={[s.shot, s.clip, { backgroundColor: bg }]}>
      <ExpoImage
        source={{ uri }}
        recyclingKey={uri}
        style={size}
        contentFit="cover"
        contentPosition="top left"
        cachePolicy="memory-disk"
        enforceEarlyResizing
        transition={150}
      />
    </View>
  );
});

const s = StyleSheet.create({
  shot: { flex: 1 },
  clip: { overflow: 'hidden' },
});

import { Image as ExpoImage } from 'expo-image';
import { useIsFocused } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import type { MarketTemplate } from '@/api/templates';
import { useMarketTemplates } from '@/api/templates';
import { useTemplatePreview } from '@/containers/Marketplace/use-template-preview';
import { haptic } from '@/lib/haptics';

import { homeTheme } from '../theme/HomeTheme';
import { buildColumns, pickTemplates, thumbOf, W } from './layout';
import { ReelHeader } from './reel-header';
import { Strip, StripSkeleton } from './strip';

/**
 * The template reel: the web /templates masonry turned sideways — a
 * full-bleed 3-row grid of template cards (small, tall and big 2×2 tiles
 * packed into columns) that drifts left forever as ONE strip. Cards are flat
 * (hairline, no shadow) with a caption row: title + colour-coded category
 * pills. Websites fill their media area; mobile apps stand in the
 * appsketch.ai landing-page iPhone (silver in white, graphite in dark). The
 * strip pauses under a finger and can be dragged (soft haptic); a tap opens
 * the template exactly as the Market card's Preview / Try app does.
 *
 * Transparent container (the drifting pastel page shows through) and no
 * overlays of any kind on the screenshots.
 *
 * Performance: the column layout is built once per data set; the strip is
 * ONE translateX shared value advanced by a `useFrameCallback` on the UI
 * thread (stopped while Home is unfocused or backgrounded). ≤12 columns,
 * rendered twice for the seamless loop; cards memoised; phone styles built
 * once per width.
 */

/** True while Home is on screen and the app is in the foreground. */
function useRunning() {
  const focused = useIsFocused();
  const [foreground, setForeground] = React.useState(
    AppState.currentState === 'active'
  );
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (st) =>
      setForeground(st === 'active')
    );
    return () => sub.remove();
  }, []);
  return focused && foreground;
}

/** The reel's templates and columns, from the Market's own cached query. */
function useReelColumns() {
  // The Market tab's own Websites and Apps queries (shared cache). Not its
  // { kind: 'all' } first page: that is the 12 newest published apps, which
  // can be almost all mobile — it once held a single website, so every
  // website slot showed the same template.
  const web = useMarketTemplates({ kind: 'websites' });
  const apps = useMarketTemplates({ kind: 'apps' });
  const templates = React.useMemo(
    () => pickTemplates(web.data?.pages, apps.data?.pages),
    [web.data, apps.data]
  );
  const columns = React.useMemo(() => buildColumns(templates), [templates]);

  // Warm the first screenful's thumbnails as soon as the data lands.
  React.useEffect(() => {
    const urls = columns
      .slice(0, 4)
      .flatMap((c) => c.items.flat())
      .map((x) => thumbOf(x.template));
    if (urls.length) ExpoImage.prefetch(urls, 'memory-disk').catch(() => {});
  }, [columns]);
  return {
    columns,
    isLoading: web.isLoading || apps.isLoading,
  };
}

/** Tap-vs-drag: a drag that ends on a tile is not a tap. */
function useOpen() {
  const preview = useTemplatePreview();
  const lastDrag = React.useRef(0);
  const onDrag = React.useCallback(() => {
    lastDrag.current = Date.now();
    haptic.soft();
  }, []);
  const onOpen = React.useCallback(
    (template: MarketTemplate) => {
      if (Date.now() - lastDrag.current < 300) return;
      preview(template);
    },
    [preview]
  );
  return { onOpen, onDrag };
}

export function TemplateReel() {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  const t = homeTheme[dark ? 'dark' : 'light'];
  const running = useRunning();
  const { columns, isLoading } = useReelColumns();
  const { onOpen, onDrag } = useOpen();

  if (!isLoading && columns.length === 0) return null;

  return (
    <View style={s.reel}>
      <ReelHeader t={t} />
      {columns.length === 0 ? (
        <StripSkeleton dark={dark} />
      ) : (
        <Strip
          columns={columns}
          dark={dark}
          running={running}
          onOpen={onOpen}
          onDrag={onDrag}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  // Full bleed and transparent: no side padding, no background band.
  reel: { width: W, gap: 6, paddingTop: 0, paddingBottom: 8 },
});

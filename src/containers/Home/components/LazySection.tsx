import * as React from 'react';
import { InteractionManager, View } from 'react-native';

/**
 * Defers mounting a Home section until the screen is interactive.
 *
 * Home is one long ScrollView, so every section below the fold used to mount,
 * lay out, fetch its remote images and start its animations during the very
 * first render — before the user could see or touch anything. That is what
 * made the screen feel slow to arrive and janky on the first flick.
 *
 * Each section instead reserves its height with an empty placeholder and mounts
 * in its own frame, in `order`. Reserving the height up front matters: the
 * scroll content keeps a stable size, so nothing jumps under the user's thumb
 * as sections fill in, and `scrollTo`/momentum stay accurate.
 *
 * `minHeight` only needs to be in the right ballpark — once the real content
 * mounts it takes over the layout.
 */
export function LazySection({
  minHeight,
  order = 0,
  children,
}: {
  minHeight: number;
  /** Mount priority; lower mounts sooner. Staggered so no single frame has to
   *  commit every remaining section at once. */
  order?: number;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    // Waits for the first interactions/animations to settle, then staggers.
    const task = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(() => {
        if (!cancelled) setMounted(true);
      }, order * 120);
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      task.cancel();
    };
  }, [order]);

  if (!mounted) return <View style={{ height: minHeight }} />;

  return <>{children}</>;
}

import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import type { MarketTemplate } from '@/api/templates';
import { thumbOf } from '@/containers/Home/TemplateReel/layout';
import { F } from '@/lib/fonts';

import { DotSurface } from './dot-loader';
import { type Geometry, HERO_RADIUS, PEEK } from './geometry';
import { HeroShot } from './hero-shot';
import { LiveLoader, paletteOf } from './live-loader';
import { LivePreview } from './live-preview';
import { type Device, isAppShot, liveUrlOf } from './live-url';
import type { ProductMotion } from './use-product-transition';

/**
 * One template's hero in the pager, edge to edge in a panel with big
 * continuous corners, no device frame. A website shows its live site; an app
 * shows only its screenshot (hero-shot.tsx), never a live render.
 * A website's panel rests on the orange dot ripple (dot-loader.tsx) until
 * its site has painted, then the site crossfades in over it
 * (live-preview.tsx); an app's screenshot fades in over the flowing
 * loader (live-loader.tsx). The
 * centred page mounts its WebView at once (`load: 'on'`, interactive); its
 * neighbours preload theirs hidden and paused (`'warm'`) once the centred
 * site is up, so a swipe lands on a site that is already rendered.
 *
 * Its offset, scale and motion blur follow the pager position `x`: off
 * centre it slides by one stride less a PEEK, so exactly 4pt of the next /
 * previous template shows at each screen edge — its orange border and a
 * strip of its loader colour, a deck edge — and shrinks a little about its
 * NEAR edge. No motion blur: a card is always sharp, mid-swipe included
 * (the blur read as a smeared, low-res page and cost a live effect layer
 * per mounted card).
 */

type Props = {
  template: MarketTemplate;
  i: number;
  x: SharedValue<number>;
  g: Geometry;
  m: ProductMotion;
  /** The page the tile opened: hidden until the flying copy lands. */
  origin: boolean;
  /** 'on' = centred: live site mounted and interactive; 'warm' = a
   *  neighbour preloading hidden; 'off' = no WebView. */
  load: 'on' | 'warm' | 'off';
  active: boolean;
  dark: boolean;
  edge: string;
  device: Device;
  onLive: (key: string, on: boolean) => void;
};

function useHeroStyles(p: Props) {
  const { i, x, g, m, origin } = p;
  const w = g.hero.width;
  const card = useAnimatedStyle(() => {
    const d = i - x.value;
    const a = Math.min(1, Math.abs(d));
    const scale = 1 - a * 0.05;
    const near = Math.sign(d) * (1 - scale) * (w / 2);
    const peek = Math.sign(d) * a * PEEK;
    return {
      // The tile's own page waits for the flying copy; the others fade in
      // with the page (on a solo open/close the whole band fades instead).
      opacity: m.solo.value ? 1 : origin ? m.landed.value : m.reveal.value,
      transform: [{ translateX: d * g.stride - near - peek }, { scale }],
    };
  });
  // At rest a neighbour shows only a 4pt sliver at the screen edge: its
  // orange border plus a solid strip of its loader colour, like the edge of
  // the next card in a deck. The fill fades out as it comes to the centre.
  const tint = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(i - x.value), [0.6, 1], [0, 1], 'clamp'),
  }));
  return { card, tint };
}

function NoLive({ dark }: { dark: boolean }) {
  return (
    <Text style={[s.none, { color: dark ? '#E4E4E7' : '#3F3F46' }]}>
      No live preview for this template
    </Text>
  );
}

/** What fills the panel over the loader: the app's screenshot, the live
 *  site, or a "no preview" line. */
type BodyProps = Omit<Props, 'onLive'> & { onLive: (on: boolean) => void };

function HeroBody(p: BodyProps) {
  const hero = heroRectOf(p.template, p.g);
  // The panel's INSIDE (its border clips the content), so a Desktop site
  // scales its full 1280px into what is actually visible.
  const size = React.useMemo(
    () => ({
      width: hero.width - BORDER * 2,
      height: hero.height - BORDER * 2,
    }),
    [hero.width, hero.height]
  );
  const { onLive } = p;
  const onShown = React.useCallback(() => onLive(true), [onLive]);
  const on = p.load === 'on';
  const shot = isAppShot(p.template) ? thumbOf(p.template) : '';
  if (shot) {
    return (
      <HeroShot
        uri={shot}
        size={size}
        interactive={on}
        dark={p.dark}
        onShown={onShown}
      />
    );
  }
  const url = liveUrlOf(p.template);
  if (!url) return <NoLive dark={p.dark} />;
  if (p.load === 'off') return null;
  return (
    <LivePreview
      url={url}
      size={size}
      device={p.device}
      active={on && p.active}
      interactive={on}
      dark={p.dark}
      onLive={onLive}
    />
  );
}

/** An app's hero runs down past the (absent) pills row. */
export const heroRectOf = (t: MarketTemplate, g: Geometry) =>
  isAppShot(t) ? g.heroTall : g.hero;

export const HeroCard = React.memo(function HeroCard(p: Props) {
  const st = useHeroStyles(p);
  const hero = heroRectOf(p.template, p.g);
  const { onLive: report, template } = p;
  // Once the site (or screenshot) is up, the loader under it stops
  // animating: it is covered, and would cost frames while the site scrolls.
  const [live, setLive] = React.useState(false);
  const onLive = React.useCallback(
    (on: boolean) => {
      setLive(on);
      report(template.key, on);
    },
    [report, template.key]
  );
  const on = p.load === 'on';
  const spin = on && p.active && !live;
  return (
    <Animated.View
      pointerEvents={on ? 'box-none' : 'none'}
      style={[
        s.card,
        { left: hero.x, top: hero.y, width: hero.width, height: hero.height },
        { borderColor: p.edge },
        st.card,
      ]}
    >
      {liveUrlOf(template) ? (
        <DotSurface dark={p.dark} animate={spin} />
      ) : (
        <LiveLoader seed={template.key} dark={p.dark} animate={spin} />
      )}
      <HeroBody {...p} onLive={onLive} />
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: paletteOf(template.key)[0] },
          st.tint,
        ]}
      />
    </Animated.View>
  );
});

const BORDER = 1.5;

const s = StyleSheet.create({
  card: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: HERO_RADIUS,
    borderCurve: 'continuous',
    borderWidth: BORDER,
  },
  none: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    textAlign: 'center',
    fontFamily: F.sans600,
    fontSize: 13,
  },
});

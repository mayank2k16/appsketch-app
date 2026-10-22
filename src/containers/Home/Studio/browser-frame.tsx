import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { MarketTemplate } from '@/api/templates';
import { F } from '@/lib/fonts';

import { buildUrl } from '../../TemplateProduct/live-url';
import { Shot, SHOT_RATIO } from '../TemplateReel/shot';
import { BAR_H, CARD_EDGE_W, cardEdge } from './geometry';
import { useIsLive } from './live-budget';
import { LiveSite } from './live-site';

/**
 * A website in a browser sheet: a slim bar (three dots, a LIVE tag once the
 * real build is playing) over the page. The page is the 16:10 screenshot,
 * top-aligned; when the live budget hands this tile a slot, the real build
 * mounts on top of it and fades in, so the screenshot is always underneath.
 */

type Props = {
  template: MarketTemplate;
  width: number;
  pageH: number;
  dark: boolean;
  /** Sits straight on the page (not on a stage): give it the card edge. */
  onPage?: boolean;
  /** On the black showcase: a silver browser frame. */
  silver?: boolean;
};

function frameEdge(o: { dark: boolean; onPage: boolean; silver: boolean }) {
  if (o.silver) return 'rgba(255,255,255,0.55)';
  if (o.onPage) return cardEdge(o.dark);
  return o.dark ? 'rgba(255,255,255,0.12)' : '#E2E2DE';
}

const LiveTag = React.memo(function LiveTag() {
  return (
    <View style={s.live}>
      <View style={s.liveDot} />
      <Text style={s.liveText} allowFontScaling={false}>
        LIVE
      </Text>
    </View>
  );
});

export const BrowserFrame = React.memo(function BrowserFrame({
  template,
  width,
  pageH,
  dark,
  onPage = false,
  silver = false,
}: Props) {
  const url = buildUrl(
    template.kind === 'code' ? template.preview_url : undefined
  );
  const live = useIsLive(template.key) && !!url;
  const [playing, setPlaying] = React.useState(false);
  const thumb =
    template.kind === 'code'
      ? template.thumbnail_url
      : template.thumbnail_image;
  // The page fills the sheet INSIDE its border, so the site's full width
  // shows (a border must never clip its right edge).
  const bw = onPage ? CARD_EDGE_W : StyleSheet.hairlineWidth;
  const inner = width - bw * 2;
  const fit = React.useMemo(
    () => ({ w: inner, h: pageH, ratio: SHOT_RATIO.web }),
    [inner, pageH]
  );
  return (
    <View
      style={[
        s.sheet,
        { width, borderColor: frameEdge({ dark, onPage, silver }) },
        onPage && { borderWidth: bw },
        silver && s.silver,
      ]}
    >
      <View style={[s.bar, silver && s.silverBar]}>
        <View style={[s.dot, { backgroundColor: '#FF6159' }]} />
        <View style={[s.dot, { backgroundColor: '#FFBD2E' }]} />
        <View style={[s.dot, { backgroundColor: '#28C941' }]} />
        {live && playing ? <LiveTag /> : null}
      </View>
      <View style={{ width: inner, height: pageH }}>
        <Shot uri={thumb || ''} fit={fit} />
        {live && url ? (
          <LiveSite
            url={url}
            width={inner}
            height={pageH}
            onLive={setPlaying}
          />
        ) : null}
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  sheet: {
    overflow: 'hidden',
    borderRadius: 8,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#FFFFFF',
  },
  bar: {
    height: BAR_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
  },
  silver: { backgroundColor: '#D9D9DE' },
  silverBar: { backgroundColor: '#D9D9DE' },
  dot: { width: 5, height: 5, borderRadius: 3 },
  live: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  liveDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#12A150' },
  liveText: {
    fontFamily: F.sans700,
    fontSize: 7,
    letterSpacing: 0.4,
    color: '#0B0B0C',
  },
});

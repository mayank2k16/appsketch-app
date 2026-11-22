import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { MarketTemplate } from '@/api/templates';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import { thumbOf, titleOf } from '../TemplateReel/layout';
import { PhoneFrame } from '../TemplateReel/phone-frame';
import { BrowserFrame } from './browser-frame';
import {
  CARD_EDGE_W,
  COL_W,
  PHONE_W,
  RADIUS,
  SPAN2,
  SPAN3,
  TITLE_BAR_H,
  WEB_RATIO,
} from './geometry';
import { stageOf, useOpenTemplate, useStudioActions } from './studio-context';
import { Chips, Heart, metaTone, TileFoot } from './tile-meta';

/**
 * The studio's template tiles. Phones fill their column in the silver frame
 * with the name below; websites sit as a browser sheet on a luminous pastel
 * stage (the big ones play the real build live); small sites are a square
 * crop of the screenshot's top. Square-ish 10px corners, hairlines, no
 * shadows. A tap measures the media and opens the product page from it.
 */

const ink = (dark: boolean) => (dark ? '#F4F4F5' : '#0B0B0C');

type TileProps = { template: MarketTemplate };

/** A phone filling one column, its name underneath. */
export const PhoneTile = React.memo(function PhoneTile({
  template,
  onBlack = false,
}: TileProps & { onBlack?: boolean }) {
  const { dark } = useStudioActions();
  const backdrop = React.useMemo(
    () => stageOf(template.key, dark),
    [template.key, dark]
  );
  const { ref, onPress } = useOpenTemplate(template, 'phone', backdrop);
  return (
    <PressableScale
      scaleTo={0.97}
      haptic="tap"
      onPress={onPress}
      accessibilityLabel={`Open ${titleOf(template)}`}
      style={s.phone}
    >
      <View ref={ref} collapsable={false}>
        <PhoneFrame
          uri={thumbOf(template)}
          w={PHONE_W}
          dark={dark && !onBlack}
        />
      </View>
      <TileFoot
        template={template}
        tone={metaTone(dark || onBlack)}
        width={PHONE_W}
      />
    </PressableScale>
  );
});

/** The showcase's stage: graphite on black, lit from the top left. */
const BLACK_STAGE = ['#1C1C1F', '#111113', '#0A0A0B'] as const;

function Stage({
  seed,
  dark,
  onBlack = false,
}: {
  seed: string;
  dark: boolean;
  onBlack?: boolean;
}) {
  return (
    <LinearGradient
      colors={onBlack ? BLACK_STAGE : stageOf(seed, dark)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

/** The template's description in whatever room the title and chips leave
 *  above the sheet: as many whole lines as fit (measured once), never a
 *  clipped half-line, nothing at all if under one line fits. */
const BLURB_LINE = 15;

function Blurb({ text, dark }: { text?: string; dark: boolean }) {
  const [lines, setLines] = React.useState(0);
  if (!text) return null;
  return (
    <View
      style={s.blurbBox}
      onLayout={(e) =>
        setLines(Math.floor((e.nativeEvent.layout.height - 6) / BLURB_LINE))
      }
    >
      {lines > 0 ? (
        <Text
          numberOfLines={lines}
          style={[
            s.blurb,
            { color: dark ? 'rgba(244,244,245,0.66)' : 'rgba(11,11,12,0.62)' },
          ]}
        >
          {text}
        </Text>
      ) : null}
    </View>
  );
}

const descOf = (t: MarketTemplate) =>
  t.kind === 'code' ? t.description : undefined;

const LARGE_SHEET_W = SPAN2 - 20;
const LARGE_PAGE_H = LARGE_SHEET_W / WEB_RATIO;

/** 2 columns × a tall row: title on a pastel stage, the live site below. */
export const LargeSiteTile = React.memo(function LargeSiteTile({
  template,
  onBlack = false,
}: TileProps & { onBlack?: boolean }) {
  const { dark: themeDark } = useStudioActions();
  // On the black showcase the tile reads as dark whatever the theme.
  const dark = themeDark || onBlack;
  const backdrop = React.useMemo(
    () => stageOf(template.key, dark),
    [template.key, dark]
  );
  const { ref, onPress } = useOpenTemplate(template, 'browser', backdrop);
  return (
    <PressableScale
      scaleTo={0.98}
      haptic="tap"
      onPress={onPress}
      accessibilityLabel={`Open ${titleOf(template)}`}
      style={[s.card, s.fill, onBlack && s.blackCard]}
    >
      <Stage seed={template.key} dark={dark} onBlack={onBlack} />
      <View style={s.largeHead}>
        <View style={s.largeTop}>
          <Text numberOfLines={2} style={[s.largeTitle, { color: ink(dark) }]}>
            {titleOf(template)}
          </Text>
          <Heart template={template} tone={metaTone(dark)} />
        </View>
        <Chips template={template} width={SPAN2 - 24} dark={dark} />
        <Blurb text={descOf(template)} dark={dark} />
      </View>
      <View ref={ref} collapsable={false} style={s.largeSheet}>
        <BrowserFrame
          template={template}
          width={LARGE_SHEET_W}
          pageH={LARGE_PAGE_H}
          dark={dark}
          silver={onBlack}
        />
      </View>
    </PressableScale>
  );
});

/**
 * A website tile is all preview: the browser sheet fills the tile and its
 * bar carries the name and likes — no title, chips or blurb over the page.
 * 2 columns × a short row is a whole 16:10 page (only a sliver of its
 * bottom trimmed); one column is the page's top-left, cover-fit.
 */
function SiteSheet({
  template,
  width,
  height,
}: TileProps & { width: number; height: number }) {
  const { dark } = useStudioActions();
  const backdrop = React.useMemo(
    () => stageOf(template.key, dark),
    [template.key, dark]
  );
  const { ref, onPress } = useOpenTemplate(template, 'browser', backdrop);
  return (
    <PressableScale
      scaleTo={0.98}
      haptic="tap"
      onPress={onPress}
      accessibilityLabel={`Open ${titleOf(template)}`}
      style={s.fill}
    >
      <View ref={ref} collapsable={false}>
        <BrowserFrame
          template={template}
          width={width}
          pageH={height - TITLE_BAR_H - CARD_EDGE_W * 2}
          dark={dark}
          onPage
          titled
        />
      </View>
    </PressableScale>
  );
}

/** 2 columns × a short row: one whole site. */
export const SiteTile = React.memo(function SiteTile({
  template,
  height,
}: TileProps & { height: number }) {
  return <SiteSheet template={template} width={SPAN2} height={height} />;
});

/** One column: the site's top-left. */
export const SmallTile = React.memo(function SmallTile({
  template,
  height,
}: TileProps & { height: number }) {
  return <SiteSheet template={template} width={COL_W} height={height} />;
});

const WIDE_PAGE_H = SPAN3 / WEB_RATIO;

/** Full width: one site, big and live. */
export const WideTile = React.memo(function WideTile({
  template,
  onBlack = false,
}: TileProps & { onBlack?: boolean }) {
  const { dark: themeDark } = useStudioActions();
  const dark = themeDark || onBlack;
  const { ref, onPress } = useOpenTemplate(template, 'browser');
  return (
    <PressableScale
      scaleTo={0.98}
      haptic="tap"
      onPress={onPress}
      accessibilityLabel={`Open ${titleOf(template)}`}
      style={s.fill}
    >
      <View ref={ref} collapsable={false}>
        <BrowserFrame
          template={template}
          width={SPAN3}
          pageH={WIDE_PAGE_H}
          dark={dark}
          onPage={!onBlack}
          silver={onBlack}
        />
      </View>
      <TileFoot template={template} tone={metaTone(dark)} width={SPAN3} />
    </PressableScale>
  );
});

const s = StyleSheet.create({
  fill: { flex: 1 },
  card: { borderRadius: RADIUS, borderCurve: 'continuous', overflow: 'hidden' },
  blackCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  phone: { width: PHONE_W },
  largeHead: { flex: 1, paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  largeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  largeTitle: {
    flex: 1,
    fontFamily: F.sans800,
    fontSize: 19,
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  largeSheet: { marginHorizontal: 10, marginBottom: 10 },
  blurbBox: { flex: 1, overflow: 'hidden', paddingBottom: 6 },
  blurb: {
    fontFamily: F.sans500,
    fontSize: 12,
    lineHeight: BLURB_LINE,
    letterSpacing: -0.1,
  },
});

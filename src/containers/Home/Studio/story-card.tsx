import { useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { PressableScale } from '@/components/ui';
import { openCategory } from '@/lib/category-route';
import { openTemplate, type TileFrame } from '@/lib/template-transition';

import { isMobile, thumbOf, titleOf } from '../TemplateReel/layout';
import { Shot } from '../TemplateReel/shot';
import { PAD, STORY_CARD_H, STORY_PAD_Y, su } from './geometry';
import { useLiveBudget } from './live-budget';
import type { Story } from './stories';
import { StoryArt } from './story-art';

/**
 * A story card in the black showcase, built to the App Store's "Today"
 * card (measured off it at the same width): a vivid tinted card with a
 * thick border; a tab in its top-left corner (white caps in the system
 * font) that curves into the border; the art (story-art.tsx) on a near-
 * black top deepening into the tint; an eyebrow, a two-line title and a
 * one-line subtitle on the vivid tint; and a slightly darker band with the
 * template's icon, name, category, and a "View" pill with a caption.
 *
 * The card opens the category (a collection) or the template; the pill
 * always opens the template's product page, swiping through its category.
 */

const EDGE = su(4.5);
const RADIUS = su(20);
const INNER = RADIUS - EDGE;
const TAB_H = su(33);
const FILLET = su(10);
const TEXT_TOP = su(228);
const BAND_H = su(76);
/** A square's top-left corner minus a quarter circle centred on its
 *  bottom-right: the concave curve where the tab meets the border. */
const FILLET_PATH = `M0 0 L${FILLET} 0 A${FILLET} ${FILLET} 0 0 0 0 ${FILLET} Z`;
/** System font (SF Pro on iOS), as the App Store uses. */
const SF = 'System';

type Rect = { x: number; y: number; width: number; height: number };

function useOpenStory(story: Story) {
  const router = useRouter();
  const budget = useLiveBudget();
  return React.useCallback(
    (ref: React.RefObject<View | null>, frame: TileFrame) => {
      const go = (rect: Rect | null) => {
        budget.pause(true);
        openTemplate(router, {
          template: story.lead,
          rect,
          frame,
          list: story.list,
        });
      };
      if (!ref.current) return go(null);
      ref.current.measureInWindow((...m: number[]) => {
        const [x, y, width, height] = m;
        go(width > 0 ? { x, y, width, height } : null);
      });
    },
    [router, budget, story]
  );
}

function Tab({ story }: { story: Story }) {
  const edge = story.tint.edge;
  return (
    <View style={[s.tab, { backgroundColor: edge }]}>
      <Text allowFontScaling={false} numberOfLines={1} style={s.tabText}>
        {story.tab}
      </Text>
      <Svg width={FILLET} height={FILLET} style={s.filletRight}>
        <Path d={FILLET_PATH} fill={edge} />
      </Svg>
      <Svg width={FILLET} height={FILLET} style={s.filletBelow}>
        <Path d={FILLET_PATH} fill={edge} />
      </Svg>
    </View>
  );
}

const kindLine = (story: Story) => {
  if (story.kind !== 'fan') {
    return `${story.category} · ${isMobile(story.lead) ? 'App' : 'Website'}`;
  }
  const apps = story.list.filter(isMobile).length;
  const sites = story.list.length - apps;
  const what = apps && sites ? 'Apps and websites' : apps ? 'Apps' : 'Websites';
  return `${story.list.length} templates · ${what}`;
};

const caption = (story: Story) =>
  isMobile(story.lead) ? 'iOS & Android' : 'Live preview';

function Band({ story, onView }: { story: Story; onView: () => void }) {
  const { tint } = story;
  const name = story.kind === 'fan' ? story.category : titleOf(story.lead);
  return (
    <View style={[s.band, { backgroundColor: tint.band }]}>
      <View style={s.icon}>
        <Shot uri={thumbOf(story.lead)} />
      </View>
      <View style={s.bandText}>
        <Text allowFontScaling={false} numberOfLines={2} style={s.bandTitle}>
          {name}
        </Text>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[s.bandSub, { color: tint.light }]}
        >
          {kindLine(story)}
        </Text>
      </View>
      <View style={s.get}>
        <PressableScale
          haptic="tap"
          onPress={onView}
          accessibilityLabel={`View ${titleOf(story.lead)}`}
          style={s.pill}
        >
          <Text allowFontScaling={false} style={s.pillText}>
            View
          </Text>
        </PressableScale>
        <Text
          allowFontScaling={false}
          style={[s.caption, { color: tint.light }]}
        >
          {caption(story)}
        </Text>
      </View>
    </View>
  );
}

function Copy({ story }: { story: Story }) {
  const { light } = story.tint;
  return (
    <View style={s.text}>
      <Text
        allowFontScaling={false}
        style={[s.eyebrow, { color: light }]}
        numberOfLines={1}
      >
        {story.eyebrow}
      </Text>
      <Text allowFontScaling={false} style={s.title} numberOfLines={2}>
        {story.title}
      </Text>
      <Text
        allowFontScaling={false}
        style={[s.sub, { color: light }]}
        numberOfLines={1}
      >
        {story.subtitle}
      </Text>
    </View>
  );
}

export const StoryCard = React.memo(function StoryCard({
  story,
}: {
  story: Story;
}) {
  const router = useRouter();
  const open = useOpenStory(story);
  const art = React.useRef<View>(null);
  const frame: TileFrame = isMobile(story.lead) ? 'phone' : 'browser';
  const onCard = () =>
    story.kind === 'fan'
      ? openCategory(router, story.category)
      : open(art, frame);
  return (
    <View style={s.block}>
      <PressableScale
        scaleTo={0.98}
        onPress={onCard}
        accessibilityLabel={
          story.kind === 'fan'
            ? `Show ${story.category} templates`
            : `Open ${titleOf(story.lead)}`
        }
        style={[s.card, { backgroundColor: story.tint.edge }]}
      >
        <View ref={art} collapsable={false} style={s.hero}>
          <StoryArt story={story} />
        </View>
        <Tab story={story} />
        <Copy story={story} />
        <Band story={story} onView={() => open(art, frame)} />
      </PressableScale>
    </View>
  );
});

const s = StyleSheet.create({
  block: { paddingVertical: STORY_PAD_Y, paddingHorizontal: PAD },
  card: {
    height: STORY_CARD_H,
    borderRadius: RADIUS,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  hero: {
    position: 'absolute',
    top: EDGE,
    left: EDGE,
    right: EDGE,
    bottom: EDGE + BAND_H,
    borderRadius: INNER,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  tab: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: TAB_H,
    paddingLeft: su(15),
    paddingRight: su(15),
    paddingTop: su(2),
    justifyContent: 'center',
    borderBottomRightRadius: su(11),
  },
  tabText: {
    fontFamily: SF,
    fontWeight: '600',
    fontSize: su(15),
    color: '#FFFFFF',
  },
  filletRight: { position: 'absolute', right: -FILLET, top: EDGE },
  filletBelow: { position: 'absolute', left: EDGE, top: TAB_H },
  text: { position: 'absolute', top: TEXT_TOP, left: su(20), right: su(20) },
  eyebrow: {
    fontFamily: SF,
    fontWeight: '600',
    fontSize: su(14),
    lineHeight: su(18),
  },
  title: {
    fontFamily: SF,
    fontWeight: '700',
    fontSize: su(29),
    lineHeight: su(34),
    color: '#FFFFFF',
  },
  sub: {
    fontFamily: SF,
    fontSize: su(14.5),
    lineHeight: su(20),
    marginTop: su(3),
  },
  band: {
    position: 'absolute',
    left: EDGE,
    right: EDGE,
    bottom: EDGE,
    height: BAND_H,
    borderBottomLeftRadius: INNER,
    borderBottomRightRadius: INNER,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    gap: su(11),
    paddingLeft: su(15.5),
    paddingRight: su(16),
  },
  icon: {
    width: su(48),
    height: su(48),
    borderRadius: su(11),
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  bandText: { flex: 1 },
  bandTitle: {
    fontFamily: SF,
    fontWeight: '600',
    fontSize: su(16.5),
    lineHeight: su(20),
    color: '#FFFFFF',
  },
  bandSub: { fontFamily: SF, fontSize: su(16), lineHeight: su(20) },
  get: { alignItems: 'center', gap: su(4), paddingTop: su(12) },
  pill: {
    width: su(74),
    height: su(32),
    borderRadius: su(16),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  pillText: {
    fontFamily: SF,
    fontWeight: '700',
    fontSize: su(17),
    color: '#FFFFFF',
  },
  caption: { fontFamily: SF, fontSize: su(10), lineHeight: su(12) },
});

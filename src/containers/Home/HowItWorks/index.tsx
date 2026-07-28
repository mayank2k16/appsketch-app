import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { GradientText } from '@/components/ui/GradientText';
import { F } from '@/lib/fonts';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

const BADGE_SIZE = 34;

const STEPS: {
  number: string;
  title: string;
  desc: string;
  gradient: [string, string];
}[] = [
    {
      number: '01',
      title: 'Agent drafts the build',
      desc: "It writes fast-moving code and scaffolds your app's structure from our proprietary LLM — in minutes.",
      gradient: ['#8B5CF6', '#6C5CE7'],
    },
    {
      number: '02',
      title: 'Developers tailor it',
      desc: 'Real human engineers customize every screen, flow and rule to your exact business needs.',
      gradient: ['#8B5CF6', '#6C5CE7'],
    },
    {
      number: '03',
      title: 'Ship production-ready',
      desc: 'A tested, launch-ready app your business owns — at a fraction of the usual cost.',
      gradient: ['#8B5CF6', '#22D3EE'],
    },
  ];

const PROMPT_PHRASE =
  'Build an inventory app for my 3 warehouses with role-based access';
const TYPE_MS = 32;
const HOLD_MS = 1800;
const DELETE_MS = 18;
const GAP_MS = 500;

// Loops: type the phrase out, hold, delete it, pause, repeat — same rhythm
// as AgentV2's typewriter but a single fixed phrase (no phrase list/tab
// switching to coordinate here).
function useTypewriter(phrase: string): string {
  const [text, setText] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let i = 0;

    const typeStep = () => {
      if (cancelled) return;
      setText(phrase.slice(0, i));
      if (i < phrase.length) {
        i += 1;
        timer = setTimeout(typeStep, TYPE_MS);
      } else {
        timer = setTimeout(deleteStep, HOLD_MS);
      }
    };
    const deleteStep = () => {
      if (cancelled) return;
      if (i > 0) {
        i -= 1;
        setText(phrase.slice(0, i));
        timer = setTimeout(deleteStep, DELETE_MS);
      } else {
        timer = setTimeout(typeStep, GAP_MS);
      }
    };

    timer = setTimeout(typeStep, GAP_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phrase]);

  return text;
}

function BlinkingCursor({ color }: { color: string }) {
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), 500);
    return () => clearInterval(id);
  }, []);
  return <Text style={{ color, opacity: visible ? 1 : 0 }}>|</Text>;
}

// ── Step 01 visual: the prompt being typed into the agent ──
function PromptBubble({ t }: { t: HomeColors }) {
  const typed = useTypewriter(PROMPT_PHRASE);
  return (
    <View style={[s.mockCard, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}>
      <Text style={[s.promptText, { color: t.text }]}>
        {typed}
        <BlinkingCursor color={t.accent} />
      </Text>
    </View>
  );
}

const BAR_SWEEP_MS = 1600;

// A colour band continuously sweeps left → right along the track and loops
// — same translate-driven technique as AgentV2's send-button sheen, applied
// to a wider gradient segment instead of a thin highlight.
function SweepingProgressBar({ t }: { t: HomeColors }) {
  const [trackWidth, setTrackWidth] = React.useState(0);
  const translateX = React.useRef(new Animated.Value(0)).current;
  const barWidth = trackWidth * 0.5;

  React.useEffect(() => {
    if (!trackWidth) return;
    translateX.setValue(-barWidth);
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: trackWidth,
        duration: BAR_SWEEP_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [trackWidth, barWidth, translateX]);

  return (
    <View
      style={[s.progressTrack, { backgroundColor: t.border }]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      {trackWidth > 0 && (
        <Animated.View
          style={[s.progressBand, { width: barWidth, transform: [{ translateX }] }]}
        >
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

// ── Step 02 visual: a human-review pass over the generated screen ──
function ReviewCard({ t }: { t: HomeColors }) {
  return (
    <View style={[s.mockCard, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}>
      <View style={s.reviewHeader}>
        <View style={s.dots}>
          <View style={[s.dot, { backgroundColor: '#FF5F57' }]} />
          <View style={[s.dot, { backgroundColor: '#FEBC2E' }]} />
          <View style={[s.dot, { backgroundColor: '#28C840' }]} />
        </View>
        <Text style={[s.reviewLabel, { color: t.textMuted }]}>human review</Text>
      </View>
      <View style={[s.skeletonBar, { backgroundColor: t.border, width: '92%' }]} />
      <View style={[s.skeletonBar, { backgroundColor: t.border, width: '68%' }]} />
      <SweepingProgressBar t={t} />
    </View>
  );
}

// ── Step 03 visual: the outcome, as a row of pill tags ──
const OUTCOME_CHIPS = ['Production-ready', 'You own it', 'Fraction of cost'];
function ChipsRow({ t }: { t: HomeColors }) {
  return (
    <View style={s.chipsRow}>
      {OUTCOME_CHIPS.map((c) => (
        <View
          key={c}
          style={[s.chip, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}
        >
          <Text style={[s.chipText, { color: t.text }]}>{c}</Text>
        </View>
      ))}
    </View>
  );
}

function StepVisual({ index, t }: { index: number; t: HomeColors }) {
  if (index === 0) return <PromptBubble t={t} />;
  if (index === 1) return <ReviewCard t={t} />;
  return <ChipsRow t={t} />;
}

// Same fade recipe as Hero's heading (white → heroHeadingFade, same stops) —
// one GradientText per line, matching how Hero splits its two lines.
function HeadingLine({ text, t }: { text: string; t: HomeColors }) {
  return (
    <GradientText
      style={s.heading}
      colors={[t.text, t.text, t.heroHeadingFade]}
      locations={[0, 0.52, 1]}
    >
      {text}
    </GradientText>
  );
}

export function HowItWorksSection() {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    // No section backgroundColor here — the shared TwinkleDots backdrop
    // (rendered once, fixed, behind the whole Home ScrollView) needs to show
    // through every section, not just the ones that leave it transparent.
    <View style={s.section}>
      <View style={s.eyebrowRow}>
        <View style={[s.eyebrowDot, { backgroundColor: t.accent }]} />
        <Text style={[s.eyebrow, { color: t.tagText }]}>HOW IT WORKS</Text>
      </View>

      <View style={s.headingWrap}>
        <HeadingLine text="AI drafts." t={t} />
        <HeadingLine text="Humans perfect." t={t} />
      </View>

      <View>
        {STEPS.map((step, i) => {
          const isLast = i === STEPS.length - 1;
          return (
            <View key={step.number} style={s.stepRow}>
              <View style={s.rail}>
                <LinearGradient
                  colors={step.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.badge}
                >
                  <Text style={s.badgeText}>{step.number}</Text>
                </LinearGradient>
                {!isLast && (
                  <LinearGradient
                    colors={[step.gradient[0], STEPS[i + 1].gradient[0]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={s.railLine}
                  />
                )}
              </View>

              <View style={s.stepContent}>
                <Text style={[s.stepTitle, { color: t.text }]}>{step.title}</Text>
                <Text style={[s.stepDesc, { color: t.textSub }]}>{step.desc}</Text>
                <StepVisual index={i} t={t} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingHorizontal: 22,
    paddingTop: 44,
    paddingBottom: 56,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrow: {
    fontFamily: F.sans700,
    fontSize: 12,
    letterSpacing: 1.6,
  },

  headingWrap: {
    marginBottom: 30,
  },
  heading: {
    fontFamily: F.display900,
    fontSize: 30,
    letterSpacing: -0.8,
    lineHeight: 36,
  },

  stepRow: {
    flexDirection: 'row',
  },
  rail: {
    width: BADGE_SIZE,
    alignItems: 'center',
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: F.sans700,
    fontSize: 13,
    color: '#FFFFFF',
  },
  railLine: {
    width: 2,
    flex: 1,
    marginTop: 6,
    borderRadius: 1,
  },

  stepContent: {
    flex: 1,
    paddingLeft: 16,
    paddingBottom: 32,
  },
  stepTitle: {
    fontFamily: F.sans700,
    fontSize: 17,
    marginBottom: 6,
  },
  stepDesc: {
    fontFamily: F.sans400,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 16,
  },

  mockCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  promptText: {
    fontFamily: F.sans500,
    fontSize: 13.5,
    lineHeight: 20,
  },

  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reviewLabel: {
    fontFamily: F.sans600,
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  skeletonBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    marginTop: 6,
    width: '100%',
    overflow: 'hidden',
  },
  progressBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: {
    fontFamily: F.sans600,
    fontSize: 12.5,
  },
});

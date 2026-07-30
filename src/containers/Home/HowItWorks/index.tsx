import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

import { F } from '@/lib/fonts';
import { SectionHeading } from '../components/SectionHeading';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

const BADGE_SIZE = 34;
const PULSE_COLOR = '#22D3EE';

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

// One step at a time is "live" — its badge haloes, its rail pulses and its
// visual card lifts. Cycling the highlight is what keeps the whole section
// moving without three unrelated loops fighting for attention.
const STEP_CYCLE_MS = 3400;

function useCycle(count: number, ms: number): number {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % count), ms);
    return () => clearInterval(id);
  }, [count, ms]);
  return i;
}

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

// Wraps every step visual: a hairline card that brightens and lifts while its
// step is the live one, so the eye is pulled down the rail in order.
function VisualCard({
  t,
  active,
  children,
}: {
  t: HomeColors;
  active: boolean;
  children: React.ReactNode;
}) {
  const a = useSharedValue(0);
  React.useEffect(() => {
    a.value = withTiming(active ? 1 : 0, { duration: 420 });
  }, [active, a]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(a.value, [0, 1], [1, 1.015]) }],
    opacity: interpolate(a.value, [0, 1], [0.82, 1]),
  }));

  return (
    <Reanimated.View
      style={[
        s.mockCard,
        { backgroundColor: t.agentTabBg, borderColor: active ? t.accent : t.agentTabBorder },
        style,
      ]}
    >
      {children}
    </Reanimated.View>
  );
}

// ── Step 01 visual: the prompt being typed into the agent ──
function PromptBubble({ t, active }: { t: HomeColors; active: boolean }) {
  const typed = useTypewriter(PROMPT_PHRASE);
  return (
    <VisualCard t={t} active={active}>
      <Text style={[s.promptText, { color: t.text }]}>
        {typed}
        <BlinkingCursor color={t.accent} />
      </Text>
    </VisualCard>
  );
}

// ── Step 02 visual: a human signing off on the generated screen ──
// Replaces the old sweeping progress bar: a machine-looking loader said
// nothing about the human in the loop, so the card now draws a handwritten
// signature stroke-by-stroke with a pen tip riding the tip of the ink.
const SIG_W = 200;
const SIG_H = 30;
// Deliberately over the path's true length — dasharray must never be shorter
// than the path or the dash pattern repeats instead of drawing once.
const SIG_LEN = 360;
const SIG_D =
  'M6 22 C 14 4, 26 3, 30 17 C 33 28, 41 29, 46 18 C 51 7, 62 7, 66 20 C 69 29, 78 28, 85 17 C 91 7, 103 6, 110 15 C 115 23, 124 26, 134 18 C 142 12, 152 8, 168 13 C 176 15, 182 12, 192 8';
// Sampled along SIG_D at roughly even parameter steps — the pen tip rides
// these rather than a real getTotalLength()/getPointAtLength() walk, which
// react-native-svg does not expose consistently across platforms.
const SIG_POINTS: [number, number][] = [
  [6, 22],
  [30, 17],
  [46, 18],
  [66, 20],
  [85, 17],
  [110, 15],
  [134, 18],
  [168, 13],
  [192, 8],
];
const SIG_INPUT = SIG_POINTS.map((_, i) => i / (SIG_POINTS.length - 1));
const SIG_XS = SIG_POINTS.map((p) => p[0]);
const SIG_YS = SIG_POINTS.map((p) => p[1]);

// Phases of one loop: draw the ink, hold it, fade out, restart.
const SIG_LOOP_MS = 4200;
const DRAW_END = 0.6;
const HOLD_END = 0.88;

const AnimatedPath = Reanimated.createAnimatedComponent(Path);

function SignatureBlock({ t }: { t: HomeColors }) {
  const [w, setW] = React.useState(0);
  const p = useSharedValue(0);

  React.useEffect(() => {
    p.value = 0;
    p.value = withRepeat(
      withTiming(1, { duration: SIG_LOOP_MS, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(p);
  }, [p]);

  // Scale is uniform (viewBox aspect preserved) so the handwriting never
  // stretches horizontally on wider screens.
  const k = w ? w / SIG_W : 0;

  const inkProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(
      p.value,
      [0, DRAW_END],
      [SIG_LEN, 0],
      Extrapolation.CLAMP
    ),
  }));

  const inkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [HOLD_END, 1], [1, 0], Extrapolation.CLAMP),
  }));

  const tipStyle = useAnimatedStyle(() => {
    const d = interpolate(p.value, [0, DRAW_END], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: interpolate(
        p.value,
        [0, 0.04, DRAW_END - 0.02, DRAW_END + 0.04],
        [0, 1, 1, 0],
        Extrapolation.CLAMP
      ),
      transform: [
        { translateX: interpolate(d, SIG_INPUT, SIG_XS) * k },
        { translateY: interpolate(d, SIG_INPUT, SIG_YS) * k },
      ],
    };
  });

  return (
    <View style={s.sigWrap} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <>
          <Reanimated.View style={inkStyle}>
            <Svg width={w} height={w * (SIG_H / SIG_W)} viewBox={`0 0 ${SIG_W} ${SIG_H}`}>
              <Defs>
                <SvgLinearGradient id="sigInk" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#8B5CF6" />
                  <Stop offset="0.55" stopColor="#6C5CE7" />
                  <Stop offset="1" stopColor="#22D3EE" />
                </SvgLinearGradient>
              </Defs>
              <AnimatedPath
                d={SIG_D}
                stroke="url(#sigInk)"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={SIG_LEN}
                animatedProps={inkProps}
              />
            </Svg>
          </Reanimated.View>

          {/* Pen tip: a glow dot with the nib icon trailing just above it */}
          <Reanimated.View style={[s.penTip, tipStyle]} pointerEvents="none">
            <View style={s.penGlow} />
            <Ionicons name="brush" size={13} color={t.text} style={s.penIcon} />
          </Reanimated.View>
        </>
      )}
    </View>
  );
}

// Overlapping initials of the engineers on the build — the human faces
// behind "human review", stated without a stock-photo avatar.
const REVIEWERS: { initials: string; gradient: [string, string] }[] = [
  { initials: 'AR', gradient: ['#8B5CF6', '#6C5CE7'] },
  { initials: 'MK', gradient: ['#3B82F6', '#8B5CF6'] },
  { initials: 'JD', gradient: ['#EC4899', '#8B5CF6'] },
];

function LiveDot({ color }: { color: string }) {
  const p = useSharedValue(0);
  React.useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(p);
  }, [p]);

  const ring = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 1], [0.55, 0]),
    transform: [{ scale: interpolate(p.value, [0, 1], [1, 2.6]) }],
  }));

  return (
    <View style={s.liveDotWrap}>
      <Reanimated.View style={[s.liveDotRing, { borderColor: color }, ring]} />
      <View style={[s.liveDot, { backgroundColor: color }]} />
    </View>
  );
}

function HumanTouchCard({ t, active }: { t: HomeColors; active: boolean }) {
  return (
    <VisualCard t={t} active={active}>
      <View style={s.reviewHeader}>
        <View style={s.dots}>
          <View style={[s.dot, { backgroundColor: '#FF5F57' }]} />
          <View style={[s.dot, { backgroundColor: '#FEBC2E' }]} />
          <View style={[s.dot, { backgroundColor: '#28C840' }]} />
        </View>
        <View style={s.reviewLabelRow}>
          <LiveDot color="#28C840" />
          <Text style={[s.reviewLabel, { color: t.textMuted }]}>human review</Text>
        </View>
      </View>

      <View style={[s.skeletonBar, { backgroundColor: t.border, width: '92%' }]} />
      <View style={[s.skeletonBar, { backgroundColor: t.border, width: '68%' }]} />

      <SignatureBlock t={t} />

      <View style={[s.sigFooter, { borderTopColor: t.agentTabBorder }]}>
        <View style={s.avatarStack}>
          {REVIEWERS.map((r, i) => (
            <LinearGradient
              key={r.initials}
              colors={r.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                s.avatar,
                { borderColor: t.agentTabBg, marginLeft: i === 0 ? 0 : -8, zIndex: REVIEWERS.length - i },
              ]}
            >
              <Text style={s.avatarText}>{r.initials}</Text>
            </LinearGradient>
          ))}
        </View>
        <Text style={[s.sigCaption, { color: t.textSub }]}>
          signed off by real engineers
        </Text>
      </View>
    </VisualCard>
  );
}

// ── Step 03 visual: the outcome, as a row of pill tags ──
const OUTCOME_CHIPS = ['Production-ready', 'You own it', 'Fraction of cost'];

function OutcomeChip({
  label,
  index,
  t,
  active,
}: {
  label: string;
  index: number;
  t: HomeColors;
  active: boolean;
}) {
  const a = useSharedValue(0);
  React.useEffect(() => {
    a.value = withDelay(
      active ? index * 140 : 0,
      withTiming(active ? 1 : 0, { duration: 380 })
    );
  }, [active, index, a]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(a.value, [0, 1], [0, -3]) }],
    opacity: interpolate(a.value, [0, 1], [0.7, 1]),
  }));

  return (
    <Reanimated.View
      style={[
        s.chip,
        { backgroundColor: t.agentTabBg, borderColor: active ? t.accent : t.agentTabBorder },
        style,
      ]}
    >
      <Text style={[s.chipText, { color: t.text }]}>{label}</Text>
    </Reanimated.View>
  );
}

function ChipsRow({ t, active }: { t: HomeColors; active: boolean }) {
  return (
    <View style={s.chipsRow}>
      {OUTCOME_CHIPS.map((c, i) => (
        <OutcomeChip key={c} label={c} index={i} t={t} active={active} />
      ))}
    </View>
  );
}

function StepVisual({ index, t, active }: { index: number; t: HomeColors; active: boolean }) {
  if (index === 0) return <PromptBubble t={t} active={active} />;
  if (index === 1) return <HumanTouchCard t={t} active={active} />;
  return <ChipsRow t={t} active={active} />;
}

// Badge for the step number: a halo ripples out of it while its step is live.
function StepBadge({
  step,
  active,
}: {
  step: (typeof STEPS)[number];
  active: boolean;
}) {
  const halo = useSharedValue(0);
  const lift = useSharedValue(0);

  React.useEffect(() => {
    if (active) {
      halo.value = 0;
      halo.value = withRepeat(
        withTiming(1, { duration: 1700, easing: Easing.out(Easing.quad) }),
        -1,
        false
      );
    } else {
      cancelAnimation(halo);
      halo.value = withTiming(0, { duration: 250 });
    }
    lift.value = withTiming(active ? 1 : 0, { duration: 320 });
  }, [active, halo, lift]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(halo.value, [0, 1], [0.5, 0]),
    transform: [{ scale: interpolate(halo.value, [0, 1], [1, 2]) }],
  }));
  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(lift.value, [0, 1], [1, 1.1]) }],
  }));

  return (
    <View style={s.badgeWrap}>
      <Reanimated.View
        style={[s.halo, { borderColor: step.gradient[0] }, haloStyle]}
        pointerEvents="none"
      />
      <Reanimated.View style={coreStyle}>
        <LinearGradient
          colors={step.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.badge}
        >
          <Text style={s.badgeText}>{step.number}</Text>
        </LinearGradient>
      </Reanimated.View>
    </View>
  );
}

// The connector between two badges, with a light pulse falling down it —
// reads as the build flowing from one stage into the next.
function RailLine({
  from,
  to,
  index,
}: {
  from: string;
  to: string;
  index: number;
}) {
  const [h, setH] = React.useState(0);
  const p = useSharedValue(0);

  React.useEffect(() => {
    if (!h) return;
    p.value = 0;
    p.value = withDelay(
      index * 500,
      withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), -1, false)
    );
    return () => cancelAnimation(p);
  }, [h, index, p]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(p.value, [0, 1], [-30, h]) }],
    opacity: interpolate(p.value, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
  }));

  return (
    <View style={s.railLine} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
      <LinearGradient
        colors={[from, to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {h > 0 && (
        <Reanimated.View style={[s.railPulse, pulseStyle]} pointerEvents="none">
          <LinearGradient
            colors={['transparent', PULSE_COLOR, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Reanimated.View>
      )}
    </View>
  );
}

export function HowItWorksSection() {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];
  const activeStep = useCycle(STEPS.length, STEP_CYCLE_MS);

  return (
    // No section backgroundColor here — the shared TwinkleDots backdrop
    // (rendered once, fixed, behind the whole Home ScrollView) needs to show
    // through every section, not just the ones that leave it transparent.
    <View style={s.section}>
      <SectionHeading
        eyebrow="HOW IT WORKS"
        lines={['AI drafts. Humans', 'perfect.']}
        t={t}
      />

      <View>
        {STEPS.map((step, i) => {
          const isLast = i === STEPS.length - 1;
          const active = activeStep === i;
          return (
            <View key={step.number} style={s.stepRow}>
              <View style={s.rail}>
                <StepBadge step={step} active={active} />
                {!isLast && (
                  <RailLine
                    from={step.gradient[0]}
                    to={STEPS[i + 1].gradient[0]}
                    index={i}
                  />
                )}
              </View>

              <View style={s.stepContent}>
                <Text style={[s.stepTitle, { color: t.text }]}>{step.title}</Text>
                <Text style={[s.stepDesc, { color: t.textSub }]}>{step.desc}</Text>
                <StepVisual index={i} t={t} active={active} />
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
    // Matches the shared 8px gutter used by every Home section below the
    // fold — the step cards carry their own inner padding on top of this.
    paddingHorizontal: 8,
    paddingTop: 25,
    paddingBottom: 30,
  },

  stepRow: {
    flexDirection: 'row',
  },
  rail: {
    width: BADGE_SIZE,
    alignItems: 'center',
  },
  badgeWrap: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    borderWidth: 1.5,
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
    overflow: 'hidden',
  },
  railPulse: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 30,
  },

  stepContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 22,
  },
  stepTitle: {
    fontFamily: F.sans700,
    fontSize: 16.5,
    marginBottom: 5,
  },
  stepDesc: {
    fontFamily: F.sans400,
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 12,
  },

  mockCard: {
    borderRadius: 13,
    borderWidth: 1,
    padding: 12,
    minHeight: 66,
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
    marginBottom: 12,
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
  reviewLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  reviewLabel: {
    fontFamily: F.sans600,
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  liveDotWrap: {
    width: 6,
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveDotRing: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
  },
  skeletonBar: {
    height: 7,
    borderRadius: 4,
    marginBottom: 7,
  },

  sigWrap: {
    marginTop: 6,
    marginBottom: 4,
  },
  penTip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  penGlow: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: PULSE_COLOR,
    opacity: 0.9,
  },
  penIcon: {
    position: 'absolute',
    left: 3,
    bottom: 3,
  },
  sigFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: F.sans700,
    fontSize: 8.5,
    color: '#FFFFFF',
  },
  sigCaption: {
    fontFamily: F.sans500,
    fontSize: 11.5,
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

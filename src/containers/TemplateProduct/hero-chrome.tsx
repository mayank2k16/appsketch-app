import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import { DeviceSwitch } from './device-switch';
import type { Geometry } from './geometry';
import type { Device } from './live-url';
import type { PageTheme } from './theme';
import type { ProductMotion } from './use-product-transition';

/**
 * The page's fixed controls (they do not move with the pager): the close X
 * in the hero's top-left corner, and — for websites only — one slim capsule
 * centred in the 6/32/6pt row between the hero and the details box: LIVE
 * status, then the Mobile | Tablet | Desktop switch — flanked by ‹ and ›
 * buttons at the row's ends that page to the previous / next template. Apps have no row (their
 * hero runs down to 8pt above the box). Panel-coloured with the panels'
 * edge; no shadows.
 */

type LeadProps = {
  on: boolean;
  active: boolean;
  /** Pager position and the page the status belongs to: it drops back to
   *  "loading" as soon as that page starts moving off centre. */
  x: SharedValue<number>;
  index: number;
  dark: boolean;
};

/** The switch's leading status: a grey dot + dim "LIVE" while the site
 *  loads, a pulsing green dot + white "LIVE" once it runs. */
function LiveLead({ on, active, x, index, dark }: LeadProps) {
  const dim = dark ? 'rgba(255,255,255,0.35)' : 'rgba(11,11,12,0.25)';
  const lit = useSharedValue(0);
  const pulse = useSharedValue(1);
  React.useEffect(() => {
    lit.value = withTiming(on ? 1 : 0, { duration: 260 });
  }, [on, lit]);
  React.useEffect(() => {
    if (!on || !active) {
      cancelAnimation(pulse);
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(0.3, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    return () => cancelAnimation(pulse);
  }, [on, active, pulse]);
  const on01 = useDerivedValue(
    () => lit.value * Math.max(0, 1 - Math.abs(x.value - index) * 4)
  );
  const dot = useAnimatedStyle(() => ({
    opacity: on01.value ? pulse.value : 1,
    backgroundColor: interpolateColor(on01.value, [0, 1], [dim, '#12A150']),
  }));
  const text = useAnimatedStyle(() => ({ opacity: 0.55 + on01.value * 0.45 }));
  return (
    <View style={s.live}>
      <Animated.View style={[s.dot, dot]} />
      <Animated.Text
        style={[s.liveText, { color: dark ? '#FFFFFF' : '#0B0B0C' }, text]}
      >
        LIVE
      </Animated.Text>
    </View>
  );
}

type Props = {
  g: Geometry;
  m: ProductMotion;
  t: PageTheme;
  dark: boolean;
  onClose: () => void;
  live: boolean;
  active: boolean;
  x: SharedValue<number>;
  index: number;
  /** null = the centred template has no live site (no switch). */
  device: Device | null;
  onDevice: (d: Device) => void;
  /** Page one template back / forward (the ‹ › buttons). */
  onStep: (dir: 1 | -1) => void;
  canPrev: boolean;
  canNext: boolean;
};

type StepProps = {
  dir: 1 | -1;
  enabled: boolean;
  t: PageTheme;
  onStep: (dir: 1 | -1) => void;
};

/** A ‹ / › capsule at one end of the switch row, in the switch's own panel
 *  colour and edge; dimmed (still tappable, it bumps) at the list's end. */
const StepButton = React.memo(function StepButton({
  dir,
  enabled,
  t,
  onStep,
}: StepProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={dir < 0 ? 'Previous template' : 'Next template'}
      accessibilityState={{ disabled: !enabled }}
      hitSlop={8}
      onPress={() => onStep(dir)}
      style={[
        s.step,
        { backgroundColor: t.panel, borderColor: t.panelEdge },
        !enabled && s.stepOff,
      ]}
    >
      <Ionicons
        name={dir < 0 ? 'chevron-back' : 'chevron-forward'}
        size={17}
        color={t.ink}
      />
    </PressableScale>
  );
});

/** The close button, a small panel-coloured circle inside the hero's
 *  top-left corner. It follows a pull-down with the hero. */
function CloseButton({ g, m, t, onClose }: Props) {
  const { close } = g;
  const style = useAnimatedStyle(() => ({
    opacity: m.reveal.value * (1 - Math.min(m.drag.value / 220, 1)),
    transform: [{ translateY: m.drag.value }],
  }));
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[s.abs, { left: close.x, top: close.y }, style]}
    >
      <PressableScale
        accessibilityLabel="Close"
        hitSlop={10}
        onPress={onClose}
        style={[
          s.close,
          {
            width: close.width,
            height: close.height,
            borderRadius: close.width / 2,
            backgroundColor: t.panel,
            borderColor: t.panelEdge,
          },
        ]}
      >
        <Ionicons name="close" size={18} color={t.ink} />
      </PressableScale>
    </Animated.View>
  );
}

export const HeroChrome = React.memo(function HeroChrome(p: Props) {
  const { g, m, t } = p;
  const { bar } = g;
  const fade = useAnimatedStyle(() => ({
    opacity: m.reveal.value * (1 - Math.min(m.drag.value / 220, 1)),
    transform: [{ translateY: m.drag.value * 0.5 }],
  }));
  return (
    <>
      <CloseButton {...p} />
      {p.device ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            s.bar,
            { left: bar.x, top: bar.y, width: bar.width, height: bar.height },
            fade,
          ]}
        >
          <StepButton dir={-1} enabled={p.canPrev} t={t} onStep={p.onStep} />
          <DeviceSwitch
            value={p.device}
            onChange={p.onDevice}
            t={t}
            dark={p.dark}
            lead={
              <LiveLead
                on={p.live}
                active={p.active}
                x={p.x}
                index={p.index}
                dark={p.dark}
              />
            }
          />
          <StepButton dir={1} enabled={p.canNext} t={t} onStep={p.onStep} />
        </Animated.View>
      ) : null}
    </>
  );
});

const s = StyleSheet.create({
  abs: { position: 'absolute' },
  bar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  step: {
    width: 42,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepOff: { opacity: 0.4 },
  close: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 9,
    paddingRight: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  liveText: {
    fontFamily: F.sans700,
    fontSize: 10.5,
    letterSpacing: 1,
  },
});

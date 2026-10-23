import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { DomainView } from '@/api/app-domains';
import { type ServicesPalette, tint } from '@/components/services';
import { F } from '@/lib/fonts';

import { stepIndex, STEPS } from '../stage';
import { StagePill } from '../stage-pill';

function Pulse({ color, active }: { color: string; active: boolean }) {
  const v = useSharedValue(0);
  React.useEffect(() => {
    v.value = active
      ? withRepeat(
          withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }),
          -1,
          false
        )
      : 0;
  }, [active, v]);
  const ring = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - v.value),
    transform: [{ scale: 1 + v.value * 0.9 }],
  }));
  return <Animated.View style={[st.pulse, { borderColor: color }, ring]} />;
}

function Step({
  s,
  i,
  cur,
  active,
}: {
  s: ServicesPalette;
  i: number;
  cur: number;
  active: boolean;
}) {
  const done = i < cur;
  const on = i === cur;
  return (
    <View style={st.step}>
      <View style={st.markCol}>
        <View style={st.mark}>
          {on ? <Pulse color={s.orange} active={active} /> : null}
          <View
            style={[
              st.dot,
              done
                ? { backgroundColor: s.success }
                : on
                  ? { backgroundColor: s.orange }
                  : {
                      backgroundColor: s.inset,
                      borderColor: s.hairline,
                      borderWidth: 1,
                    },
            ]}
          >
            {done ? (
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            ) : null}
          </View>
        </View>
        {i < STEPS.length - 1 ? (
          <View
            style={[
              st.line,
              { backgroundColor: done ? s.success : s.hairline },
            ]}
          />
        ) : null}
      </View>
      <Text
        style={[
          st.label,
          { color: done || on ? s.text : s.muted },
          on && st.labelOn,
        ]}
      >
        {STEPS[i]}
      </Text>
    </View>
  );
}

/** Domain, current stage and the 4-step tracker (DNS → build → HTTPS → live). */
export function StageTracker({
  s,
  d,
  active,
}: {
  s: ServicesPalette;
  d: DomainView;
  active: boolean;
}) {
  const cur = stepIndex(d.stage);
  const blocked = d.stage === 'failed' || d.stage === 'web_unavailable';
  return (
    <View
      style={[st.card, { backgroundColor: s.raised, borderColor: s.hairline }]}
    >
      <Text style={[st.domain, { color: s.text }]} numberOfLines={1}>
        {d.domain}
      </Text>
      <StagePill s={s} d={d} />
      {d.detail ? (
        <Text style={[st.detail, { color: s.sub }]}>{d.detail}</Text>
      ) : null}
      {blocked ? (
        <View
          style={[
            st.alert,
            {
              backgroundColor: tint(
                d.stage === 'failed' ? s.error : s.warning,
                0.08
              ),
            },
          ]}
        >
          <Text style={[st.alertText, { color: s.text }]}>
            {d.error || d.detail || 'Setup stopped.'}
          </Text>
        </View>
      ) : (
        <View style={st.steps}>
          {STEPS.map((_, i) => (
            <Step key={i} s={s} i={i} cur={cur} active={active} />
          ))}
        </View>
      )}
      {d.sandbox ? (
        <Text style={[st.sandbox, { color: s.warning }]}>Test mode</Text>
      ) : null}
    </View>
  );
}

const DOT = 20;
const st = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 8 },
  domain: { fontFamily: F.display900, fontSize: 21, letterSpacing: -0.5 },
  detail: { fontFamily: F.sans400, fontSize: 12.5, lineHeight: 17 },
  alert: { borderRadius: 12, padding: 10 },
  alertText: { fontFamily: F.sans500, fontSize: 12.5, lineHeight: 17 },
  steps: { marginTop: 6 },
  step: { flexDirection: 'row', gap: 10, minHeight: 34 },
  markCol: { alignItems: 'center', width: DOT },
  mark: {
    width: DOT,
    height: DOT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { width: 2, flex: 1, marginVertical: 2, borderRadius: 1 },
  label: { fontFamily: F.sans500, fontSize: 13.5, paddingTop: 1 },
  labelOn: { fontFamily: F.sans700 },
  sandbox: { fontFamily: F.sans600, fontSize: 11 },
});

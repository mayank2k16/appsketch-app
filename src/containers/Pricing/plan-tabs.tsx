import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

import type { PricingPalette } from './theme';
import type { PlanView } from './use-pricing';

/** Basic / Growth / 100X switcher above the single plan card. Each tab
 *  carries its yearly saving ("-17%") and a dot on the user's own plan. */
export function PlanTabs({
  t,
  p,
  plans,
  value,
  onChange,
}: {
  t: AppColors;
  p: PricingPalette;
  plans: PlanView[];
  value: string;
  onChange: (tier: string) => void;
}) {
  return (
    <View
      style={[
        st.track,
        { backgroundColor: p.track, borderColor: p.trackBorder },
      ]}
    >
      {plans.map((plan) => {
        const on = plan.tier === value;
        return (
          <PressableScale
            key={plan.tier}
            onPress={() => onChange(plan.tier)}
            haptic="tap"
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[st.tab, on && { backgroundColor: p.thumb }]}
          >
            <View style={st.labelRow}>
              {plan.current ? (
                <View style={[st.dot, { backgroundColor: p.success }]} />
              ) : null}
              <Text
                style={[st.label, { color: on ? p.thumbText : t.text }]}
                numberOfLines={1}
              >
                {plan.name}
              </Text>
            </View>
            {plan.savePct ? (
              <Text
                style={[
                  st.save,
                  {
                    color: on ? p.thumbText : p.saveText,
                    opacity: on ? 0.8 : 1,
                  },
                ]}
              >
                save {plan.savePct}%
              </Text>
            ) : plan.popular ? (
              <Text style={[st.save, { color: on ? p.thumbText : t.textSub }]}>
                popular
              </Text>
            ) : null}
          </PressableScale>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontFamily: F.sans800, fontSize: 15, letterSpacing: -0.2 },
  save: { fontFamily: F.sans700, fontSize: 11, marginTop: 1 },
});

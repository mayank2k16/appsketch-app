import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import type { PageTheme } from './theme';

/**
 * The CTA row at the bottom of each template's details box.
 * Primary: a dark pill (white in dark) that runs/opens the template.
 * Secondary: an outline "Use this template" (clone, as in the Market).
 * A button is only rendered when it can do something — never a dead one.
 */

export type Cta = { label: string; onPress: () => void; busy?: boolean };

type Props = {
  t: PageTheme;
  primary: Cta | null;
  secondary: Cta | null;
};

function Primary({ cta, t }: { cta: Cta; t: PageTheme }) {
  return (
    <PressableScale
      haptic="press"
      onPress={cta.onPress}
      style={[s.btn, s.grow, { backgroundColor: t.primaryBg }]}
    >
      <Text style={[s.btnText, { color: t.primaryFg }]}>{cta.label}</Text>
    </PressableScale>
  );
}

function Secondary({
  cta,
  t,
  alone,
}: {
  cta: Cta;
  t: PageTheme;
  alone: boolean;
}) {
  // On its own it becomes the primary-looking button (still no haptic).
  const fill = alone ? { backgroundColor: t.primaryBg } : null;
  const fg = alone ? t.primaryFg : t.ink;
  return (
    <PressableScale
      onPress={cta.onPress}
      disabled={cta.busy}
      disabledOpacity={0.6}
      style={[
        s.btn,
        alone ? s.grow : s.outline,
        { borderColor: t.outline },
        fill,
      ]}
    >
      {cta.busy ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <Text numberOfLines={1} style={[s.btnText, { color: fg }]}>
          {cta.label}
        </Text>
      )}
    </PressableScale>
  );
}

export const CtaBar = React.memo(function CtaBar(p: Props) {
  const { t } = p;
  if (!p.primary && !p.secondary) return null;
  return (
    <View style={s.row}>
      {p.primary ? <Primary cta={p.primary} t={t} /> : null}
      {p.secondary ? (
        <Secondary cta={p.secondary} t={t} alone={!p.primary} />
      ) : null}
    </View>
  );
});

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  grow: { flex: 1 },
  outline: { borderWidth: 1, flexShrink: 1 },
  btnText: { fontFamily: F.sans700, fontSize: 14, letterSpacing: -0.1 },
});

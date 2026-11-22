import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import type { PageTheme } from './theme';

/**
 * The CTA row at the bottom of each template's details box.
 * With an accent ("Buy plan"): an outline "Customise with AI" beside the
 * orange focus button, and an app's play button ("Run it live") first.
 * Otherwise a dark primary pill and an outline secondary.
 * A button is only rendered when it can do something — never a dead one.
 */

export type Cta = {
  label: string;
  onPress: () => void;
  busy?: boolean;
  /** The page's focus ("Buy plan"): filled brand orange. */
  accent?: boolean;
  /** A small second line under the label (what the plan unlocks). */
  sub?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

/** The brand orange (splash / Pricing band). */
const ORANGE = '#EB4709';

/** The focus button: filled orange, a little wider than its neighbour,
 *  with a small line under its label ("Unlock 1000+ templates"). */
function Accent({ cta }: { cta: Cta }) {
  return (
    <PressableScale
      haptic="press"
      onPress={cta.onPress}
      disabled={cta.busy}
      disabledOpacity={0.8}
      accessibilityLabel={cta.sub ? `${cta.label}, ${cta.sub}` : cta.label}
      style={[s.btn, s.tall, s.accent, { backgroundColor: ORANGE }]}
    >
      {cta.busy ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          <Text numberOfLines={1} style={[s.btnText, s.accentText]}>
            {cta.label}
          </Text>
          {cta.sub ? (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={s.accentSub}
            >
              {cta.sub}
            </Text>
          ) : null}
        </>
      )}
    </PressableScale>
  );
}

type Props = {
  t: PageTheme;
  primary: Cta | null;
  secondary: Cta | null;
  /** An app's "Run it live": a square play button at the row's start. */
  run?: Cta | null;
};

function Run({ cta, t, tall }: { cta: Cta; t: PageTheme; tall: boolean }) {
  return (
    <PressableScale
      haptic="press"
      onPress={cta.onPress}
      disabled={cta.busy}
      accessibilityLabel={cta.label}
      style={[s.btn, s.square, tall && s.tall, { borderColor: t.outline }]}
    >
      {cta.busy ? (
        <ActivityIndicator size="small" color={t.ink} />
      ) : (
        <Ionicons name={cta.icon ?? 'play'} size={17} color={t.ink} />
      )}
    </PressableScale>
  );
}

function Primary({ cta, t }: { cta: Cta; t: PageTheme }) {
  return (
    <PressableScale
      haptic="press"
      onPress={cta.onPress}
      disabled={cta.busy}
      style={[s.btn, s.grow, { backgroundColor: t.primaryBg }]}
    >
      {cta.busy ? (
        <ActivityIndicator size="small" color={t.primaryFg} />
      ) : (
        <Text style={[s.btnText, { color: t.primaryFg }]}>{cta.label}</Text>
      )}
    </PressableScale>
  );
}

function Secondary({
  cta,
  t,
  alone,
  tall = false,
}: {
  cta: Cta;
  t: PageTheme;
  alone: boolean;
  tall?: boolean;
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
        tall && s.tall,
        { borderColor: t.outline },
        fill,
      ]}
    >
      {cta.busy ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={s.labelRow}>
          {cta.icon ? <Ionicons name={cta.icon} size={15} color={fg} /> : null}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={[s.btnText, { color: fg }]}
          >
            {cta.label}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

export const CtaBar = React.memo(function CtaBar(p: Props) {
  const { t } = p;
  if (!p.primary && !p.secondary) return null;
  if (p.secondary?.accent) {
    return (
      <View style={s.row}>
        {p.run ? <Run cta={p.run} t={t} tall /> : null}
        {p.primary ? (
          <Secondary cta={p.primary} t={t} alone={false} tall />
        ) : null}
        <Accent cta={p.secondary} />
      </View>
    );
  }
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
  accent: {
    flex: 1.1,
    shadowColor: ORANGE,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  accentText: { color: '#FFFFFF', fontFamily: F.sans800 },
  accentSub: {
    color: 'rgba(255,255,255,0.88)',
    fontFamily: F.sans600,
    fontSize: 11,
    marginTop: 1,
  },
  tall: { height: 50, borderRadius: 13 },
  square: { borderWidth: 1, paddingHorizontal: 0, width: 44 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  outline: { borderWidth: 1, flex: 1 },
  btnText: { fontFamily: F.sans700, fontSize: 14, letterSpacing: -0.1 },
});

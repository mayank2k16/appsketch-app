import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import type { Catalogue } from '@/api/app-cart';
import { type ServicesPalette, StateNote } from '@/components/services';
import { F } from '@/lib/fonts';

import { BuildGrid } from './build-grid';
import { ExtrasGrid } from './extras-grid';
import { StepRail } from './step-rail';
import { SummaryBar } from './summary-bar';
import type { Planner } from './use-planner';

function GroupLabel({
  s,
  title,
  hint,
  locked,
}: {
  s: ServicesPalette;
  title: string;
  hint: string;
  locked?: boolean;
}) {
  return (
    <View style={st.group}>
      <Text style={[st.groupTitle, { color: s.text }]}>{title}</Text>
      <View style={st.hint}>
        {locked ? (
          <Ionicons name="lock-closed" size={10} color={s.muted} />
        ) : null}
        <Text style={[st.hintText, { color: s.muted }]}>{hint}</Text>
      </View>
    </View>
  );
}

function Included({ s, items }: { s: ServicesPalette; items: string[] }) {
  if (!items.length) return null;
  return (
    <View style={st.included}>
      {items.map((x) => (
        <View key={x} style={st.incItem}>
          <Ionicons name="checkmark" size={12} color={s.success} />
          <Text style={[st.incText, { color: s.sub }]}>{x}</Text>
        </View>
      ))}
    </View>
  );
}

function Body({
  s,
  pl,
  cat,
  onBarLayout,
}: {
  s: ServicesPalette;
  pl: Planner;
  cat: Catalogue;
  onBarLayout: (e: LayoutChangeEvent) => void;
}) {
  return (
    <>
      <StepRail s={s} step={pl.step} />
      <GroupLabel
        s={s}
        title="Choose what we build"
        hint="one-time · pick one or more"
      />
      <BuildGrid
        s={s}
        items={pl.builds}
        picked={pl.buildIds}
        nudge={pl.nudge}
        onToggle={pl.toggleBuild}
      />
      {pl.extras.length ? (
        <>
          <GroupLabel
            s={s}
            title="Add extras"
            hint={
              pl.unlocked
                ? 'tap to include · one-time'
                : 'pick a build to unlock'
            }
            locked={!pl.unlocked}
          />
          <ExtrasGrid
            s={s}
            items={pl.extras}
            picked={pl.extraIds}
            unlocked={pl.unlocked}
            onToggle={pl.toggleExtra}
          />
        </>
      ) : null}
      <Included s={s} items={cat.included} />
      <View onLayout={onBarLayout} style={st.barSlot}>
        <SummaryBar s={s} pl={pl} />
      </View>
      <Text style={[st.foot, { color: s.muted }]}>
        Builds are one-time and run on a platform plan. Final quote depends on
        scope.
      </Text>
    </>
  );
}

/** "Launch with our team" — the website's assisted planner, as a game:
 *  pick builds, unlock extras, watch the total count up, check out. */
export function PlannerCard({
  s,
  pl,
  query,
  onBarLayout,
}: {
  s: ServicesPalette;
  pl: Planner;
  query: {
    data?: Catalogue;
    isLoading: boolean;
    isError: boolean;
    refetch: () => unknown;
  };
  onBarLayout: (e: LayoutChangeEvent) => void;
}) {
  return (
    <LinearGradient
      colors={s.plannerGrad}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={[st.card, { borderColor: s.plannerBorder }]}
    >
      <View style={st.eyebrowRow}>
        <View style={[st.dot, { backgroundColor: s.orange }]} />
        <Text style={[st.eyebrow, { color: s.sub }]}>
          Assisted implementation
        </Text>
      </View>
      <Text style={[st.title, { color: s.text }]}>Launch with our team.</Text>
      <Text style={[st.sub, { color: s.sub }]}>
        Design, setup and guided onboarding. Pick what we build, add extras,
        then review.
      </Text>
      {query.data ? (
        <Body s={s} pl={pl} cat={query.data} onBarLayout={onBarLayout} />
      ) : (
        <View style={st.state}>
          <StateNote
            s={s}
            loading={query.isLoading}
            title="Couldn't load our builds"
            note="Prices come live from our team. Check your connection and try again."
            action="Retry"
            onAction={() => void query.refetch()}
          />
        </View>
      )}
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 26, borderWidth: 1, padding: 14, paddingTop: 16 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  eyebrow: {
    fontFamily: F.sans600,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: F.display900,
    fontSize: 22,
    letterSpacing: -0.5,
    marginTop: 6,
  },
  sub: { fontFamily: F.sans400, fontSize: 12.5, lineHeight: 17, marginTop: 3 },
  group: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  groupTitle: { fontFamily: F.sans700, fontSize: 13 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hintText: { fontFamily: F.sans500, fontSize: 11 },
  included: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 4,
    marginTop: 12,
  },
  incItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  incText: { fontFamily: F.sans500, fontSize: 11.5 },
  barSlot: { marginTop: 14 },
  foot: { fontFamily: F.sans400, fontSize: 11, lineHeight: 15, marginTop: 8 },
  state: { marginTop: 14 },
});

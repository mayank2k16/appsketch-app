import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { AppTypeKey } from '@/api/coder';
import { PROMPT_RADIUS } from '@/components/ui/prompt-metrics';
import { SlidingFill } from '@/components/ui/SlidingFill';
import { F } from '@/lib/fonts';
import { type AppColors } from '@/lib/theme';

const TYPE_PILLS: {
  key: AppTypeKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { key: 'web', label: 'Web', icon: 'globe-outline' },
  { key: 'mobile', label: 'App', icon: 'phone-portrait-outline' },
];

/** The prompt card's own curve — the switch sits directly above the card, so
 *  a different radius on each reads as a mismatch rather than as two parts of
 *  one control. See prompt-metrics. */
const RADIUS = PROMPT_RADIUS;
/** Space between the two pills. The separator sits centred in it. */
const GAP = 10;
/** Gap between the track's edge and the sliding fill. */
const PAD = 3;

type Props = {
  t: AppColors;
  value: AppTypeKey;
  onChange: (value: AppTypeKey) => void;
};

// Shared Web/App selector — sits above a `PromptComposer` wherever a
// build's target platform needs picking (the standalone Agent screen, and
// now Home's ClosingCTA composer too).
//
// One track holding a single sliding fill, NOT two independently-filled
// pills. The selection is a thing that travels between the two halves, so
// tapping the inactive side slides the brand gradient across to meet it
// instead of extinguishing one pill and lighting the other.
export function AppTypePills({ t, value, onChange }: Props) {
  const [trackW, setTrackW] = React.useState(0);
  const index = TYPE_PILLS.findIndex((p) => p.key === value);

  return (
    <View
      onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      style={[
        s.track,
        { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder },
      ]}
    >
      {/* Hairline rule between the halves, drawn BEFORE the fill so the fill
          passes over it rather than being cut by it. Absolute, so it takes no
          slot in the row and leaves the two halves exactly equal. */}
      <View style={s.divider} pointerEvents="none" />

      <SlidingFill
        count={TYPE_PILLS.length}
        index={index}
        trackWidth={Math.max(trackW - PAD * 2, 0)}
        radius={RADIUS - PAD}
        inset={PAD}
        gap={GAP}
      />

      {TYPE_PILLS.map((p) => (
        <TypePill
          key={p.key}
          t={t}
          icon={p.icon}
          label={p.label}
          active={p.key === value}
          onPress={() => onChange(p.key)}
        />
      ))}
    </View>
  );
}

// One half of the track. Carries no background of its own — the sliding fill
// behind it is the only thing that marks the selection.
function TypePill({
  t,
  icon,
  label,
  active,
  onPress,
}: {
  t: AppColors;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={s.pill}>
      <Ionicons
        name={icon}
        size={14}
        color={active ? t.agentTabActiveText : t.agentTabIcon}
      />
      <Text
        style={[
          s.label,
          { color: active ? t.agentTabActiveText : t.agentTabText },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: GAP,
    // Anchors the absolutely-positioned divider below.
    position: 'relative',
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: PAD,
    // Clips the fill to the track's curve at both ends of its travel.
    overflow: 'hidden',
  },
  // Faint by design: a separator only has to be findable, not read as an
  // element in its own right — and the fill slides straight over it.
  divider: {
    position: 'absolute',
    left: '50%',
    width: 1,
    top: PAD + 4,
    bottom: PAD + 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
  },
  label: {
    fontFamily: F.sans600,
    fontSize: 12,
  },
});

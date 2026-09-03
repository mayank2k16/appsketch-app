import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { AppTypeKey } from '@/api/coder';
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

/** Matches the prompt card's own ring (`PromptComposer`'s `ringWrap`). The two
 *  sit stacked with a few px between them, so a different curve on each reads
 *  as a mismatch rather than as two parts of one control. */
const RADIUS = 18;
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
      <SlidingFill
        count={TYPE_PILLS.length}
        index={index}
        trackWidth={Math.max(trackW - PAD * 2, 0)}
        radius={RADIUS - PAD}
        inset={PAD}
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
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: PAD,
    // Clips the fill to the track's curve at both ends of its travel.
    overflow: 'hidden',
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

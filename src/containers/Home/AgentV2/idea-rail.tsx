import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

export type Idea = { label: string; prompt: string };

type RailColors = {
  bg: string;
  border: string;
  text: string;
  icon: string;
  activeBg: string;
  activeText: string;
};

/**
 * Starter ideas as one swipeable line of short chips inside the prompt card,
 * replacing the two full-prompt cards that used to sit below it. It's still a
 * guide for a first-time user, but costs one 30px row instead of ~150px, so
 * the template reel comes up into the first screen. A tap writes the full
 * prompt into the field, and the chip whose prompt is in the field stays lit.
 */
export const IdeaRail = React.memo(function IdeaRail({
  ideas,
  current,
  onPick,
  colors: c,
}: {
  ideas: readonly Idea[];
  current: string;
  onPick: (prompt: string) => void;
  colors: RailColors;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={s.rail}
      style={s.scroll}
    >
      {ideas.map((idea) => {
        const on = current.trim() === idea.prompt;
        return (
          <PressableScale
            key={idea.label}
            haptic={false}
            onPress={() => {
              onPick(idea.prompt);
            }}
            accessibilityLabel={`Use idea: ${idea.prompt}`}
            style={[
              s.chip,
              {
                backgroundColor: on ? c.activeBg : c.bg,
                borderColor: on ? c.activeBg : c.border,
              },
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={12}
              color={on ? c.activeText : c.icon}
            />
            <Text
              style={[s.label, { color: on ? c.activeText : c.text }]}
              numberOfLines={1}
            >
              {idea.label}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
});

const s = StyleSheet.create({
  // Bleeds to the card's inner edges so chips slide out of view cleanly.
  scroll: { marginHorizontal: -4, flexGrow: 0 },
  rail: { gap: 6, paddingHorizontal: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: { fontFamily: F.sans500, fontSize: 12 },
});

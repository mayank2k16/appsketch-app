import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { ActivityStep } from '@/api/coder';
import { AnimatedGradientText } from '@/components/ui/GradientText';
import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

import { PulsingDot } from './PulsingDot';

const MONO_FONT = Platform.OS === 'ios' ? 'Menlo-Regular' : 'monospace';

function ToolChip({
  tool,
  active,
  colors,
}: {
  tool: string;
  active: boolean;
  colors: AppColors;
}) {
  return (
    <View
      style={[
        st.chip,
        {
          backgroundColor: active
            ? colors.codeEditorToolChipActiveBg
            : colors.codeEditorToolChipBg,
          borderColor: active
            ? colors.codeEditorToolChipActiveBorder
            : colors.codeEditorToolChipBorder,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: MONO_FONT,
          fontSize: 10,
          color: active
            ? colors.codeEditorToolChipActiveText
            : colors.codeEditorToolChipText,
        }}
      >
        {tool}
      </Text>
    </View>
  );
}

function TimelineRow({
  step,
  active,
  showLine,
  colors,
}: {
  step: ActivityStep;
  active: boolean;
  showLine: boolean;
  colors: AppColors;
}) {
  return (
    <View style={st.tlRow}>
      <View style={st.tlRail}>
        <PulsingDot
          active={active}
          color={
            active
              ? colors.codeEditorTimelineActive
              : colors.codeEditorTimelineDone
          }
          size={9}
        />
        {showLine ? (
          <View
            style={[
              st.tlLine,
              { backgroundColor: colors.codeEditorTimelineLine },
            ]}
          />
        ) : null}
      </View>

      <View style={[st.tlBody, { paddingBottom: showLine ? 12 : 0 }]}>
        {active ? (
          <AnimatedGradientText
            style={{ fontFamily: F.sans600, fontSize: 12.5, lineHeight: 17 }}
            baseColor={colors.codeEditorText}
            highlightColor={colors.codeEditorShimmerHighlight}
            sweepDuration={1800}
          >
            {step.text}
          </AnimatedGradientText>
        ) : (
          <Text
            style={{
              fontFamily: F.sans500,
              fontSize: 12.5,
              lineHeight: 17,
              color: colors.codeEditorActivityText,
            }}
          >
            {step.text}
          </Text>
        )}
        {step.tool ? (
          <ToolChip tool={step.tool} active={active} colors={colors} />
        ) : null}
      </View>
    </View>
  );
}

function ActivityHeader({
  expanded,
  count,
  onToggle,
  colors,
}: {
  expanded: boolean;
  count: number;
  onToggle: () => void;
  colors: AppColors;
}) {
  return (
    <TouchableOpacity onPress={onToggle} style={st.header} activeOpacity={0.7}>
      <Ionicons
        name="sparkles-outline"
        size={13}
        color={colors.codeEditorActivityText}
      />
      <Text
        style={[
          st.headerText,
          { color: colors.codeEditorActivityText, fontFamily: F.sans700 },
        ]}
      >
        {expanded
          ? 'Agent activity'
          : `Agent worked · ${count} step${count === 1 ? '' : 's'}`}
      </Text>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={13}
        color={colors.codeEditorActivityText}
      />
    </TouchableOpacity>
  );
}

/** Collapsible "what the agent is doing" feed, styled as a connected step
 * timeline (Cursor/Emergent-style live progress) rather than a flat log:
 * finished steps get a solid dot, the step running right now — the last
 * entry while `busy` is true — gets a pulsing dot and a shimmer sweep
 * across its label. */
export function ActivityStream({
  steps,
  busy,
  colors,
}: {
  steps: ActivityStep[];
  busy: boolean;
  colors: AppColors;
}) {
  const [expanded, setExpanded] = React.useState(false);
  if (steps.length === 0) return null;

  const visible = expanded ? steps : steps.slice(-1);
  const lastIndex = steps.length - 1;

  return (
    <View
      style={[
        st.wrap,
        {
          backgroundColor: colors.codeEditorActivityBg,
          borderColor: colors.codeEditorActivityBorder,
        },
      ]}
    >
      <ActivityHeader
        expanded={expanded}
        count={steps.length}
        onToggle={() => setExpanded((e) => !e)}
        colors={colors}
      />

      <View style={st.timeline}>
        {visible.map((step, i) => {
          const originalIndex = expanded ? i : lastIndex;
          const isActive = busy && originalIndex === lastIndex;
          const isLastVisible = i === visible.length - 1;
          return (
            <TimelineRow
              key={step.id}
              step={step}
              active={isActive}
              showLine={!isLastVisible}
              colors={colors}
            />
          );
        })}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 14,
    marginBottom: 10,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    flex: 1,
    fontSize: 11.5,
  },
  timeline: {
    paddingLeft: 2,
  },
  tlRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tlRail: {
    width: 16,
    alignItems: 'center',
  },
  tlLine: {
    flex: 1,
    width: 1,
    marginTop: 3,
  },
  tlBody: {
    flex: 1,
    minWidth: 0,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 5,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});

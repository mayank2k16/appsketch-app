import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  type TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';

import type { ActivityStep } from '@/api/coder';
import { AnimatedGradientText } from '@/components/ui/GradientText';
import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

import { PulsingDot } from './PulsingDot';

const MONO_FONT = Platform.OS === 'ios' ? 'Menlo-Regular' : 'monospace';

/** Fades + slides a row in on mount (once — reusing a step's `id` as the
 * list `key` means an in-place update, like a `todos` checklist tick,
 * re-renders the same instance instead of remounting it). */
function AnimatedRow({ children }: { children: React.ReactNode }) {
  const progress = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [6, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

/** Plain text, or a shimmer sweep when this row is the one currently
 * running — the "something is happening right now" cue, shared by every
 * row kind below. */
function ActiveLabel({
  text,
  active,
  style,
  colors,
}: {
  text: string;
  active: boolean;
  style: TextStyle;
  colors: AppColors;
}) {
  if (!active) return <Text style={style}>{text}</Text>;
  return (
    <AnimatedGradientText
      style={style}
      baseColor={colors.codeEditorText}
      highlightColor={colors.codeEditorShimmerHighlight}
      sweepDuration={1800}
    >
      {text}
    </AnimatedGradientText>
  );
}

function Badge({
  label,
  bg,
  color,
}: {
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <View style={[st.badge, { backgroundColor: bg }]}>
      <Text style={[st.badgeText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

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

/** `node` / `step` / `thinking` — the label and an optional tool chip. No
 * dot of its own: the timeline rail this sits inside already draws one. */
function StepRow({
  step,
  active,
  colors,
}: {
  step: ActivityStep;
  active: boolean;
  colors: AppColors;
}) {
  return (
    <View style={st.rowInlineBody}>
      <ActiveLabel
        text={step.text}
        active={active}
        colors={colors}
        style={{
          fontFamily: active ? F.sans600 : F.sans500,
          fontSize: 12.5,
          lineHeight: 17,
          color: colors.codeEditorActivityText,
        }}
      />
      {step.tool ? (
        <ToolChip tool={step.tool} active={active} colors={colors} />
      ) : null}
    </View>
  );
}

function PlanBody({ step, colors }: { step: ActivityStep; colors: AppColors }) {
  return (
    <View style={st.body}>
      {step.steps && step.steps.length > 0 ? (
        <>
          <Text style={[st.sectionLabel, { color: colors.textMuted }]}>
            Steps
          </Text>
          {step.steps.map((s, i) => (
            <Text
              key={i}
              style={[st.bodyLine, { color: colors.codeEditorActivityText }]}
            >
              {i + 1}. {s}
            </Text>
          ))}
        </>
      ) : null}
      {step.done && step.done.length > 0 ? (
        <>
          <Text
            style={[st.sectionLabel, { color: colors.textMuted, marginTop: 8 }]}
          >
            Done when
          </Text>
          {step.done.map((s, i) => (
            <View key={i} style={st.checkRow}>
              <Text
                style={[st.checkMark, { color: colors.codeEditorTimelineDone }]}
              >
                ✓
              </Text>
              <Text
                style={[st.bodyLine, { color: colors.codeEditorActivityText }]}
              >
                {s}
              </Text>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

/** `plan` — PLAN badge + summary, expands into a Steps list and a
 * "Done when" checklist. */
function PlanRow({
  step,
  active,
  colors,
}: {
  step: ActivityStep;
  active: boolean;
  colors: AppColors;
}) {
  const [open, setOpen] = React.useState(false);
  const hasBody = (step.steps?.length ?? 0) > 0 || (step.done?.length ?? 0) > 0;

  return (
    <View>
      <TouchableOpacity
        style={st.actRow}
        activeOpacity={0.7}
        disabled={!hasBody}
        onPress={() => setOpen((o) => !o)}
      >
        <Badge
          label="PLAN"
          bg={colors.codeEditorToolChipActiveBg}
          color={colors.codeEditorToolChipActiveText}
        />
        <View style={st.actTextWrap}>
          <ActiveLabel
            text={step.summary || step.text}
            active={active}
            colors={colors}
            style={st.actText}
          />
        </View>
        {hasBody ? (
          <Ionicons
            name={open ? 'chevron-down' : 'chevron-forward'}
            size={12}
            color={colors.textMuted}
          />
        ) : null}
      </TouchableOpacity>
      {open ? <PlanBody step={step} colors={colors} /> : null}
    </View>
  );
}

/** `todos` — the agent's live build checklist. Always expanded (it IS the
 * content, not a summary of it) and updates in place as items complete. */
function TodosRow({
  step,
  active,
  colors,
}: {
  step: ActivityStep;
  active: boolean;
  colors: AppColors;
}) {
  const items = step.items ?? [];
  const doneN = items.filter((x) => x.status === 'done').length;

  return (
    <View>
      <View style={st.actRow}>
        <Badge
          label={`TASKS ${doneN}/${items.length}`}
          bg={colors.codeEditorTodosBadgeBg}
          color={colors.codeEditorTodosBadgeText}
        />
        <View style={st.actTextWrap}>
          <ActiveLabel
            text="Build checklist"
            active={active}
            colors={colors}
            style={st.actText}
          />
        </View>
      </View>
      <View style={st.todoList}>
        {items.map((it, i) => (
          <View key={i} style={st.todoRow}>
            <Text
              style={[
                st.todoMark,
                {
                  color:
                    it.status === 'done'
                      ? colors.codeEditorTimelineDone
                      : it.status === 'doing'
                        ? colors.codeEditorTimelineActive
                        : colors.textMuted,
                },
              ]}
            >
              {it.status === 'done' ? '✓' : it.status === 'doing' ? '…' : '○'}
            </Text>
            <Text
              style={[
                st.todoText,
                {
                  color:
                    it.status === 'done'
                      ? colors.textMuted
                      : colors.codeEditorActivityText,
                  fontFamily: it.status === 'doing' ? F.sans600 : F.sans400,
                  textDecorationLine:
                    it.status === 'done' ? 'line-through' : 'none',
                },
              ]}
            >
              {it.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** `review` — the self-review verdict against the plan. */
function ReviewRow({
  step,
  active,
  colors,
}: {
  step: ActivityStep;
  active: boolean;
  colors: AppColors;
}) {
  const [open, setOpen] = React.useState(false);
  const hasGaps = (step.gaps?.length ?? 0) > 0;

  return (
    <View>
      <TouchableOpacity
        style={st.actRow}
        activeOpacity={0.7}
        disabled={!hasGaps}
        onPress={() => setOpen((o) => !o)}
      >
        <Badge
          label={step.ok ? 'REVIEW ✓' : 'REVIEW'}
          bg={
            step.ok
              ? colors.codeEditorReviewOkBg
              : colors.codeEditorReviewWarnBg
          }
          color={
            step.ok
              ? colors.codeEditorReviewOkText
              : colors.codeEditorReviewWarnText
          }
        />
        <View style={st.actTextWrap}>
          <ActiveLabel
            text={step.text}
            active={active}
            colors={colors}
            style={st.actText}
          />
        </View>
        {hasGaps ? (
          <Ionicons
            name={open ? 'chevron-down' : 'chevron-forward'}
            size={12}
            color={colors.textMuted}
          />
        ) : null}
      </TouchableOpacity>
      {open && hasGaps ? (
        <View style={st.body}>
          {(step.gaps ?? []).map((g, i) => (
            <View key={i} style={st.checkRow}>
              <Text style={[st.checkMark, { color: colors.codeEditorAmber }]}>
                •
              </Text>
              <Text
                style={[st.bodyLine, { color: colors.codeEditorActivityText }]}
              >
                {g}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ActivityRow({
  step,
  active,
  colors,
}: {
  step: ActivityStep;
  active: boolean;
  colors: AppColors;
}) {
  switch (step.kind) {
    case 'plan':
      return <PlanRow step={step} active={active} colors={colors} />;
    case 'todos':
      return <TodosRow step={step} active={active} colors={colors} />;
    case 'review':
      return <ReviewRow step={step} active={active} colors={colors} />;
    default:
      return <StepRow step={step} active={active} colors={colors} />;
  }
}

/** The only "this row is live" cue that isn't text — a thin bar to the left
 * of the row's content, pulsing between two fixed shades of the accent. No
 * background fill anywhere; the row sits on the same flat surface as the
 * rest of the card. */
function ActiveAccentBar({ color }: { color: string }) {
  const progress = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });
  return (
    <Animated.View
      style={[st.activeBar, { backgroundColor: color, opacity }]}
    />
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
          <View style={st.tlBodyRow}>
            <ActiveAccentBar color={colors.codeEditorTimelineActive} />
            <View style={st.tlBodyRowContent}>
              <ActivityRow step={step} active={active} colors={colors} />
            </View>
          </View>
        ) : (
          <ActivityRow step={step} active={active} colors={colors} />
        )}
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

/** A finished turn's steps — collapsed by default behind "Agent worked · N
 * steps"; every row renders as done (a finished turn's last step is, by
 * definition, no longer running). */
export function ActivityStream({
  steps,
  colors,
}: {
  steps: ActivityStep[];
  colors: AppColors;
}) {
  const [expanded, setExpanded] = React.useState(false);
  if (steps.length === 0) return null;

  const visible = expanded ? steps : steps.slice(-1);

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
        {visible.map((step, i) => (
          <TimelineRow
            key={step.id}
            step={step}
            active={false}
            showLine={i !== visible.length - 1}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
}

/** The turn currently in flight — never collapsed, "Working…" header, every
 * step visible as it arrives, the last one shimmering + pulsing. */
export function LiveActivity({
  steps,
  colors,
}: {
  steps: ActivityStep[];
  colors: AppColors;
}) {
  if (steps.length === 0) return null;
  const lastIndex = steps.length - 1;

  return (
    <View
      style={[
        st.wrap,
        {
          backgroundColor: colors.codeEditorChatAssistantBg,
          borderColor: colors.codeEditorBorder,
        },
      ]}
    >
      <View style={st.header}>
        <PulsingDot active color={colors.codeEditorTimelineActive} size={8} />
        <Text
          style={[
            st.headerText,
            { color: colors.codeEditorTimelineActive, fontFamily: F.sans700 },
          ]}
        >
          Working…
        </Text>
      </View>
      <View style={st.timeline}>
        {steps.map((step, i) => (
          <AnimatedRow key={step.id}>
            <TimelineRow
              step={step}
              active={i === lastIndex}
              showLine={i !== lastIndex}
              colors={colors}
            />
          </AnimatedRow>
        ))}
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
    gap: 8,
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
  tlBodyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tlBodyRowContent: {
    flex: 1,
    minWidth: 0,
  },
  activeBar: {
    width: 2,
    borderRadius: 1,
    alignSelf: 'stretch',
  },
  rowInlineBody: {
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
  badge: {
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'flex-start',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: F.sans700,
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  actRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  actText: {
    fontFamily: F.sans600,
    fontSize: 12.5,
    color: '#dbe1f2',
  },
  body: {
    paddingTop: 8,
    paddingLeft: 2,
  },
  sectionLabel: {
    fontFamily: F.sans700,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bodyLine: {
    fontFamily: F.sans400,
    fontSize: 12,
    lineHeight: 17,
    marginVertical: 2,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: 2,
  },
  checkMark: {
    fontFamily: F.sans700,
    fontSize: 12,
    lineHeight: 17,
  },
  todoList: {
    marginTop: 8,
    gap: 5,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  todoMark: {
    width: 14,
    fontFamily: F.sans700,
    fontSize: 12,
  },
  todoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});

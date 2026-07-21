import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ActivityStep } from '@/api/coder';
import type { AppColors } from '@/lib/theme';

const KIND_ICON: Record<ActivityStep['kind'], React.ComponentProps<typeof Ionicons>['name']> = {
  node: 'git-commit-outline',
  step: 'hammer-outline',
  thinking: 'bulb-outline',
};

/** Collapsible "what the agent is doing" feed — ported from Vite's
 * `ActivityStream.jsx`, minus the per-step diff accordion (file diffs aren't
 * shown inline in v1; the Code tab always reflects the latest file state). */
export function ActivityStream({ steps, colors }: { steps: ActivityStep[]; colors: AppColors }) {
  const [expanded, setExpanded] = React.useState(false);
  if (steps.length === 0) return null;

  const visible = expanded ? steps : steps.slice(-1);

  return (
    <View style={[st.wrap, { backgroundColor: colors.codeEditorActivityBg, borderColor: colors.codeEditorActivityBorder }]}>
      <TouchableOpacity onPress={() => setExpanded((e) => !e)} style={st.header} activeOpacity={0.7}>
        <Ionicons name="sparkles-outline" size={13} color={colors.codeEditorActivityText} />
        <Text style={[st.headerText, { color: colors.codeEditorActivityText }]}>
          {expanded ? 'Agent activity' : `Agent worked · ${steps.length} step${steps.length === 1 ? '' : 's'}`}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={13}
          color={colors.codeEditorActivityText}
        />
      </TouchableOpacity>

      {visible.map((step) => (
        <View key={step.id} style={st.row}>
          <Ionicons name={KIND_ICON[step.kind]} size={12} color={colors.codeEditorActivityText} />
          <Text style={[st.rowText, { color: colors.codeEditorActivityText }]} numberOfLines={expanded ? undefined : 1}>
            {step.text}
            {step.tool ? ` (${step.tool})` : ''}
          </Text>
        </View>
      ))}
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
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingLeft: 4,
  },
  rowText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
});

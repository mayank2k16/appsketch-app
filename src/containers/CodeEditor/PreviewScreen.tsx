import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { previewUrlForTenant } from '@/api/coder';
import { PressableScale } from '@/components/ui';
import {
  appTheme,
  BRAND_MID,
  brandGradient,
  type useAppTheme,
  useCoderTheme,
} from '@/lib/theme';

import { useCodeEditor } from './CodeEditorProvider';
import { LivePreviewWebView } from './Preview/LivePreviewWebView';
import { MobileExpoPreview } from './Preview/MobileExpoPreview';

const IN_PROGRESS_STATUSES = new Set([
  'QUEUED',
  'PREPARING',
  'INSTALLING_DEPS',
  'BUILDING',
  'DEPLOYING',
]);

function deployCopy(inProgress: boolean, done: boolean, failed: boolean) {
  if (inProgress) return { icon: null, label: 'Deploying…' } as const;
  if (done) return { icon: 'checkmark-circle', label: 'Deployed' } as const;
  if (failed) return { icon: 'alert-circle', label: 'Retry deploy' } as const;
  return { icon: 'rocket-outline', label: 'Deploy' } as const;
}

function DeployButton({
  deploying,
  status,
  onPress,
  colors,
}: {
  deploying: boolean;
  status: string | null;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>;
}) {
  const inProgress =
    deploying || (status ? IN_PROGRESS_STATUSES.has(status) : false);
  const failed = status === 'FAILED';
  const done = status === 'COMPLETED' && !inProgress;
  // White: Deploy is this screen's one highlighted action, so it is the flat
  // orange accent (the brand ramp is reserved for the logo there).
  const light = colors.statusBar !== 'light-content';
  const copy = deployCopy(inProgress, done, failed);

  return (
    <PressableScale
      haptic={inProgress ? false : 'press'}
      // Not `disabled`: that would force 50% opacity; the in-progress pill
      // keeps its own 0.7 dim while it ignores taps.
      onPress={inProgress ? undefined : onPress}
      accessibilityState={{ disabled: inProgress }}
      style={[
        st.deployBtn,
        light && !failed && { backgroundColor: appTheme.light.accent },
        failed && { backgroundColor: colors.codeEditorDanger },
        inProgress && { opacity: 0.7 },
      ]}
    >
      {/* Deploy is the one irreversible action on this screen and was a flat
          white pill — the brightest thing above the user's own rendered site.
          It takes the ramp, except when it has FAILED, where the danger
          colour has to win over the brand. */}
      {!failed && !light && (
        <LinearGradient
          colors={brandGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {copy.icon === null ? (
        <ActivityIndicator size="small" color={light ? '#FFFFFF' : undefined} />
      ) : (
        <Ionicons name={copy.icon} size={14} color="#FFFFFF" />
      )}
      <Text style={st.deployLabel}>{copy.label}</Text>
    </PressableScale>
  );
}

// eslint-disable-next-line max-lines-per-function -- one switch over the preview kinds
export function PreviewScreen() {
  const { colorScheme } = useColorScheme();
  const t = useCoderTheme(colorScheme);
  const { params, threadId, buildLog, previewMode, setPreviewMode } =
    useCodeEditor();
  const { status, deploying, startBuild } = buildLog;
  const editing = previewMode !== null;
  // The edit state is magenta in dark; white keeps to ink + one orange (which
  // Deploy owns), so "editing" reads as the inverted ink chip instead.
  const light = colorScheme !== 'dark';
  const editTint = light ? t.text : BRAND_MID;
  const editWash = light ? t.accentSoft : `${BRAND_MID}1F`;

  const livePreviewUrl = params.tenantUid
    ? previewUrlForTenant(params.tenantUid)
    : undefined;

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <View style={[st.header, { borderColor: t.border }]}>
        <PressableScale
          haptic="rigid"
          onPress={() => setPreviewMode(editing ? null : 'select')}
          style={[
            st.statusToggle,
            {
              backgroundColor: editing ? editWash : t.codeEditorTabBg,
              borderColor: editing ? editTint : t.codeEditorBorder,
            },
          ]}
        >
          <View
            style={[
              st.statusDot,
              {
                backgroundColor: editing ? editTint : t.codeEditorConnectedDot,
              },
            ]}
          />
          <Text style={[st.title, { color: editing ? editTint : t.text }]}>
            {editing ? 'Edit' : 'Preview'}
          </Text>
          <Ionicons
            name={editing ? 'checkmark-circle' : 'create-outline'}
            size={13}
            color={editing ? editTint : t.textSub}
          />
        </PressableScale>
        <DeployButton
          deploying={deploying}
          status={status}
          colors={t}
          onPress={() => startBuild(threadId ?? undefined)}
        />
      </View>

      {params.appType === 'mobile' ? (
        <MobileExpoPreview
          tenantId={params.tenantId}
          tenantUid={params.tenantUid}
          colors={t}
        />
      ) : livePreviewUrl ? (
        <LivePreviewWebView
          url={livePreviewUrl}
          colors={t}
          tenantId={params.tenantId}
        />
      ) : (
        <View style={st.center}>
          <Text style={{ color: t.textSub }}>
            Your preview will appear here once the agent starts building.
          </Text>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 14.5, fontWeight: '700' },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  deployBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    // Clips the gradient fill to the pill.
    overflow: 'hidden',
  },
  deployLabel: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
});

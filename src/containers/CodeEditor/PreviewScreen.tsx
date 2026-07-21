import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { previewUrlForTenant } from '@/api/coder';
import { useAppTheme } from '@/lib/theme';

import { useCodeEditor } from './CodeEditorProvider';
import { LivePreviewWebView } from './Preview/LivePreviewWebView';
import { MobileExpoPreview } from './Preview/MobileExpoPreview';

const IN_PROGRESS_STATUSES = new Set(['QUEUED', 'PREPARING', 'INSTALLING_DEPS', 'BUILDING', 'DEPLOYING']);

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
  const inProgress = deploying || (status ? IN_PROGRESS_STATUSES.has(status) : false);
  const failed = status === 'FAILED';
  const done = status === 'COMPLETED' && !inProgress;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inProgress}
      style={[
        st.deployBtn,
        { backgroundColor: failed ? colors.codeEditorDanger : colors.accent },
        inProgress && { opacity: 0.7 },
      ]}
    >
      {inProgress ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Ionicons name={done ? 'checkmark-circle' : failed ? 'alert-circle' : 'rocket-outline'} size={14} color="#FFFFFF" />
      )}
      <Text style={st.deployLabel}>{inProgress ? 'Deploying…' : done ? 'Deployed' : failed ? 'Retry deploy' : 'Deploy'}</Text>
    </TouchableOpacity>
  );
}

export function PreviewScreen() {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const { params, threadId, buildLog } = useCodeEditor();
  const { status, deploying, startBuild } = buildLog;

  const livePreviewUrl = params.tenantUid ? previewUrlForTenant(params.tenantUid) : undefined;

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <View style={[st.header, { borderColor: t.border }]}>
        <Text style={[st.title, { color: t.text }]}>Preview</Text>
        <DeployButton
          deploying={deploying}
          status={status}
          colors={t}
          onPress={() => startBuild(threadId ?? undefined)}
        />
      </View>

      {params.appType === 'mobile' ? (
        <MobileExpoPreview tenantId={params.tenantId} colors={t} />
      ) : livePreviewUrl ? (
        <LivePreviewWebView url={livePreviewUrl} colors={t} />
      ) : (
        <View style={st.center}>
          <Text style={{ color: t.textSub }}>Your preview will appear here once the agent starts building.</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  deployBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  deployLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});

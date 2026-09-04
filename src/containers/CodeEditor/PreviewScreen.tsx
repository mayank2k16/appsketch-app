import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { previewUrlForTenant } from '@/api/coder';
import {
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

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inProgress}
      style={[
        st.deployBtn,
        failed && { backgroundColor: colors.codeEditorDanger },
        inProgress && { opacity: 0.7 },
      ]}
    >
      {/* Deploy is the one irreversible action on this screen and was a flat
          white pill — the brightest thing above the user's own rendered site.
          It takes the ramp, except when it has FAILED, where the danger
          colour has to win over the brand. */}
      {!failed && (
        <LinearGradient
          colors={brandGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {inProgress ? (
        <ActivityIndicator size="small" />
      ) : (
        <Ionicons
          name={
            done
              ? 'checkmark-circle'
              : failed
                ? 'alert-circle'
                : 'rocket-outline'
          }
          size={14}
          color="#FFFFFF"
        />
      )}
      <Text style={st.deployLabel}>
        {inProgress
          ? 'Deploying…'
          : done
            ? 'Deployed'
            : failed
              ? 'Retry deploy'
              : 'Deploy'}
      </Text>
    </TouchableOpacity>
  );
}

export function PreviewScreen() {
  const { colorScheme } = useColorScheme();
  const t = useCoderTheme(colorScheme);
  const { params, threadId, buildLog, previewMode, setPreviewMode } =
    useCodeEditor();
  const { status, deploying, startBuild } = buildLog;
  const editing = previewMode !== null;

  const livePreviewUrl = params.tenantUid
    ? previewUrlForTenant(params.tenantUid)
    : undefined;

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <View style={[st.header, { borderColor: t.border }]}>
        <TouchableOpacity
          onPress={() => setPreviewMode(editing ? null : 'select')}
          activeOpacity={0.75}
          style={[
            st.statusToggle,
            {
              backgroundColor: editing ? `${BRAND_MID}1F` : t.codeEditorTabBg,
              borderColor: editing ? BRAND_MID : t.codeEditorBorder,
            },
          ]}
        >
          <View
            style={[
              st.statusDot,
              {
                backgroundColor: editing ? BRAND_MID : t.codeEditorConnectedDot,
              },
            ]}
          />
          <Text style={[st.title, { color: editing ? BRAND_MID : t.text }]}>
            {editing ? 'Edit' : 'Preview'}
          </Text>
          <Ionicons
            name={editing ? 'checkmark-circle' : 'create-outline'}
            size={13}
            color={editing ? BRAND_MID : t.textSub}
          />
        </TouchableOpacity>
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

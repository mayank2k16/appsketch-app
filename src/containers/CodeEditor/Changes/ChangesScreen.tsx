import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { RepoChangedFile, RepoStatus } from '@/api/coder';
import {
  buildOAuthStartUrl,
  connectRepo,
  getRepoDiff,
  getRepoStatus,
  openPr,
} from '@/api/coder';
import { useAppTheme } from '@/lib/theme';
import { toast } from '@/lib/toast';

import { useCodeEditor } from '../CodeEditorProvider';

const STATUS_LABEL: Record<string, string> = {
  M: 'modified',
  A: 'added',
  D: 'deleted',
  R: 'renamed',
  '??': 'new',
  AM: 'added',
};

function DiffLine({
  line,
  colors,
}: {
  line: string;
  colors: ReturnType<typeof useAppTheme>;
}) {
  let color: string = colors.text;
  let bg: string | undefined;
  if (line.startsWith('+++') || line.startsWith('---')) {
    color = colors.diffMeta;
  } else if (line.startsWith('@@')) {
    color = colors.accent;
  } else if (line.startsWith('+')) {
    color = colors.diffAddedText;
    bg = colors.diffAddedBg;
  } else if (line.startsWith('-')) {
    color = colors.diffRemovedText;
    bg = colors.diffRemovedBg;
  } else if (line.startsWith('diff --git') || line.startsWith('index ')) {
    color = colors.diffMeta;
  }
  return (
    <Text
      style={[st.diffLine, { color, backgroundColor: bg }]}
      numberOfLines={1}
    >
      {line || ' '}
    </Text>
  );
}

/** Connect-a-repo form — PAT paste is the fully-wired primary path (always
 * available per the backend docs); the OAuth buttons open the provider's
 * consent page in the system browser as a best-effort secondary path, since
 * this app has no registered deep-link callback to complete an in-app
 * session-polling flow. */
function ConnectRepoForm({ onConnected }: { onConnected: () => void }) {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const { params } = useCodeEditor();

  const [repoUrl, setRepoUrl] = React.useState('');
  const [token, setToken] = React.useState('');
  const [connecting, setConnecting] = React.useState(false);

  async function handleConnect() {
    if (!repoUrl.trim()) {
      toast.error('Enter a repository URL.');
      return;
    }
    setConnecting(true);
    try {
      await connectRepo(params.tenantId, {
        repoUrl: repoUrl.trim(),
        token: token.trim() || undefined,
      });
      toast.success('Cloning your repository…');
      onConnected();
    } catch {
      toast.error("Couldn't connect that repository. Check the URL and token.");
    } finally {
      setConnecting(false);
    }
  }

  function openProviderConsent(provider: string) {
    Linking.openURL(buildOAuthStartUrl(provider));
  }

  return (
    <ScrollView contentContainerStyle={st.connectWrap}>
      <Ionicons name="git-branch-outline" size={28} color={t.accent} />
      <Text style={[st.connectTitle, { color: t.text }]}>
        Connect a repository
      </Text>
      <Text style={[st.connectSub, { color: t.textSub }]}>
        Import an existing Git repo so the agent edits your real codebase in
        place — changes show up here as a diff you can review and open as a Pull
        Request.
      </Text>

      <TextInput
        value={repoUrl}
        onChangeText={setRepoUrl}
        placeholder="https://github.com/you/your-repo"
        placeholderTextColor={t.codeEditorTextMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          st.input,
          {
            color: t.text,
            borderColor: t.codeEditorBorder,
            backgroundColor: t.codeEditorSurface,
          },
        ]}
      />
      <TextInput
        value={token}
        onChangeText={setToken}
        placeholder="Personal access token (private repos)"
        placeholderTextColor={t.codeEditorTextMuted}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        style={[
          st.input,
          {
            color: t.text,
            borderColor: t.codeEditorBorder,
            backgroundColor: t.codeEditorSurface,
          },
        ]}
      />

      <TouchableOpacity
        onPress={handleConnect}
        disabled={connecting}
        style={[st.connectBtn, { backgroundColor: t.accent }]}
      >
        {connecting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={st.connectBtnText}>Connect repository</Text>
        )}
      </TouchableOpacity>

      <Text style={[st.orText, { color: t.codeEditorTextMuted }]}>
        or connect via browser
      </Text>
      <View style={st.oauthRow}>
        {['github', 'gitlab', 'bitbucket'].map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => openProviderConsent(p)}
            style={[
              st.oauthBtn,
              {
                borderColor: t.codeEditorBorder,
                backgroundColor: t.codeEditorTabBg,
              },
            ]}
          >
            <Text
              style={{
                color: t.text,
                fontSize: 12,
                fontWeight: '700',
                textTransform: 'capitalize',
              }}
            >
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[st.oauthHint, { color: t.codeEditorTextMuted }]}>
        After authorizing in the browser, come back here and pull to refresh.
      </Text>
    </ScrollView>
  );
}

export function ChangesScreen() {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const { params } = useCodeEditor();
  const tenantId = params.tenantId;

  const [repo, setRepo] = React.useState<RepoStatus | null>(null);
  const [checking, setChecking] = React.useState(true);
  const [diff, setDiff] = React.useState('');
  const [files, setFiles] = React.useState<RepoChangedFile[]>([]);
  const [loadingDiff, setLoadingDiff] = React.useState(false);
  const [title, setTitle] = React.useState('AppSketch: update');
  const [prUrl, setPrUrl] = React.useState('');
  const [prBusy, setPrBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const checkStatus = React.useCallback(async () => {
    setChecking(true);
    try {
      const status = await getRepoStatus(tenantId);
      setRepo(status);
      if (status.last_pr_url) setPrUrl(status.last_pr_url);
    } catch {
      setRepo(null);
    } finally {
      setChecking(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const loadDiff = React.useCallback(async () => {
    setLoadingDiff(true);
    setError('');
    try {
      const res = await getRepoDiff(tenantId);
      setDiff(res.diff || '');
      setFiles(res.status?.files ?? []);
    } catch {
      setError("Couldn't load changes.");
    } finally {
      setLoadingDiff(false);
    }
  }, [tenantId]);

  const isCloned = repo?.kind === 'cloned';
  const isReady =
    isCloned && (repo?.status === 'READY' || repo?.previewable !== undefined);

  React.useEffect(() => {
    if (isReady) void loadDiff();
  }, [isReady, loadDiff]);

  async function handleOpenPr() {
    setPrBusy(true);
    setError('');
    try {
      const res = await openPr(tenantId, title);
      if (res.ok && res.url) setPrUrl(res.url);
      else setError(res.error || "Couldn't open the pull request.");
    } catch {
      setError("Couldn't open the pull request.");
    } finally {
      setPrBusy(false);
    }
  }

  if (checking) {
    return (
      <View style={[st.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="small" color={t.accent} />
      </View>
    );
  }

  if (!isCloned) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <ConnectRepoForm onConnected={checkStatus} />
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={[st.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="small" color={t.accent} />
        <Text style={{ color: t.textSub, marginTop: 10 }}>
          Cloning your repository…
        </Text>
        <TouchableOpacity
          onPress={checkStatus}
          style={[st.refreshBtn, { backgroundColor: t.accent }]}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12.5 }}>
            Check again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const clean = files.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={[st.head, { borderColor: t.codeEditorBorder }]}>
        <View style={{ flex: 1 }}>
          <View style={st.branchRow}>
            <Ionicons name="git-branch-outline" size={13} color={t.textSub} />
            <Text style={{ color: t.textSub, fontSize: 12, fontWeight: '600' }}>
              {repo?.working_branch || 'working branch'}
            </Text>
          </View>
          {repo?.origin_url ? (
            <Text
              style={{ color: t.codeEditorTextMuted, fontSize: 11 }}
              numberOfLines={1}
            >
              {repo.origin_url
                .replace(/^https?:\/\//, '')
                .replace(/\.git$/, '')}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={loadDiff} hitSlop={8}>
          <Ionicons name="refresh" size={18} color={t.text} />
        </TouchableOpacity>
      </View>

      {loadingDiff ? (
        <View style={st.center}>
          <ActivityIndicator size="small" color={t.accent} />
        </View>
      ) : clean ? (
        <View style={[st.center, { paddingHorizontal: 32 }]}>
          <Text
            style={{
              fontSize: 28,
              color: t.codeEditorConnectedDot,
              marginBottom: 10,
            }}
          >
            ✓
          </Text>
          <Text
            style={{
              color: t.text,
              fontWeight: '700',
              fontSize: 15,
              marginBottom: 6,
            }}
          >
            No changes yet
          </Text>
          <Text
            style={{ color: t.textSub, fontSize: 12.5, textAlign: 'center' }}
          >
            Ask the agent to make a change — its edits show up here as a diff
            you can review and open as a Pull Request.
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          <View style={st.filesList}>
            <Text
              style={{
                color: t.textSub,
                fontSize: 11.5,
                fontWeight: '700',
                marginBottom: 8,
              }}
            >
              {files.length} changed file{files.length > 1 ? 's' : ''}
            </Text>
            {files.map((f) => (
              <View key={f.path} style={st.fileRow}>
                <Text
                  style={{
                    color: t.accent,
                    fontSize: 10.5,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                  }}
                >
                  {STATUS_LABEL[f.status] ?? f.status}
                </Text>
                <Text style={{ color: t.text, fontSize: 12 }} numberOfLines={1}>
                  {f.path}
                </Text>
              </View>
            ))}
          </View>
          <ScrollView horizontal style={st.diffWrap}>
            <View>
              {(diff || '(no textual diff)').split('\n').map((line, i) => (
                <DiffLine key={i} line={line} colors={t} />
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}

      <View style={[st.foot, { borderColor: t.codeEditorBorder }]}>
        {prUrl ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(prUrl)}
            style={st.prOpenedRow}
          >
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={t.codeEditorConnectedDot}
            />
            <Text
              style={{
                color: t.codeEditorConnectedDot,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              Pull request opened — view it ↗
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Pull request title"
              placeholderTextColor={t.codeEditorTextMuted}
              style={[
                st.prTitleInput,
                { color: t.text, borderColor: t.codeEditorBorder },
              ]}
            />
            <TouchableOpacity
              onPress={handleOpenPr}
              disabled={clean || prBusy}
              style={[
                st.prBtn,
                { backgroundColor: t.accent },
                (clean || prBusy) && { opacity: 0.5 },
              ]}
            >
              {prBusy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={st.prBtnText}>Open Pull Request</Text>
              )}
            </TouchableOpacity>
          </>
        )}
        {error ? (
          <Text style={{ color: t.codeEditorDanger, fontSize: 11.5 }}>
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  refreshBtn: {
    marginTop: 14,
    height: 36,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectWrap: { padding: 24, alignItems: 'center', gap: 10 },
  connectTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  connectSub: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  input: {
    alignSelf: 'stretch',
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  connectBtn: {
    alignSelf: 'stretch',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  connectBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13.5 },
  orText: { fontSize: 11.5, marginTop: 10 },
  oauthRow: { flexDirection: 'row', gap: 8 },
  oauthBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  oauthHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  filesList: { padding: 14 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  diffWrap: { paddingHorizontal: 14, paddingBottom: 14 },
  diffLine: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 11.5,
    lineHeight: 16,
  },
  foot: { padding: 14, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  prTitleInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  prBtn: {
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13.5 },
  prOpenedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 8,
  },
});

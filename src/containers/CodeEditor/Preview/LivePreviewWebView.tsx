import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type WebViewType from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

import type { AppColors } from '@/lib/theme';
import { toast } from '@/lib/toast';

import { useCodeEditor } from '../CodeEditorProvider';
import { INSPECTOR_SCRIPT } from '../Inspector/injectedScript';
import { InspectorOverlay } from '../Inspector/InspectorOverlay';

// `react-native-webview` has no RN-Web implementation (same guard used by
// `AppPreviewScreen`) — the web build falls back to a plain DOM `<iframe>`.
let WebView: React.ComponentType<any> | null = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  WebView = require('react-native-webview').WebView;
}
const isWeb = Platform.OS === 'web';

/** Captures uncaught page errors/rejections + `console.error` calls and
 * forwards them to RN via `postMessage` — the direct RN analog of Vite's
 * same-origin `contentDocument`/`contentWindow` reach-through (Vite needed
 * that hack because its preview sits in a same-origin iframe under a parent
 * page; here the WebView IS the whole page, so injecting straight into it
 * is simpler and doesn't depend on any origin match). */
const ERROR_CAPTURE_JS = `
(function () {
  function post(type, payload) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload }));
    }
  }
  window.addEventListener('error', function (e) {
    post('runtime_error', { message: e.message, filename: e.filename, lineno: e.lineno });
  });
  window.addEventListener('unhandledrejection', function (e) {
    post('runtime_error', { message: String(e.reason) });
  });
  var origConsoleError = console.error;
  console.error = function () {
    post('console_error', { message: Array.prototype.slice.call(arguments).map(String).join(' ') });
    origConsoleError.apply(console, arguments);
  };
  true;
})();
`;

// Both scripts run once per page load — error capture always, the inspector
// content-script guards itself against double-injection (`if
// (window.__cwInspector) return;`), so combining them here is safe.
const COMBINED_INJECTED_JS = `${ERROR_CAPTURE_JS}\n${INSPECTOR_SCRIPT}`;

export function LivePreviewWebView({
  url,
  colors,
  tenantId,
}: {
  url: string;
  colors: AppColors;
  tenantId: string;
}) {
  const { send } = useCodeEditor();

  const [status, setStatus] = React.useState<'loading' | 'loaded' | 'error'>(
    'loading'
  );
  const [reloadKey, setReloadKey] = React.useState(0);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [bridgeMessage, setBridgeMessage] = React.useState<{
    type: string;
    payload?: Record<string, unknown>;
  } | null>(null);

  const webviewRef = React.useRef<WebViewType | null>(null);
  const captureContainerRef = React.useRef<View | null>(null);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as {
        type: string;
        payload?: Record<string, unknown>;
      };
      if (msg.type === 'runtime_error' || msg.type === 'console_error') {
        setPreviewError(
          (msg.payload?.message as string) ?? 'A runtime error occurred.'
        );
      } else if (msg.type.startsWith('inspector:')) {
        setBridgeMessage(msg);
      }
    } catch {
      // ignore malformed bridge messages
    }
  }

  function handleAskAiToFix() {
    if (!previewError) return;
    send(`The preview is showing this error, please fix it:\n${previewError}`);
    setPreviewError(null);
    toast.success('Sent to the agent — check the Chat tab.');
  }

  return (
    <View
      ref={captureContainerRef}
      style={{ flex: 1, backgroundColor: colors.bg }}
      collapsable={false}
    >
      {isWeb
        ? React.createElement('iframe', {
            key: reloadKey,
            src: url,
            style: {
              ...StyleSheet.absoluteFillObject,
              border: 0,
              width: '100%',
              height: '100%',
            },
            onLoad: () => setStatus('loaded'),
          })
        : WebView && (
            <WebView
              key={reloadKey}
              ref={webviewRef}
              source={{ uri: url }}
              style={StyleSheet.absoluteFill}
              injectedJavaScript={COMBINED_INJECTED_JS}
              onMessage={handleMessage}
              onLoadStart={() => setStatus('loading')}
              onLoadEnd={() => setStatus((s) => (s === 'error' ? s : 'loaded'))}
              onError={() => setStatus('error')}
              onHttpError={() => setStatus('error')}
            />
          )}

      {/* Web-only fallback (our own dev-preview verification path) has no
          WebView ref to drive injectedJavaScript from, so the inspector is
          native-only — exactly where the real app runs anyway. */}
      {!isWeb && status === 'loaded' && (
        <InspectorOverlay
          webviewRef={webviewRef}
          captureRef={captureContainerRef}
          tenantId={tenantId}
          bridgeMessage={bridgeMessage}
        />
      )}

      {status === 'loading' && (
        <View
          style={[
            st.center,
            StyleSheet.absoluteFill,
            { backgroundColor: colors.bg },
          ]}
          pointerEvents="none"
        >
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={{ color: colors.textSub, marginTop: 8 }}>
            Loading your preview…
          </Text>
        </View>
      )}

      {status === 'error' && (
        <View
          style={[
            st.center,
            StyleSheet.absoluteFill,
            { backgroundColor: colors.bg },
          ]}
        >
          <Text
            style={{ color: colors.text, fontWeight: '700', marginBottom: 4 }}
          >
            Couldn&rsquo;t load the preview
          </Text>
          <Text
            style={{ color: colors.textSub, fontSize: 12.5, marginBottom: 16 }}
          >
            Check your connection and try again.
          </Text>
          <TouchableOpacity
            onPress={() => setReloadKey((k) => k + 1)}
            style={[st.retryBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={st.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {previewError ? (
        <View
          style={[
            st.errorBanner,
            {
              backgroundColor: colors.codeEditorSurface,
              borderColor: colors.codeEditorDanger,
            },
          ]}
        >
          <Ionicons
            name="warning-outline"
            size={16}
            color={colors.codeEditorDanger}
          />
          <Text
            style={{ color: colors.text, fontSize: 12, flex: 1 }}
            numberOfLines={2}
          >
            {previewError}
          </Text>
          <TouchableOpacity
            onPress={handleAskAiToFix}
            style={[st.fixBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={st.fixBtnText}>Ask AI to fix</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  retryBtn: {
    height: 38,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  errorBanner: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fixBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  fixBtnText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' },
});

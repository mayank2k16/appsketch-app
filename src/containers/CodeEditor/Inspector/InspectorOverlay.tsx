import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Keyboard,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import type WebView from 'react-native-webview';

import {
  uploadAsset,
  visualEditSrc,
  visualEditStyle,
  visualEditText,
} from '@/api/coder';
import { RotatingBorderGradient } from '@/components/ui/RotatingBorderGradient';
import { useBrandedCoderTheme } from '@/lib/theme';
import { toast } from '@/lib/toast';

import type { PreviewEditMode } from '../CodeEditorProvider';
import { useCodeEditor } from '../CodeEditorProvider';

type InspectorMode = PreviewEditMode;

/** Border thickness and one-turn duration for the toolbar's animated ring —
 * same values as the bottom tab bar (`GlowTabBar`), since the point of this
 * treatment is that the two read as the same live control. */
const RING_W = 1;
const BAR_RADIUS = 20;
const BAR_SPIN_MS = 8000;
const RING_STOPS: [number, number, number] = [0, 0.5, 1];

type Selection = {
  tag: string;
  src: string;
  selector: string;
  color: string;
  bg: string;
  fontSize: number;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  padding: number;
  radius: number;
};

type BridgeMessage = { type: string; payload?: Record<string, unknown> } | null;

const WEIGHTS = ['300', '400', '500', '600', '700', '800', '900'];

/** "color: red; font-size: 12px" → { color: "red", "font-size": "12px" } —
 * ported verbatim from Vite's `ElementPanel.jsx` `parseCss`. */
function parseCss(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  String(text || '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(';')
    .forEach((d) => {
      const i = d.indexOf(':');
      if (i < 0) return;
      const k = d.slice(0, i).trim();
      const v = d
        .slice(i + 1)
        .trim()
        .replace(/!important/gi, '')
        .trim();
      if (/^-?[a-z][a-z-]*$/i.test(k) && v) out[k] = v;
    });
  return out;
}

function pointsToPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points.reduce(
    (d, p, i) => `${d}${i === 0 ? 'M' : 'L'} ${p.x} ${p.y} `,
    ''
  );
}

/**
 * Direct, deterministic edits over the live preview — no AI turn involved
 * (ported from Vite's `Inspector.jsx`). Select/text modes drive the real DOM
 * inside the WebView via `INSPECTOR_SCRIPT`; annotate mode is a native touch
 * overlay + `react-native-view-shot` capture, since there's no DOM canvas to
 * draw on from the RN side.
 */
export function InspectorOverlay({
  webviewRef,
  captureRef: containerRef,
  tenantId,
  bridgeMessage,
}: {
  webviewRef: React.RefObject<WebView | null>;
  captureRef: React.RefObject<View | null>;
  tenantId: string;
  bridgeMessage: BridgeMessage;
}) {
  const { colorScheme } = useColorScheme();
  const t = useBrandedCoderTheme(colorScheme);
  const router = useRouter();
  const {
    send,
    previewMode: mode,
    setPreviewMode: setMode,
    setPendingChatImage,
    focusChatComposer,
  } = useCodeEditor();

  const [selection, setSelection] = React.useState<Selection | null>(null);
  const [toastMsg, setToastMsg] = React.useState('');
  const [strokes, setStrokes] = React.useState<{ x: number; y: number }[][]>(
    []
  );
  const [activeStroke, setActiveStroke] = React.useState<
    { x: number; y: number }[]
  >([]);
  const [capturing, setCapturing] = React.useState(false);
  // The panel is an absolutely-positioned overlay outside any
  // KeyboardAvoidingView (that only wraps the chat composer), so nothing
  // moves it when a field's keyboard opens — it just sits under it. Track the
  // keyboard's own height and lift the panel by exactly that much instead.
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  React.useEffect(() => {
    const showEvt =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e: { endCoordinates: { height: number } }) =>
      setKeyboardHeight(e.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);
    const subShow = Keyboard.addListener(showEvt, onShow);
    const subHide = Keyboard.addListener(hideEvt, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  const [customCss, setCustomCss] = React.useState('');
  const lastSelectorRef = React.useRef<string | null>(null);
  // A fresh element's textarea starts empty rather than carrying over the
  // previous element's declarations — those already applied via `setStyle`
  // where relevant; nothing here is meant to persist across a selection.
  React.useEffect(() => {
    if (selection && selection.selector !== lastSelectorRef.current) {
      lastSelectorRef.current = selection.selector;
      setCustomCss('');
    }
  }, [selection]);

  const pendingStyles = React.useRef<Record<string, string>>({});
  const persistTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMessageRef = React.useRef<BridgeMessage>(null);

  function flash(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2400);
  }

  function runInWebView(js: string) {
    webviewRef.current?.injectJavaScript(`${js}; true;`);
  }

  function setInspectorMode(next: InspectorMode) {
    setMode((prev) => (prev === next ? null : next));
  }

  // The single place `mode` actually takes effect — fires the same way
  // whether it changed via a toolbar tap (`setInspectorMode` above) or the
  // header's Preview/Edit toggle (`PreviewScreen`, driven off the same
  // `previewMode` context value), so neither path can leave the WebView's
  // own inspector script or a stale selection out of sync with the other.
  const prevModeRef = React.useRef<InspectorMode>(mode);
  React.useEffect(() => {
    setSelection(null);
    setStrokes([]);
    setActiveStroke([]);
    const scriptMode = mode === 'annotate' ? null : mode;
    runInWebView(
      `window.__cwInspector && window.__cwInspector.setMode(${scriptMode ? `'${scriptMode}'` : 'null'})`
    );
    // Only the ON transition gets a toast — the point is telling the user
    // swipe just locked, not narrating every tap of the toolbar.
    if (prevModeRef.current === null && mode !== null) {
      toast.success('Editor mode on — swipe is locked while you edit.');
    }
    prevModeRef.current = mode;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ── react to messages relayed up from the WebView ───────────────────────
  React.useEffect(() => {
    if (!bridgeMessage || bridgeMessage === lastMessageRef.current) return;
    lastMessageRef.current = bridgeMessage;

    if (bridgeMessage.type === 'inspector:selected') {
      setSelection(bridgeMessage.payload as unknown as Selection);
    } else if (bridgeMessage.type === 'inspector:text_edit') {
      const { old: oldText, new: newText } = bridgeMessage.payload as {
        old: string;
        new: string;
      };
      visualEditText(tenantId, oldText, newText)
        .then((res) => {
          if (!res.ok) {
            runInWebView('window.__cwInspector.revertText()');
            flash(
              res.reason === 'not_unique'
                ? 'That text appears more than once — edit it in Code'
                : "Couldn't match that text"
            );
          }
        })
        .catch(() => {
          runInWebView('window.__cwInspector.revertText()');
          flash("Couldn't save that edit");
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridgeMessage, tenantId]);

  function schedulePersist(selector: string) {
    clearTimeout(persistTimer.current ?? undefined);
    persistTimer.current = setTimeout(async () => {
      const styles = pendingStyles.current;
      pendingStyles.current = {};
      if (Object.keys(styles).length === 0) return;
      try {
        const res = await visualEditStyle(tenantId, selector, styles);
        if (!res.ok)
          flash(
            res.reason === 'unsupported_mobile'
              ? 'Live styling is web-only'
              : "Couldn't save that style"
          );
      } catch {
        flash("Couldn't save that style");
      }
    }, 320);
  }

  function setStyle(
    cssProp: string,
    cssValue: string,
    patch: Partial<Selection>
  ) {
    if (!selection) return;
    setSelection((prev) => (prev ? { ...prev, ...patch } : prev));
    runInWebView(
      `window.__cwInspector.applyStyle(${JSON.stringify(selection.selector)}, ${JSON.stringify({ [cssProp]: cssValue })})`
    );
    pendingStyles.current[cssProp] = cssValue;
    schedulePersist(selection.selector);
  }

  /** Apply a batch of raw CSS declarations at once — the Custom CSS
   * textarea's escape hatch for anything the structured fields above don't
   * cover, same live-preview + debounced-persist path as `setStyle`. */
  function applyRawStyles(styles: Record<string, string>) {
    if (!selection || Object.keys(styles).length === 0) return;
    runInWebView(
      `window.__cwInspector.applyStyle(${JSON.stringify(selection.selector)}, ${JSON.stringify(styles)})`
    );
    Object.assign(pendingStyles.current, styles);
    schedulePersist(selection.selector);
  }

  function closePanel() {
    setSelection(null);
    runInWebView('window.__cwInspector.clearSelection()');
  }

  async function pickReplacementAsset() {
    if (!selection) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      toast.error('Media library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    flash('Uploading…');
    try {
      const up = await uploadAsset(tenantId, {
        uri: asset.uri,
        name: asset.fileName || `upload-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
      if (!up.ok || !up.url) {
        flash('Upload failed');
        return;
      }
      const res = await visualEditSrc(tenantId, selection.src, up.url);
      if (res.ok) {
        runInWebView(
          `window.__cwInspector.replaceSrc(${JSON.stringify(selection.selector)}, ${JSON.stringify(up.url)})`
        );
        flash('Replaced ✓');
      } else {
        flash("Couldn't replace this asset");
      }
    } catch {
      flash('Upload failed');
    }
  }

  function askAiForAsset() {
    if (!selection) return;
    send(
      `Replace the ${selection.tag} (current src: ${selection.src || 'n/a'}) with a new, more fitting ${selection.tag === 'video' ? 'video' : 'image'}.`
    );
    closePanel();
  }

  // ── annotate: native touch drawing ──────────────────────────────────────
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => mode === 'annotate',
        onMoveShouldSetPanResponder: () => mode === 'annotate',
        onPanResponderGrant: (evt) => {
          // Pull the coordinates out synchronously — Fabric pools/recycles
          // this event shortly after the handler returns, so `evt` (and
          // `evt.nativeEvent`) can be null by the time a setState updater
          // function actually runs, which happens on a later render pass,
          // not necessarily within this call.
          const { locationX, locationY } = evt.nativeEvent;
          setActiveStroke([{ x: locationX, y: locationY }]);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          setActiveStroke((prev) => [...prev, { x: locationX, y: locationY }]);
        },
        onPanResponderRelease: () => {
          setActiveStroke((prev) => {
            if (prev.length > 1) setStrokes((s) => [...s, prev]);
            return [];
          });
        },
      }),
    [mode]
  );

  function clearStrokes() {
    setStrokes([]);
    setActiveStroke([]);
  }

  async function sendAnnotation() {
    if (!containerRef.current) return;
    setCapturing(true);
    try {
      const uri = await captureRef(containerRef.current, {
        format: 'png',
        result: 'data-uri',
      });
      // Hands the screenshot to the Chat tab as a pending attachment instead
      // of sending it straight away — the marks only say WHERE, not what
      // should change there, so the user still needs to type that part
      // before this is worth a turn. Used to fire a canned message right
      // from here with the screen never leaving Preview, so the composer
      // never actually opened for them to add that context.
      setPendingChatImage(uri);
      clearStrokes();
      setMode(null);
      router.navigate('/code-editor/chat');
      focusChatComposer();
    } catch {
      toast.error("Couldn't capture the screenshot.");
    } finally {
      setCapturing(false);
    }
  }

  const isAsset =
    selection &&
    (selection.tag === 'img' ||
      selection.tag === 'video' ||
      selection.tag === 'source');

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {mode === 'annotate' && (
        <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
          <Svg style={StyleSheet.absoluteFill}>
            {strokes.map((s, i) => (
              <Path
                key={i}
                d={pointsToPath(s)}
                stroke="#FF4D4F"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {activeStroke.length > 0 && (
              <Path
                d={pointsToPath(activeStroke)}
                stroke="#FF4D4F"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>
        </View>
      )}

      {selection && mode === 'select' && (
        <View
          pointerEvents="box-none"
          style={[st.panelWrap, { bottom: 62 + keyboardHeight }]}
        >
          <View
            style={[
              st.panel,
              {
                backgroundColor: t.codeEditorSurface,
                borderColor: t.codeEditorBorder,
              },
            ]}
          >
            <View style={st.panelHead}>
              <Text
                style={{
                  color: t.textSub,
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}
              >
                {selection.tag}
              </Text>
              <Text
                style={{
                  color: t.text,
                  fontSize: 13,
                  fontWeight: '700',
                  flex: 1,
                }}
              >
                Edit element
              </Text>
              <TouchableOpacity onPress={closePanel} hitSlop={8}>
                <Ionicons name="close" size={18} color={t.textSub} />
              </TouchableOpacity>
            </View>

            {isAsset ? (
              <View style={st.assetRow}>
                <TouchableOpacity
                  onPress={pickReplacementAsset}
                  style={[st.smallBtn, { backgroundColor: t.accent }]}
                >
                  <Text style={st.smallBtnPrimaryText}>
                    Upload {selection.tag === 'video' ? 'video' : 'image'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={askAiForAsset}
                  style={[
                    st.smallBtn,
                    {
                      backgroundColor: t.codeEditorTabBg,
                      borderWidth: 1,
                      borderColor: t.codeEditorBorder,
                    },
                  ]}
                >
                  <Text
                    style={{ color: t.text, fontSize: 12, fontWeight: '700' }}
                  >
                    ✦ Ask AI
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={st.grid}>
                <View style={st.gridRow}>
                  <View style={st.gridCell}>
                    <Text style={st.gridLabel}>Text</Text>
                    <TextInput
                      value={selection.color}
                      onChangeText={(v) => setStyle('color', v, { color: v })}
                      style={[
                        st.hexInput,
                        { color: t.text, borderColor: t.codeEditorBorder },
                      ]}
                    />
                  </View>
                  <View style={st.gridCell}>
                    <Text style={st.gridLabel}>Fill</Text>
                    <View style={st.fillRow}>
                      <TextInput
                        value={selection.bg}
                        onChangeText={(v) =>
                          setStyle('background-color', v, { bg: v })
                        }
                        placeholder="none"
                        placeholderTextColor={t.codeEditorTextMuted}
                        style={[
                          st.hexInput,
                          {
                            flex: 1,
                            color: t.text,
                            borderColor: t.codeEditorBorder,
                          },
                        ]}
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setStyle('background-color', 'transparent', {
                            bg: '',
                          })
                        }
                        style={[
                          st.clearFillBtn,
                          { borderColor: t.codeEditorBorder },
                        ]}
                      >
                        <Text style={{ color: t.textSub }}>⌀</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={st.gridCell}>
                    <Text style={st.gridLabel}>Size</Text>
                    <TextInput
                      value={String(selection.fontSize)}
                      onChangeText={(v) =>
                        setStyle('font-size', `${Number(v) || 0}px`, {
                          fontSize: Number(v) || 0,
                        })
                      }
                      keyboardType="numeric"
                      style={[
                        st.hexInput,
                        { color: t.text, borderColor: t.codeEditorBorder },
                      ]}
                    />
                  </View>
                </View>
                <View style={st.gridRow}>
                  <View style={st.gridCell}>
                    <Text style={st.gridLabel}>Weight</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const idx = WEIGHTS.indexOf(selection.fontWeight);
                        const next = WEIGHTS[(idx + 1) % WEIGHTS.length];
                        setStyle('font-weight', next, { fontWeight: next });
                      }}
                      style={[
                        st.hexInput,
                        st.centeredCell,
                        { borderColor: t.codeEditorBorder },
                      ]}
                    >
                      <Text
                        style={{
                          color: t.text,
                          fontSize: 12.5,
                          fontWeight: '700',
                        }}
                      >
                        {selection.fontWeight}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={st.gridCell}>
                    <Text style={st.gridLabel}>Padding</Text>
                    <TextInput
                      value={String(selection.padding)}
                      onChangeText={(v) =>
                        setStyle('padding', `${Number(v) || 0}px`, {
                          padding: Number(v) || 0,
                        })
                      }
                      keyboardType="numeric"
                      style={[
                        st.hexInput,
                        { color: t.text, borderColor: t.codeEditorBorder },
                      ]}
                    />
                  </View>
                  <View style={st.gridCell}>
                    <Text style={st.gridLabel}>Radius</Text>
                    <TextInput
                      value={String(selection.radius)}
                      onChangeText={(v) =>
                        setStyle('border-radius', `${Number(v) || 0}px`, {
                          radius: Number(v) || 0,
                        })
                      }
                      keyboardType="numeric"
                      style={[
                        st.hexInput,
                        { color: t.text, borderColor: t.codeEditorBorder },
                      ]}
                    />
                  </View>
                </View>
              </View>
            )}

            {!isAsset && (
              <View style={st.alignRow}>
                {(['left', 'center', 'right'] as const).map((a) => (
                  <TouchableOpacity
                    key={a}
                    onPress={() => setStyle('text-align', a, { textAlign: a })}
                    style={[
                      st.alignBtn,
                      { borderColor: t.codeEditorBorder },
                      selection.textAlign === a && {
                        backgroundColor: t.accent,
                        borderColor: t.accent,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        a === 'left'
                          ? 'menu-outline'
                          : a === 'center'
                            ? 'reorder-two-outline'
                            : 'menu-outline'
                      }
                      size={14}
                      color={selection.textAlign === a ? '#FFFFFF' : t.text}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* <View style={st.cssSection}>
              <Text style={st.gridLabel}>Custom CSS</Text>
              <TextInput
                value={customCss}
                onChangeText={setCustomCss}
                placeholder={
                  'backdrop-filter: blur(6px);\nbox-shadow: 0 8px 24px rgba(0,0,0,.35);'
                }
                placeholderTextColor={t.codeEditorTextMuted}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                textAlignVertical="top"
                style={[
                  st.cssInput,
                  {
                    color: t.text,
                    borderColor: t.codeEditorBorder,
                    backgroundColor: t.codeEditorTabBg,
                  },
                ]}
              />
              <View style={st.cssActions}>
                <TouchableOpacity
                  onPress={() => setCustomCss('')}
                  disabled={!customCss.trim()}
                  style={[
                    st.cssBtn,
                    {
                      backgroundColor: t.codeEditorTabBg,
                      borderColor: t.codeEditorBorder,
                    },
                    !customCss.trim() && st.cssBtnDisabled,
                  ]}
                >
                  <Text style={{ color: t.text, fontSize: 12, fontWeight: '700' }}>
                    Clear
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const styles = parseCss(customCss);
                    if (Object.keys(styles).length === 0) return;
                    applyRawStyles(styles);
                    flash('CSS applied ✓');
                  }}
                  disabled={!customCss.trim()}
                  style={[
                    st.cssBtn,
                    st.cssBtnPrimary,
                    { backgroundColor: t.accent },
                    !customCss.trim() && st.cssBtnDisabled,
                  ]}
                >
                  <Text style={st.smallBtnPrimaryText}>Apply CSS</Text>
                </TouchableOpacity>
              </View>
            </View> */}

            <Text style={[st.advancedHint, { color: t.textSub }]}>
              For gradients, shadows, layout and animation, use the web builder
              — the desktop editor has the full property panel.
            </Text>
          </View>
        </View>
      )}

      {/* floating 3-mode toolbar — a pill with the same rotating brand-ramp
          edge as the bottom tab bar (`GlowTabBar`): a ring that reserves
          RING_W and clips the spinning gradient, with an OPAQUE inner pill
          on top so only the edge shows the sweep. */}
      <View style={st.barPositioner} pointerEvents="box-none">
        <View style={st.ring}>
          <RotatingBorderGradient
            colors={[...t.agentBorderGradient]}
            locations={RING_STOPS}
            durationMs={BAR_SPIN_MS}
          />
          <View style={[st.barInner, { backgroundColor: t.codeEditorSurface }]}>
            <TouchableOpacity
              onPress={() => setInspectorMode('select')}
              style={[
                st.modeBtn,
                mode === 'select' && { backgroundColor: t.accent },
              ]}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={mode === 'select' ? t.accentOn : t.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setInspectorMode('text')}
              style={[
                st.modeBtn,
                mode === 'text' && { backgroundColor: t.accent },
              ]}
            >
              <Ionicons
                name="text-outline"
                size={16}
                color={mode === 'text' ? t.accentOn : t.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setInspectorMode('annotate')}
              style={[
                st.modeBtn,
                mode === 'annotate' && { backgroundColor: t.accent },
              ]}
            >
              <Ionicons
                name="brush-outline"
                size={16}
                color={mode === 'annotate' ? t.accentOn : t.text}
              />
            </TouchableOpacity>

            {mode === 'annotate' && (
              <>
                <TouchableOpacity onPress={clearStrokes} style={st.textBtn}>
                  <Text
                    style={{
                      color: t.textSub,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    Clear
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={sendAnnotation}
                  disabled={capturing || strokes.length === 0}
                  style={st.textBtn}
                >
                  <Text
                    style={{ color: t.accent, fontSize: 12, fontWeight: '700' }}
                  >
                    {capturing ? 'Sending…' : 'Add to chat'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {toastMsg ? (
          <View
            style={[
              st.toast,
              {
                backgroundColor: t.codeEditorSurface,
                borderColor: t.codeEditorBorder,
              },
            ]}
          >
            <Text style={{ color: t.text, fontSize: 11.5 }}>{toastMsg}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  panelWrap: {
    position: 'absolute',
    left: 10,
    right: 10,
    // `bottom` is set inline (base 62 + live keyboard height) — see the
    // `keyboardHeight` effect above.
  },
  panel: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  assetRow: { flexDirection: 'row', gap: 8 },
  smallBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnPrimaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  // Explicit rows of equal-`flex` cells rather than `width: '31%'` items left
  // to wrap — percentage widths plus `gap` don't sum back to the row's true
  // width in Yoga, so the third column drifted narrower/misaligned depending
  // on device width. `flex: 1` guarantees three equal thirds every time.
  grid: { gap: 8 },
  gridRow: { flexDirection: 'row', gap: 8 },
  gridCell: { flex: 1, gap: 4 },
  fillRow: { flexDirection: 'row', gap: 4 },
  centeredCell: { alignItems: 'center', justifyContent: 'center' },
  gridLabel: {
    fontSize: 9.5,
    color: '#8A8A8E',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  hexInput: {
    height: 32,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 11.5,
  },
  clearFillBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cssSection: { gap: 6 },
  cssInput: {
    minHeight: 60,
    maxHeight: 110,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 11.5,
  },
  cssActions: { flexDirection: 'row', gap: 8 },
  cssBtn: {
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cssBtnPrimary: { flex: 1, borderWidth: 0 },
  cssBtnDisabled: { opacity: 0.4 },
  advancedHint: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  alignRow: { flexDirection: 'row', gap: 6 },
  alignBtn: {
    width: 34,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barPositioner: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  // Outer layer: reserves RING_W and clips the spinning gradient to the
  // pill's silhouette — same two-layer construction as the tab bar's `ring`.
  ring: {
    borderRadius: BAR_RADIUS,
    overflow: 'hidden',
    padding: RING_W,
  },
  barInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: BAR_RADIUS - RING_W,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  toast: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});

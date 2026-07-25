import CodeEditor from '@rivascva/react-native-code-editor';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { getFile, saveFile } from '@/api/coder';
import { useAppTheme } from '@/lib/theme';

import { useCodeEditor } from '../CodeEditorProvider';
import { vsDarkSyntaxStyle, vsLightSyntaxStyle } from './codeEditorSyntaxTheme';

const SAVE_DEBOUNCE_MS = 700;

// `@rivascva/react-native-code-editor` scrolls by mirroring an invisible
// `TextInput`'s native `onScroll` onto the (non-scrollable) syntax
// highlighter behind it — on web that mirror never fires reliably (a
// programmatic or wheel-driven scrollTop change on the textarea doesn't
// dispatch a 'scroll' event react-native-web forwards), so the highlighted
// text just sits pinned in place no matter how far the caret is scrolled.
// Sidestepping that entirely: give the editor a real pixel height sized to
// fit its full content (so nothing needs to scroll *inside* it) and let a
// plain `ScrollView` — the same primitive the Chat tab already scrolls
// with — own the actual scrolling.
const LINE_HEIGHT = 22; // matches `highlighterLineHeight` below
const EDITOR_PADDING = 12; // matches `padding` below
const EXTRA_LINES_BUFFER = 4; // SyntaxHighlighter appends its own trailing blank lines, plus slack for wrapped long lines

/** `Languages` isn't re-exported from the package's public index (only the
 * component, `CodeEditorStyleType`, and `CodeEditorSyntaxStyles` are) — these
 * string literals are valid members of that union, so the cast at the call
 * site is just bridging a missing type export, not widening the real type. */
function languageForPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'md':
      return 'markdown';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'html':
      return 'xml';
    case 'py':
      return 'python';
    default:
      return 'plaintext';
  }
}

export function CodeEditorPane({ path }: { path: string }) {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const { params, openFiles, setOpenFileContent } = useCodeEditor();

  const [content, setContent] = React.useState<string | null>(
    openFiles[path] ?? null
  );
  const [loading, setLoading] = React.useState(openFiles[path] === undefined);
  // Real pixel height for the editor (see the note above the constants):
  // starts at a reasonable guess so the background fills the screen before
  // `onLayout` reports the true value, then grows with the line count as
  // the file loads or the user types past what it was sized for.
  const [viewportHeight, setViewportHeight] = React.useState(
    () => Dimensions.get('window').height - 150
  );
  const [lineCount, setLineCount] = React.useState(
    () => (openFiles[path] ?? '').split('\n').length
  );

  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the last content we know is real (non-empty, server-confirmed) so
  // a stray blank save (e.g. a slow initial load racing a remount) can never
  // clobber good code with an empty file — same guard as Vite's
  // `onEditorChange` against the backend's own empty-write refusal.
  const lastKnownGoodRef = React.useRef('');

  React.useEffect(() => {
    let cancelled = false;

    const cached = openFiles[path];
    if (cached !== undefined) {
      setContent(cached);
      setLineCount(cached.split('\n').length);
      lastKnownGoodRef.current = cached;
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    getFile(params.tenantId, path)
      .then((file) => {
        if (cancelled) return;
        setContent(file.content);
        setLineCount(file.content.split('\n').length);
        lastKnownGoodRef.current = file.content;
        setOpenFileContent(path, file.content);
      })
      .catch(() => {
        if (!cancelled) setContent('');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  React.useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );

  // Memoized so its identity is stable across unrelated re-renders (e.g. a
  // chat token arriving updates provider state, which would otherwise
  // re-render this component and hand the library a new `onChange`
  // function every time). The library has its own internal
  // `useEffect(() => onChange(value), [onChange, value])` — an
  // ever-changing `onChange` reference makes that effect refire on every
  // render regardless of whether the value changed, and since this handler
  // itself triggers a state update, that becomes an infinite loop.
  const handleChange = React.useCallback(
    (next: string) => {
      setOpenFileContent(path, next);
      setLineCount(next.split('\n').length);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (!next.trim() && lastKnownGoodRef.current.trim()) return;
        lastKnownGoodRef.current = next;
        void saveFile(params.tenantId, path, next);
      }, SAVE_DEBOUNCE_MS);
    },
    [path, params.tenantId, setOpenFileContent]
  );

  if (loading || content === null) {
    return (
      <View style={[st.center, { backgroundColor: t.codeEditorBg }]}>
        <ActivityIndicator size="small" color={t.accent} />
      </View>
    );
  }

  // Sized to fit the whole file (never smaller than the visible viewport) so
  // nothing needs to scroll *inside* the editor — the wrapping `ScrollView`
  // below does the actual scrolling instead. See the note above the
  // `LINE_HEIGHT` constants for why.
  const editorHeight = Math.max(
    viewportHeight,
    (lineCount + EXTRA_LINES_BUFFER) * LINE_HEIGHT + EDITOR_PADDING * 2
  );

  return (
    <View
      style={[st.root, { backgroundColor: t.codeEditorBg }]}
      onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
    >
      <ScrollView style={st.scroll} showsVerticalScrollIndicator>
        <CodeEditor
          key={path}
          style={{
            width: '100%',
            height: editorHeight,
            fontSize: 13,
            padding: 12,
            backgroundColor: t.codeEditorBg,
            lineNumbersColor: t.codeEditorLineNumber,
            lineNumbersBackgroundColor: t.codeEditorGutterBg,
            highlighterLineHeight: LINE_HEIGHT,
            inputLineHeight: 20,
          }}
          language={
            languageForPath(path) as Parameters<typeof CodeEditor>[0]['language']
          }
          syntaxStyle={
            (colorScheme === 'dark'
              ? vsDarkSyntaxStyle
              : vsLightSyntaxStyle) as Parameters<
              typeof CodeEditor
            >[0]['syntaxStyle']
          }
          initialValue={content}
          onChange={handleChange}
          showLineNumbers={true}
        />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

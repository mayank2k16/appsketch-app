import CodeEditor, {
  CodeEditorSyntaxStyles,
} from '@rivascva/react-native-code-editor';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getFile, saveFile } from '@/api/coder';
import { useAppTheme } from '@/lib/theme';

import { useCodeEditor } from '../CodeEditorProvider';

const SAVE_DEBOUNCE_MS = 700;

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
      lastKnownGoodRef.current = cached;
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    getFile(params.tenantId, path)
      .then((file) => {
        if (cancelled) return;
        setContent(file.content);
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

  return (
    <View style={[st.root, { backgroundColor: t.codeEditorBg }]}>
      <CodeEditor
        // Remounts per file — the component is uncontrolled (`initialValue`
        // only), so switching files needs a fresh instance rather than a
        // value update.
        key={path}
        style={{
          fontSize: 13,
          padding: 12,
          backgroundColor: t.codeEditorBg,
          lineNumbersColor: t.codeEditorLineNumber,
          lineNumbersBackgroundColor: t.codeEditorGutterBg,
          highlighterLineHeight: 20,
          inputLineHeight: 20,
        }}
        language={
          languageForPath(path) as Parameters<typeof CodeEditor>[0]['language']
        }
        syntaxStyle={
          colorScheme === 'dark'
            ? CodeEditorSyntaxStyles.atomOneDarkReasonable
            : CodeEditorSyntaxStyles.atomOneLight
        }
        initialValue={content}
        onChange={handleChange}
        showLineNumbers
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

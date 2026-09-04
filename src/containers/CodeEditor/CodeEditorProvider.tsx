import { useRouter } from 'expo-router';
import * as React from 'react';

import type { AppTypeKey } from '@/api/coder';

import { useBuildLog } from './hooks/useBuildLog';
import { useCoderSocket } from './hooks/useCoderSocket';

export type CodeEditorParams = {
  tenantId: string;
  tenantUid?: string;
  appType: AppTypeKey;
  userPrompt?: string;
  model?: string;
  images?: string[];
};

/** Which of the Preview tab's direct-edit tools is active, if any. Lives here
 * — not as local state inside `InspectorOverlay` — because two other
 * screens need to react to it: the tab layout locks horizontal swipe while
 * it's non-null (an edit-mode drag shouldn't also flip the page), and
 * `PreviewScreen`'s header shows it as a Preview/Edit status. */
export type PreviewEditMode = 'select' | 'text' | 'annotate' | null;

type CodeEditorContextValue = ReturnType<typeof useCoderSocket> & {
  params: CodeEditorParams;
  buildLog: ReturnType<typeof useBuildLog>;
  previewMode: PreviewEditMode;
  setPreviewMode: React.Dispatch<React.SetStateAction<PreviewEditMode>>;
  /** An image (data-URI or remote URL) waiting to be dropped into the Chat
   * tab's composer as an attachment — set by "Add to chat" on the Preview
   * tab's annotate tool, consumed and cleared by `ChatPanel`. */
  pendingChatImage: string | null;
  setPendingChatImage: (uri: string | null) => void;
  /** Bumped whenever something wants the Chat composer to grab keyboard
   * focus (e.g. right after `pendingChatImage` lands) — `ChatPanel` watches
   * this value change, not its number. */
  chatFocusToken: number;
  focusChatComposer: () => void;
};

const CodeEditorContext = React.createContext<CodeEditorContextValue | null>(
  null
);

/**
 * Wraps the whole `code-editor/_layout.tsx` tree (above the top tab
 * navigator), owning the coder WebSocket + build-log state exactly once.
 * Chat/Code/Preview tab screens only ever *consume* this context, so
 * switching tabs never tears down or reconnects anything — the chat keeps
 * streaming and the build console keeps logging in the background.
 */
export function CodeEditorProvider({
  params,
  children,
}: {
  params: CodeEditorParams;
  children: React.ReactNode;
}) {
  const coder = useCoderSocket({
    tenantId: params.tenantId,
    userPrompt: params.userPrompt,
    model: params.model,
    images: params.images,
  });
  const buildLog = useBuildLog(params.tenantId);

  const [previewMode, setPreviewMode] = React.useState<PreviewEditMode>(null);
  const [pendingChatImage, setPendingChatImage] = React.useState<string | null>(
    null
  );
  const [chatFocusToken, setChatFocusToken] = React.useState(0);
  const focusChatComposer = React.useCallback(
    () => setChatFocusToken((n) => n + 1),
    []
  );

  // Jump to the Preview tab the moment the agent's own verification says the
  // build is ready and clean — see `previewReady` in `useCoderSocket`. Lives
  // here (above the tab navigator) rather than in the hook because the hook
  // has no navigator to reach; `router.navigate` on a route already mounted
  // inside this same top-tab group just switches the active tab, it does not
  // remount `_layout` or touch this provider's state. Skips the very first
  // render so mounting the screen doesn't itself count as "ready".
  const seenPreviewReadyRef = React.useRef<number | null>(null);
  const router = useRouter();
  React.useEffect(() => {
    if (seenPreviewReadyRef.current === null) {
      seenPreviewReadyRef.current = coder.previewReady;
      return;
    }
    if (coder.previewReady === seenPreviewReadyRef.current) return;
    seenPreviewReadyRef.current = coder.previewReady;
    router.navigate('/code-editor/preview');
  }, [coder.previewReady, router]);

  const value = React.useMemo<CodeEditorContextValue>(
    () => ({
      ...coder,
      params,
      buildLog,
      previewMode,
      setPreviewMode,
      pendingChatImage,
      setPendingChatImage,
      chatFocusToken,
      focusChatComposer,
    }),
    [
      coder,
      params,
      buildLog,
      previewMode,
      pendingChatImage,
      chatFocusToken,
      focusChatComposer,
    ]
  );

  return (
    <CodeEditorContext.Provider value={value}>
      {children}
    </CodeEditorContext.Provider>
  );
}

export function useCodeEditor() {
  const ctx = React.useContext(CodeEditorContext);
  if (!ctx)
    throw new Error('useCodeEditor must be used within a CodeEditorProvider');
  return ctx;
}

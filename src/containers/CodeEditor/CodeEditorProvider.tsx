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

type CodeEditorContextValue = ReturnType<typeof useCoderSocket> & {
  params: CodeEditorParams;
  buildLog: ReturnType<typeof useBuildLog>;
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

  const value = React.useMemo<CodeEditorContextValue>(
    () => ({ ...coder, params, buildLog }),
    [coder, params, buildLog]
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

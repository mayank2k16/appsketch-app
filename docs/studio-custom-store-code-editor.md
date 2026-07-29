# Studio → Custom Store → Code Editor (resume flow)

## What changed

Added a **Custom Store** button to each tenant card on the Studio "My Apps"
screen. It sends the user into the same `/code-editor/chat` route the
hero-prompt flow (`AgentScreen`) uses to *start* a new build, but without a
`userPrompt` param.

- [`AppsScreen.tsx`](../src/containers/Studio/Apps/AppsScreen.tsx) —
  `handleViewCustomStore(tenant)` pushes
  `{ pathname: '/code-editor/chat', params: { tenantId, tenantUid, appType: 'web' } }`.
- [`StoreCard.tsx`](../src/containers/Studio/Apps/components/StoreCard.tsx) —
  new `onViewCustomStore` prop/button (`code-slash-outline` icon), and the
  actions row now wraps into a 2×2 grid to fit the 4th button.

## Why

The web builder (Vite `CoderWorkspace.jsx`) already auto-restores chat
history, the file tree, and the live preview when a tenant's builder is
reopened — it resolves the tenant's *latest* thread server-side
(`/api/builder/coder/<tenant>/latest-thread/`) rather than trusting a
possibly-stale local thread id, then resumes the websocket, which replies
with the full message history.

The RN app's `useCoderSocket` (`src/containers/CodeEditor/hooks/useCoderSocket.ts`)
already ports this exact mechanism:

- Its bootstrap effect calls `getLatestThread(tenantId)` first (server as
  source of truth), falling back to the cached `AsyncStorage` thread id, and
  only onboards a brand-new thread if neither exists.
- The websocket's `ready` event carries `history`, which repopulates
  `messages`; `refreshTree()` repopulates the file tree.
- `PreviewScreen.tsx` doesn't need any build-polling — it points the WebView
  straight at `previewUrlForTenant(tenantUid)`, so the live preview is
  correct on mount with no extra restore step.
- Crucially, the initial-prompt auto-send in `useCoderSocket`'s `ws.onopen`
  is gated on `params.userPrompt` being set — so simply *not* passing
  `userPrompt` (as `AppsScreen` now does) is what turns "start a new build"
  into "resume this tenant's existing session".

So no changes were needed in `useCoderSocket`/`CodeEditorProvider` — only a
new entry point (the Custom Store button) that reaches the same route the
same way an existing tenant is always resumed.

## How to use it

From Studio → My Apps, tap **Custom Store** on any tenant card. It opens the
Chat tab of `/code-editor` for that tenant with prior conversation, code, and
live preview already in place — no new prompt is sent.

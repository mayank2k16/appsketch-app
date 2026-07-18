# Agent instructions

<!-- concord-protocol -->
## Concord — semantic memory protocol

This repo records the WHY behind the code, not just the what, and every change
flows through a **stream** (an isolated line of work that a human reviews before
it reaches `main`). The MCP tools below give you the full picture — use them.

**Orient first — never edit blind.** Before touching an entity (function, doc
section, table, endpoint…):
- `avcs_recall <entity>` — what past agents already tried here, including the
  approaches they *rejected*. Do not retry a rejected approach without new
  information.
- `avcs_why <file>` — the sessions, prompts, and decisions behind existing
  code; `avcs_search "<query>"` to search wider past agent work.
- `avcs_changelog_search "<topic>"` — semantically search the changelog for
  when/why this area changed before; `avcs_changelog_entry <ref>` opens one
  change in full (its commits and the sessions + rejected approaches behind it).
- `avcs_reconcile` / `avcs_diff` — what your change affects downstream
  (dependent entities and consumers) before you commit.

**Work on a stream.** Commit onto your task's stream; don't push straight to
`main`. Humans review the stream — plain-English summary + diff — before it merges.

**Leave memory behind (the whole point of this repo).** After finishing:
- `avcs_session_capture` — the prompt, a plain-English summary, the
  entities/files touched, and decisions (choice / rejected / why). This is what
  the next agent recalls.
- **Document by default.** Update the `docs/` page covering this area, or create
  `docs/<short-topic>.md` (what changed, why, how to use it). Record the mapping
  with `avcs_link` (doc section ↔ code entity) so the doc↔code link stays live.
  (Claude Code: the Stop hook reminds you once if you skip docs/capture.)
- Commit via `avcs commit -m "..." --agent <your-id> --context "<why>"`, then
  `avcs push`.
<!-- /concord-protocol -->

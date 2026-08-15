# The mobile coder workspace — theme, terminal, CMS

The Code Editor screens (`src/containers/CodeEditor/`) are a **port of the web
AppSketch workspace**, not a native-looking cousin of it. Someone who builds a
site on the web and opens the same project on their phone should recognise the
same product. This doc records the three places that was not true, and what the
fix was.

---

## 1. The coder screens are achromatic

### The rule

The web workspace (`CoderWorkspace.scss`) is built on a three-depth achromatic
ladder, declared once as CSS variables and used everywhere:

| web token       | value     | what it is                          |
| --------------- | --------- | ----------------------------------- |
| `--ui-bg`       | `#020202` | a column's canvas                   |
| `--ui-surface`  | `#0D0D0D` | a message, a card, the composer     |
| `--ui-ctl`      | `#1E1E1E` | a control, or a nested surface      |
| `--ui-ctl-h`    | `#262626` | that control, raised (hover/active) |
| `--ui-line`     | `#252525` | the **only** hairline               |
| `--ui-txt`      | `#EAEAEA` | text                                |
| `--ui-dim`      | `#8F8F8F` | secondary text                      |
| `--ui-accent`   | `#4F7DFF` | focus, and a **primary action**     |
| accent-soft fill| `rgba(79,125,255,.16)` | a **selected** chip     |
| accent-soft text| `#7EA2FF` | the label on that fill              |

Colour appears only where it *means* something: state (green connected, red
error), and one primary action per surface. Everything else is grey.

`src/lib/theme/AppTheme.ts` now carries exactly these values in its
`codeEditor*`, `terminal*` and `collections*` slices.

### Why `useCoderTheme` exists

The rest of the app is branded **electric indigo** (`accent: #6C5CE7`), and the
coder screens inherited it simply by reading `colors.accent` — which is what put
violet on every button, switch, spinner, folder icon and selected chip in a
surface that is otherwise black and grey.

Rewriting the ~30 `colors.accent` call sites would have fixed *today's* violet
and none of tomorrow's, because the next `colors.accent` anyone typed in here
would be indigo again. So the **scope** is the fix:

```ts
// src/lib/theme/CoderTheme.ts
accent:     base.codeEditorFocus,       // #4F7DFF
accentSoft: base.codeEditorAccentWash,  // rgba(79,125,255,.16)
```

Every screen under `containers/CodeEditor/` calls `useCoderTheme(colorScheme)`
instead of `useAppTheme(colorScheme)`. The returned object is the same shape, so
`colors` props typed `ReturnType<typeof useAppTheme>` needed no change.

> **`AppColors` had to widen.** Colour values were inferred as string
> *literals*, so `accent` had the type `'#6C5CE7'` and nothing was permitted to
> hand a component a different one. `ColorValues<T>` widens the leaves to
> `string` — except `statusBar`, whose literal type is what makes
> `barStyle={t.statusBar}` typecheck.

### What still needed hand-fixing

The scope swap makes the hue right. Three places had the wrong *treatment*:

- **ClarifyBlock chips** filled solid accent with white text. The web washes a
  selection and colours the label (`.cw-chip.on`); a solid pill is what "the app
  is blue" actually looks like. Now `accentSoft` + `codeEditorAccentText`.
- **FileTree folder icons** were accent — the web's `.cw-tree-dir` is `$muted`.
  A colour on most rows of a colourless panel is not an accent.
- **DotFieldLoader** painted a whole *field* of dots accent. At that coverage it
  is a coloured background, not an accent. Now `codeEditorTextMuted`.
- **`injectedScript.ts`** hardcoded `#6C5CE7` for the inspector's selection
  outline — it runs inside the previewed page, out of reach of the theme, so it
  is hardcoded to `#4F7DFF` instead.

Two contrast bugs the re-tone *created*, both fixed: the Collections tab pills
and collection chips drew `#FFFFFF` text on what used to be a filled indigo pill
and is now a raised neutral — invisible in light mode.

---

## 2. The terminal stops saying "connecting" forever

`useTerminalSocket` was a single `connected` boolean with no retry and no close
handling, so **every** failure looked identical: "Connecting…", indefinitely.

It now runs the web `Terminal.jsx` phase machine:

```
connecting → open
connecting → retrying → … → offline
```

- **`FATAL_CLOSE`** — 4001 / 4003 / 4004 from `CoderTerminalConsumer.connect`
  are permanent for this mount. Retrying cannot change the answer, so the pane
  prints the reason (expired session / wrong project / no files yet) and goes
  straight to `offline`.
- **`RETRY_MS`** — `[400, 1000, 2500, 5000, 10000]`, then `offline`. A host that
  restarted reconnects on its own; a host that is never coming back stops
  pretending.
- **`epoch`** — a manual reconnect after a *fatal* close is still at attempt 0,
  so resetting `attempt` alone would not re-run the effect and the Reconnect
  button would do nothing.

`TerminalPane` renders the phase (`SHELL_STATUS`), disables the input unless the
socket is open, and shows **Reconnect** in the header when offline.

> **The 4003 half of this bug is server-side.** `CoderTerminalConsumer` used to
> require the token's *current* tenant to BE the project tenant, which locked the
> terminal out of every workspace opened from a different CMS tenant — the same
> cross-tenant case `CoderConsumer` deliberately allows. The backend now checks
> **ownership of a builder thread on the tenant** instead. The app points at
> `wss://appsketch.ai/`, so that fix has to be **deployed** before the terminal
> connects; until then the pane at least says which wall it hit.

---

## 3. A real CMS on the Collections tab

### Every field type the engine validates

`FIELD_TYPES` in `builder/agent/dynamic/engine.py` is ten types. The drawer
rendered four — boolean, richtext, image, and "everything else is a text box" —
so a `select` accepted values the schema forbade and a `reference` asked you to
type a foreign key from memory.

| type        | control                                                      |
| ----------- | ------------------------------------------------------------ |
| `boolean`   | `Switch`                                                     |
| `richtext`  | multiline `TextInput`                                        |
| `image`     | preview + upload (below) + paste-a-URL                       |
| `select`    | `SelectField` — the declared options as chips                |
| `reference` | `RefPicker` — server-searched foreign-key sheet              |
| everything else | `TextInput` with the right keyboard (`KEYBOARD` map)      |

`select` keeps a value the schema no longer offers visible and selected, marked
`(not in options)`, rather than letting the first save silently blank it — same
rule as the web.

### `RefPicker` — foreign keys by name

The target collection holds up to `MAX_RECORDS` rows, so a phone must not pull
all of them down to fill a list. The search runs **server-side** against
`GET /collections/<target>/options/?q=&display=&ids=`:

- `ids` pins the value already on the record, so its label survives a search
  term that would have filtered it out. Without it, opening the picker on an
  existing record shows a blank where the current selection should be.
- The label is resolved separately on mount, so a **closed** picker reads
  "Anna Roy", never `#41`.
- Search is debounced 180 ms.

The record **list** shows labels too — the backend attaches `_refs`
(`{field: label}`) to each row in one batched query per referenced collection
(`_resolve_references`), and `CellPreview` reads it. Image cells render a
thumbnail instead of a long URL.

### Camera, gallery, files

A phone has three sources where the web has one file input, and offering only
the photo library means "shoot the product, put it in the CMS" takes a detour
through the camera app and back.

`pickAsset(source)` in `pickAsset.ts` handles all three:

| source    | API                                          |
| --------- | -------------------------------------------- |
| `camera`  | `ImagePicker.launchCameraAsync`              |
| `library` | `ImagePicker.launchImageLibraryAsync`        |
| `files`   | `DocumentPicker.getDocumentAsync`            |

It resolves `null` on cancel and **throws a human sentence** when a permission
is refused, which the drawer shows — "nothing happened" is the worst possible
answer to a tap.

The Files route is restricted to `image/*` and `video/*` at the OS picker,
because that is what `_ASSET_EXT` in `builder/agent/coder/visual_edit.py`
accepts; letting someone pick a PDF only to have the upload 400 is a worse
experience than not offering it.

`AssetSourceSheet` is the chooser — a themed `Modal` rather than a native action
sheet, which is iOS-only and system-coloured.

---

## Files

| file                                       | role                                  |
| ------------------------------------------ | ------------------------------------- |
| `src/lib/theme/AppTheme.ts`                | the achromatic tokens                 |
| `src/lib/theme/CoderTheme.ts`              | the coder-scoped palette              |
| `src/containers/CodeEditor/hooks/useTerminalSocket.ts` | phase machine + backoff   |
| `src/containers/CodeEditor/Terminal/TerminalPane.tsx`  | phase UI + Reconnect      |
| `src/containers/CodeEditor/Collections/RecordDrawer.tsx`   | the form          |
| `src/containers/CodeEditor/Collections/RefPicker.tsx`      | FK picker         |
| `src/containers/CodeEditor/Collections/AssetSourceSheet.tsx` | source chooser  |
| `src/containers/CodeEditor/Collections/pickAsset.ts`       | camera/gallery/files |
| `src/api/coder/client.ts`                  | `getCollectionOptions`                |
| `src/api/coder/types.ts`                   | full `CollectionFieldType`, `_refs`   |

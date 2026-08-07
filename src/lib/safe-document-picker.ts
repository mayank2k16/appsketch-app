/**
 * Defensive wrapper around `expo-document-picker`.
 *
 * Expo modules resolve their native binding at import time (most call
 * `requireNativeModule()` at the top of their JS), so a bare
 * `import * as DocumentPicker from 'expo-document-picker'` throws — hard —
 * the instant the JS bundle evaluates it, on any binary that was built before
 * this dependency was added and never got a native rebuild (`pnpm install` +
 * `expo prebuild` + reinstall). That's a crash on screen *mount*, not on tap,
 * which is exactly what "opening support chat crashes" looked like: the
 * import sat at the top of `SupportChatScreen.tsx`, so just navigating there
 * detonated it, before the user ever touched the attach button.
 *
 * `require()` inside a try/catch contains that throw — the module's own
 * top-level code still runs (and still fails) here, but the failure is
 * caught instead of propagating out and crashing the screen. Callers get
 * `null` and should treat the "Document" attach option as unavailable until
 * the app is rebuilt with the native module actually linked in.
 */
import type * as DocumentPickerModule from 'expo-document-picker';

let mod: typeof DocumentPickerModule | null | undefined;

export function getDocumentPicker(): typeof DocumentPickerModule | null {
  if (mod !== undefined) return mod;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = require('expo-document-picker');
  } catch (err) {
    if (__DEV__) {
      console.warn(
        '[safe-document-picker] expo-document-picker native module unavailable ' +
          '— rebuild the dev client (pnpm install + expo prebuild + reinstall) ' +
          'to enable document attachments.',
        err
      );
    }
    mod = null;
  }
  return mod ?? null;
}

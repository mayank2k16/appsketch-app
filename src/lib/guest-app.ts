/**
 * Opening another AppSketch-built app inside this one (Expo-Go style): the
 * shared entry point for the Scan screen, the Coder preview and the gallery.
 */
import {
  GuestAppError,
  isGuestHostAvailable,
  openGuestApp,
} from 'appsketch-host';
import * as React from 'react';
import { Alert } from 'react-native';

import { endEta, startEta } from '@/components/eta';
import { haptic } from '@/lib/haptics';
import { toast } from '@/lib/toast';

export function useOpenGuestApp() {
  const [opening, setOpening] = React.useState(false);
  const busy = React.useRef(false);

  /** `alert`: report a failure in a native alert instead of a toast (a
   *  toast can sit under a full-screen page, e.g. the template page).
   *  `quiet`: report nothing — the caller falls back on its own. */
  const open = React.useCallback(
    async (
      input: string,
      opts?: { alert?: boolean; quiet?: boolean }
    ): Promise<boolean> => {
      const fail = (msg: string) => {
        if (opts?.quiet) return;
        if (opts?.alert) Alert.alert("Couldn't open this app", msg);
        else toast.error(msg);
      };
      if (busy.current) return false;
      if (!isGuestHostAvailable()) {
        fail('Update AppSketch to run apps on this phone.');
        return false;
      }
      busy.current = true;
      setOpening(true);
      // One light tap as another app takes over the screen.
      haptic.tap();
      const eta = startEta('native', 'Starting the app');
      let ok = false;
      try {
        await openGuestApp(input);
        ok = true;
        return true;
      } catch (e) {
        fail(
          e instanceof GuestAppError ? e.message : "Couldn't open that app."
        );
        return false;
      } finally {
        endEta(eta, ok);
        busy.current = false;
        setOpening(false);
      }
    },
    []
  );

  return { open, opening, supported: isGuestHostAvailable() };
}

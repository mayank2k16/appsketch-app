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

import { haptic } from '@/lib/haptics';
import { toast } from '@/lib/toast';

export function useOpenGuestApp() {
  const [opening, setOpening] = React.useState(false);
  const busy = React.useRef(false);

  const open = React.useCallback(async (input: string): Promise<boolean> => {
    if (busy.current) return false;
    if (!isGuestHostAvailable()) {
      toast.error('Update AppSketch to run apps on this phone.');
      return false;
    }
    busy.current = true;
    setOpening(true);
    // A weighty thump as another app takes over the screen.
    haptic.heavy();
    try {
      await openGuestApp(input);
      return true;
    } catch (e) {
      toast.error(
        e instanceof GuestAppError ? e.message : "Couldn't open that app."
      );
      return false;
    } finally {
      busy.current = false;
      setOpening(false);
    }
  }, []);

  return { open, opening, supported: isGuestHostAvailable() };
}

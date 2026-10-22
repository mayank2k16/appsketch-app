import * as React from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';

import { haptic, HAPTICS_ENABLED, setHapticsEnabled } from '../haptics';
import { storage } from '../storage';

/**
 * The Settings → Haptics switch, reactive. On by default (an unset key reads
 * as on, matching `hapticsEnabled()`). Turning it back on answers with a
 * toggle haptic so the user feels what they just enabled.
 */
export const useHapticsEnabled = () => {
  const [stored] = useMMKVBoolean(HAPTICS_ENABLED, storage);
  const enabled = stored !== false;

  const setEnabled = React.useCallback((on: boolean) => {
    setHapticsEnabled(on);
    if (on) haptic.toggle(true);
  }, []);

  return [enabled, setEnabled] as const;
};

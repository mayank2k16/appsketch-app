import Voice from '@react-native-voice/voice';
import * as React from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

import { toast } from '@/lib/toast';

async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

/** On-device speech-to-text for a prompt composer. Not available on web (no
 * web implementation in @react-native-voice/voice) — `supported` gates the
 * mic button in the UI. While listening, both partial and final results
 * overwrite the text captured *after* whatever was already typed when
 * listening started, so typed text is preserved instead of being clobbered.
 *
 * `Voice.onSpeechResults` etc. are static properties on the native module —
 * one global slot shared by every `useVoiceInput` instance in the tree, not
 * one per hook call. Wiring them up in a mount-time effect meant whichever
 * composer mounted *last* silently owned every transcript, no matter which
 * mic button was actually tapped (Home renders both the hero composer and
 * the ClosingCTA composer at once). Listeners are now claimed inside
 * `start()` instead, right before `Voice.start()`, so the composer that's
 * actually listening is always the one that owns them. */
export function useVoiceInput(
  value: string,
  onChangeText: (text: string) => void
) {
  const [listening, setListening] = React.useState(false);
  const baseTextRef = React.useRef('');
  const onChangeRef = React.useRef(onChangeText);
  onChangeRef.current = onChangeText;
  const mountedRef = React.useRef(true);

  const supported = Platform.OS !== 'web';

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function claimListeners() {
    const applyResult = (e: { value?: string[] }) => {
      const transcript = e.value?.[0];
      if (!transcript) return;
      const base = baseTextRef.current;
      onChangeRef.current(base ? `${base} ${transcript}` : transcript);
    };

    Voice.onSpeechPartialResults = applyResult;
    Voice.onSpeechResults = applyResult;
    Voice.onSpeechEnd = () => {
      if (mountedRef.current) setListening(false);
    };
    Voice.onSpeechError = () => {
      if (mountedRef.current) setListening(false);
      toast.error("Couldn't hear that. Please try again.");
    };
  }

  async function start() {
    if (!supported || listening) return;
    if (!(await requestMicPermission())) {
      toast.error('Microphone permission is required for voice input.');
      return;
    }
    baseTextRef.current = value.trim();
    claimListeners();
    try {
      await Voice.start('en-US');
      setListening(true);
    } catch {
      toast.error("Couldn't start voice input.");
    }
  }

  async function stop() {
    try {
      await Voice.stop();
    } catch {
      // no-op — already stopped
    }
    setListening(false);
  }

  function toggle() {
    if (listening) stop();
    else start();
  }

  return { listening, toggle, supported };
}

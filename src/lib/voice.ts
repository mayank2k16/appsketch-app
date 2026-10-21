/**
 * The small slice of the old `@react-native-voice/voice` API that the
 * composers use, on top of expo-speech-recognition (the voice package is
 * unmaintained and does not build on Gradle 9 / SDK 57).
 *
 * Like the old module, the callbacks are single global slots: whoever calls
 * `start()` last owns the transcript (see `useVoiceInput`).
 */
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

type ResultHandler = (e: { value?: string[] }) => void;

type VoiceApi = {
  onSpeechPartialResults?: ResultHandler;
  onSpeechResults?: ResultHandler;
  onSpeechVolumeChanged?: (e: { value?: number }) => void;
  onSpeechEnd?: () => void;
  onSpeechError?: (e: { error?: { code?: string; message?: string } }) => void;
  isAvailable(): Promise<boolean>;
  start(lang: string): Promise<void>;
  stop(): Promise<void>;
};

let subscribed = false;

function subscribe() {
  if (subscribed) return;
  subscribed = true;
  ExpoSpeechRecognitionModule.addListener('result', (e) => {
    const value = e.results.map((r) => r.transcript);
    if (e.isFinal) Voice.onSpeechResults?.({ value });
    else Voice.onSpeechPartialResults?.({ value });
  });
  ExpoSpeechRecognitionModule.addListener('volumechange', (e) =>
    Voice.onSpeechVolumeChanged?.({ value: e.value })
  );
  ExpoSpeechRecognitionModule.addListener('end', () => Voice.onSpeechEnd?.());
  ExpoSpeechRecognitionModule.addListener('error', (e) =>
    Voice.onSpeechError?.({ error: { code: e.error, message: e.message } })
  );
}

const Voice: VoiceApi = {
  async isAvailable() {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  },
  async start(lang) {
    subscribe();
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) throw new Error('Speech recognition permission denied');
    ExpoSpeechRecognitionModule.start({
      lang,
      interimResults: true,
      volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
    });
  },
  async stop() {
    ExpoSpeechRecognitionModule.stop();
  },
};

export default Voice;

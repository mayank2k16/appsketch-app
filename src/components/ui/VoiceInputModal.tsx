import { Ionicons } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  Modal,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Stop,
} from 'react-native-svg';

import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';
import { toast } from '@/lib/toast';

const AnimatedPath = Reanimated.createAnimatedComponent(Path);

const WAVE_H = 104;
const STEPS = 72;

async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

/**
 * One filled, centre-mirrored waveform lobe band.
 *
 * The shape is `|sin|` under a bell envelope: the envelope is 0 at both ends
 * and 1 in the middle, so the band tapers into the flat centre line at the
 * edges exactly like the reference art, and `energy` scales the whole thing —
 * at `energy === 0` every point collapses onto the centre line, which is why
 * silence renders as a single flat line rather than a frozen bar chart.
 */
type WaveLayer = {
  /** Horizontal px the band spans. */
  w: number;
  /** Lobes across that span. */
  freq: number;
  /** Detune ratio for the second partial. */
  skew: number;
};

function wavePath(phase: number, energy: number, layer: WaveLayer): string {
  'worklet';
  const { w, freq, skew } = layer;
  const mid = WAVE_H / 2;
  const peak = mid * 0.94;
  let top = `M0,${mid}`;
  let bottom = '';
  for (let i = 0; i <= STEPS; i++) {
    const p = i / STEPS;
    const x = p * w;
    // Bell envelope, raised to a power so the taper hugs the line longer.
    const env = Math.pow(Math.sin(Math.PI * p), 1.5);
    // Two detuned partials so successive lobes differ in height instead of
    // marching past at one uniform size.
    const a = Math.sin(p * freq * Math.PI * 2 + phase);
    const b = Math.sin(p * freq * skew * Math.PI * 2 - phase * 1.35);
    const v = Math.abs(a * 0.68 + b * 0.32) * env * energy * peak;
    top += ` L${x.toFixed(2)},${(mid - v).toFixed(2)}`;
    bottom = ` L${x.toFixed(2)},${(mid + v).toFixed(2)}` + bottom;
  }
  return `${top}${bottom} Z`;
}

/** Layered speech waveform. `energy` (0…1) is a shared value the caller drives
 * from live mic activity; `phase` is a free-running scroll so the lobes travel
 * while someone is talking. */
function Waveform({
  energy,
  phase,
  width,
}: {
  energy: Reanimated.SharedValue<number>;
  phase: Reanimated.SharedValue<number>;
  width: number;
}) {
  const back = useAnimatedProps(() => ({
    d: wavePath(phase.value, energy.value, { w: width, freq: 3.1, skew: 1.9 }),
  }));
  const mid = useAnimatedProps(() => ({
    d: wavePath(phase.value * 1.25 + 1.1, energy.value * 0.82, {
      w: width,
      freq: 4.6,
      skew: 1.6,
    }),
  }));
  const core = useAnimatedProps(() => ({
    d: wavePath(phase.value * 0.85 + 2.4, energy.value * 0.5, {
      w: width,
      freq: 6.2,
      skew: 1.4,
    }),
  }));

  return (
    <Svg width={width} height={WAVE_H}>
      <Defs>
        <SvgGradient id="waveBack" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#22D3EE" />
          <Stop offset="0.45" stopColor="#3B82F6" />
          <Stop offset="1" stopColor="#EC4899" />
        </SvgGradient>
        <SvgGradient id="waveMid" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#60A5FA" />
          <Stop offset="0.5" stopColor="#A78BFA" />
          <Stop offset="1" stopColor="#F472B6" />
        </SvgGradient>
        <SvgGradient id="waveLine" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#22D3EE" stopOpacity="0.35" />
          <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.95" />
          <Stop offset="1" stopColor="#EC4899" stopOpacity="0.35" />
        </SvgGradient>
      </Defs>

      <AnimatedPath animatedProps={back} fill="url(#waveBack)" opacity={0.5} />
      <AnimatedPath animatedProps={mid} fill="url(#waveMid)" opacity={0.6} />
      <AnimatedPath animatedProps={core} fill="#FFFFFF" opacity={0.85} />

      {/* Always-on centre line — this is what "no volume" looks like. */}
      <Path
        d={`M0,${WAVE_H / 2} L${width},${WAVE_H / 2}`}
        stroke="url(#waveLine)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Full-screen voice-capture modal. Buzzes on open, listens continuously with a
 * live waveform, and shows the transcript as it's heard so the user can read it
 * before committing. Unlike `useVoiceInput` (inline dictation into a composer's
 * text field), nothing is handed back until `onSubmit` — cancelling just closes
 * with no side effect.
 */
export function VoiceInputModal({
  visible,
  onClose,
  onSubmit,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  /** Final recognized text — caller decides what "proceed to agent" means. */
  onSubmit: (text: string) => void;
  t: AppColors;
}) {
  const insets = useSafeAreaInsets();
  const [listening, setListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [waveWidth, setWaveWidth] = React.useState(0);
  const mountedRef = React.useRef(true);

  const energy = useSharedValue(0);
  const phase = useSharedValue(0);
  // When the last real speech signal arrived. Nothing for a beat ⇒ decay the
  // wave back to the flat line, which is what makes silence *look* silent.
  const lastSignalRef = React.useRef(0);
  const lastLenRef = React.useRef(0);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const bump = React.useCallback(
    (level: number) => {
      lastSignalRef.current = Date.now();
      energy.value = withTiming(Math.max(0.2, Math.min(1, level)), {
        duration: 110,
      });
    },
    [energy]
  );

  // Same claim-on-start discipline as `useVoiceInput` — Voice's callbacks are
  // static/global, so grabbing them here (not on mount) guarantees whichever
  // modal instance is actually listening owns them.
  function claimListeners() {
    const applyResult = (e: { value?: string[] }) => {
      const text = e.value?.[0];
      if (!text) return;
      setTranscript(text);
      // `onSpeechVolumeChanged` below only ever fires on Android — on iOS the
      // native module has no metering callback at all, which is why the wave
      // used to sit at a constant height there. Partial results are the signal
      // iOS *does* give us: new characters mean audio is being transcribed
      // right now, and their rate tracks how fast someone is talking.
      const delta = text.length - lastLenRef.current;
      lastLenRef.current = text.length;
      if (delta > 0) bump(0.45 + Math.min(0.55, delta / 10));
    };
    Voice.onSpeechPartialResults = applyResult;
    Voice.onSpeechResults = applyResult;
    Voice.onSpeechVolumeChanged = (e: { value?: number }) => {
      // Android reports roughly 0–10; below ~1 is room tone, not speech.
      const v = e.value ?? 0;
      if (v > 1) bump((v - 1) / 8);
    };
    Voice.onSpeechEnd = () => {
      if (mountedRef.current) setListening(false);
    };
    Voice.onSpeechError = () => {
      if (mountedRef.current) setListening(false);
    };
  }

  async function start() {
    if (!(await requestMicPermission())) {
      toast.error('Microphone permission is required for voice input.');
      onClose();
      return;
    }
    claimListeners();
    try {
      await Voice.start('en-US');
      setListening(true);
    } catch {
      toast.error("Couldn't start voice input.");
      onClose();
    }
  }

  async function stop() {
    try {
      await Voice.stop();
    } catch {
      // already stopped
    }
    setListening(false);
  }

  React.useEffect(() => {
    if (!visible) return;
    setTranscript('');
    lastLenRef.current = 0;
    lastSignalRef.current = 0;
    energy.value = 0;
    phase.value = 0;
    phase.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    void start();
    return () => {
      cancelAnimation(phase);
      Voice.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // The decay half of the envelope. `bump` only ever pushes energy up; without
  // this the wave would stay wherever the last syllable left it.
  React.useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      if (Date.now() - lastSignalRef.current > 300) {
        energy.value = withTiming(0, { duration: 420 });
      }
    }, 150);
    return () => clearInterval(id);
  }, [visible, energy]);

  function handleClose() {
    void stop();
    onClose();
  }

  function handleSubmit() {
    const text = transcript.trim();
    if (!text) return;
    void stop();
    onSubmit(text);
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View
        style={[
          s.root,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <TouchableOpacity onPress={handleClose} hitSlop={12} style={s.closeBtn}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={s.center}>
          <Text style={s.status}>
            {listening
              ? 'Listening…'
              : transcript
                ? 'Got it'
                : 'Tap the mic to start'}
          </Text>
          <Text style={s.transcript} numberOfLines={6}>
            {transcript || 'Speak now'}
          </Text>
        </View>

        <View
          style={s.waveform}
          onLayout={(e) => setWaveWidth(e.nativeEvent.layout.width)}
        >
          {waveWidth > 0 ? (
            <Waveform energy={energy} phase={phase} width={waveWidth} />
          ) : null}
        </View>

        <View style={s.actions}>
          <TouchableOpacity
            onPress={handleClose}
            style={s.cancelBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => (listening ? stop() : start())}
            activeOpacity={0.8}
            style={[
              s.micBtn,
              { borderColor: listening ? t.codeEditorDanger : t.accent },
            ]}
          >
            <Ionicons
              name={listening ? 'stop' : 'mic'}
              size={26}
              color={listening ? t.codeEditorDanger : t.accent}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={!transcript.trim()}
            style={{ opacity: transcript.trim() ? 1 : 0.4 }}
          >
            <LinearGradient
              colors={[...t.agentSendGradient] as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.submitBtn}
            >
              <Ionicons name="checkmark" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 12,
  },
  status: {
    fontFamily: F.sans600,
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transcript: {
    fontFamily: F.sans500,
    fontSize: 22,
    lineHeight: 30,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  waveform: {
    height: WAVE_H,
    justifyContent: 'center',
    marginBottom: 28,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  cancelBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  submitBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

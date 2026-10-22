import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GallerySheet } from '@/components/ui/GallerySheet';
import { ModelPickerModal } from '@/components/ui/ModelPickerModal';
import { PressableScale } from '@/components/ui/pressable-scale';
import { VoiceInputModal } from '@/components/ui/VoiceInputModal';
import { F } from '@/lib/fonts';
import { pickImageFromCamera } from '@/lib/media/pickFromCamera';
import { type AppColors, brandGradient } from '@/lib/theme';

export type PromptModel = { value: string; label: string; context: number };

// White palette (docs/white-theme.md): a still hairline edge instead of the
// ramp, ink badges, and the one orange action — Send.
const WHITE_EDGE = '#E7E7E4';
const WHITE_INK = '#0B0B0C';
const WHITE_SEND = '#F2600C';

/** Dark never dimmed a disabled composer control; white dims to 50%. */
const dimFor = (dark: boolean) => (dark ? 1 : 0.5);

type Props = {
  t: AppColors;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  models: PromptModel[];
  model: string;
  onModelChange: (value: string) => void;
  formatContext: (tokens: number) => string;
  /** Called with the final text when submitting — either from the composer
   * (reads current `value`) or straight from the voice modal, which passes
   * its transcript directly rather than round-tripping through `value`'s
   * state update first. */
  onSend: (overrideText?: string) => void;
  sending?: boolean;
  /** Ids the caller may run — `null`/undefined locks nothing (fail open). */
  allowedModels?: string[] | null;
  /** Tapping a locked model calls this instead of selecting it. */
  onLockedModelPress?: (model: PromptModel) => void;
};

// Shared prompt-composer card — the same input + model picker + attach/mic/
// send row used on the standalone Agent screen, extracted so any other
// surface (e.g. Home's ClosingCTA) can drop in the same real "start a build"
// affordance instead of a static mockup.
export function PromptComposer({
  t,
  value,
  onChangeText,
  placeholder = 'Ask the agent to build something…',
  images,
  onImagesChange,
  maxImages = 3,
  models,
  model,
  onModelChange,
  formatContext,
  onSend,
  sending = false,
  allowedModels,
  onLockedModelPress,
}: Props) {
  const [modelPickerOpen, setModelPickerOpen] = React.useState(false);
  const [galleryOpen, setGalleryOpen] = React.useState(false);
  const [voiceOpen, setVoiceOpen] = React.useState(false);
  const selectedModel = models.find((m) => m.value === model) ?? models[0];

  const voiceSupported = Platform.OS !== 'web';
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';

  // Our own grid rather than the system sheet — see `GallerySheet` for why the
  // iOS picker's Cancel and Add could come up inert.
  function handleAttach() {
    if (images.length >= maxImages) return;
    setGalleryOpen(true);
  }

  async function handleCamera() {
    if (images.length >= maxImages) return;
    const uri = await pickImageFromCamera();
    if (!uri) return;
    onImagesChange([...images, uri].slice(0, maxImages));
  }

  function removeImage(index: number) {
    onImagesChange(images.filter((_, i) => i !== index));
  }

  return (
    // Gradient edge. RN has no gradient `borderColor`, so the ring is a
    // LinearGradient filling a wrapper whose only job is to be 1px bigger
    // than the card on every side; the card sits on top with an OPAQUE fill,
    // leaving just that 1px showing as the stroke. Same recipe as Home's
    // prompt card.
    //
    // The fill is `card`, NOT the `agentTabBg` this used to carry: that token
    // is a translucent white wash, which over a gradient stops being a border
    // and becomes a gradient-filled box — which is exactly what the first cut
    // of this rendered. `card` is the opaque value on the same ladder, and on
    // a dark canvas it is what the wash was approximating anyway.
    <View style={s.ringWrap}>
      {dark ? (
        <LinearGradient
          colors={[...t.agentBorderGradient] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: WHITE_EDGE }]}
        />
      )}
      <View style={[s.composer, { backgroundColor: t.card }]}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={t.agentInputPlaceholder}
          multiline
          value={value}
          onChangeText={onChangeText}
          style={[s.input, { color: t.agentInputText }]}
        />

        {images.length > 0 && (
          <View style={s.thumbRow}>
            {images.map((uri, i) => (
              <View
                key={`${uri}-${i}`}
                style={[s.thumb, { borderColor: t.agentInputBorder }]}
              >
                <Image source={{ uri }} style={s.thumbImg} contentFit="cover" />
                <PressableScale
                  onPress={() => removeImage(i)}
                  haptic="rigid"
                  scaleTo={0.88}
                  style={[s.thumbRemove, { backgroundColor: t.agentBtnBg }]}
                  hitSlop={6}
                  accessibilityLabel="Remove image"
                >
                  <Ionicons name="close" size={11} color={t.agentBtnIcon} />
                </PressableScale>
              </View>
            ))}
          </View>
        )}

        <View style={s.composerRow}>
          <PressableScale
            onPress={() => setModelPickerOpen(true)}
            style={[
              s.modelChip,
              { backgroundColor: t.agentBtnBg, borderColor: t.agentBtnBorder },
            ]}
          >
            <View
              style={[
                s.modelDot,
                { backgroundColor: t.codeEditorConnectedDot },
              ]}
            />
            <Text
              style={[s.modelChipLabel, { color: t.agentBtnIcon }]}
              numberOfLines={1}
            >
              {selectedModel?.label}
            </Text>
            <Ionicons name="chevron-down" size={13} color={t.agentBtnIcon} />
          </PressableScale>

          <PressableScale
            disabledOpacity={dimFor(dark)}
            onPress={handleAttach}
            disabled={images.length >= maxImages}
            style={[
              s.circleBtn,
              { backgroundColor: t.agentBtnBg, borderColor: t.agentBtnBorder },
            ]}
          >
            <Ionicons name="add" size={20} color={t.agentBtnIcon} />
            {images.length > 0 && (
              <View
                style={[
                  s.countBadge,
                  { backgroundColor: dark ? t.agentTabActiveBg : WHITE_INK },
                ]}
              >
                <Text style={s.countBadgeText}>{images.length}</Text>
              </View>
            )}
          </PressableScale>

          <PressableScale
            disabledOpacity={dimFor(dark)}
            onPress={handleCamera}
            disabled={images.length >= maxImages}
            style={[
              s.circleBtn,
              { backgroundColor: t.agentBtnBg, borderColor: t.agentBtnBorder },
            ]}
          >
            <Ionicons name="camera-outline" size={18} color={t.agentBtnIcon} />
          </PressableScale>

          {voiceSupported && (
            <PressableScale
              onPress={() => setVoiceOpen(true)}
              style={[
                s.circleBtn,
                {
                  backgroundColor: t.agentBtnBg,
                  borderColor: t.agentBtnBorder,
                },
              ]}
            >
              <Ionicons name="mic-outline" size={18} color={t.agentBtnIcon} />
            </PressableScale>
          )}

          <View style={{ flex: 1 }} />

          <PressableScale
            haptic="press"
            disabledOpacity={dimFor(dark)}
            onPress={() => onSend()}
            disabled={sending || !value.trim()}
          >
            <LinearGradient
              // Dark: the hero heading's own ramp, all three stops — not the
              // two-stop send gradient, which stopped short of the magenta
              // that makes the run recognisable at this size. White: flat
              // orange, the one accent (docs/white-theme.md).
              colors={dark ? brandGradient() : [WHITE_SEND, WHITE_SEND]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              // No dimming: the fill is the hero ramp at full strength in
              // every state. A 50% overlay turned the one primary action into
              // a muddy plum square that read as broken rather than as idle.
              // `disabled` on the pressable above already blocks the tap.
              style={s.sendBtn}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={16} color="#FFFFFF" />
              )}
            </LinearGradient>
          </PressableScale>
        </View>

        <GallerySheet
          visible={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          onConfirm={(uris) =>
            onImagesChange([...images, ...uris].slice(0, maxImages))
          }
          t={t}
          max={maxImages - images.length}
        />

        <ModelPickerModal
          visible={modelPickerOpen}
          onClose={() => setModelPickerOpen(false)}
          t={t}
          models={models}
          value={model}
          onChange={onModelChange}
          formatContext={formatContext}
          allowedModels={allowedModels}
          onLockedPress={onLockedModelPress}
        />

        <VoiceInputModal
          visible={voiceOpen}
          onClose={() => setVoiceOpen(false)}
          onSubmit={(text) => {
            onChangeText(text);
            setVoiceOpen(false);
            onSend(text);
          }}
          t={t}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  // The 1px bigger wrapper that shows through as the stroke. Its radius is
  // the card's + its padding, so the two curves stay concentric.
  ringWrap: {
    borderRadius: 18,
    padding: 1,
    overflow: 'hidden',
  },
  composer: {
    borderRadius: 17,
    paddingHorizontal: 12,
    paddingTop: 5,
    paddingBottom: 10,
    gap: 8,
  },
  input: {
    fontFamily: F.sans400,
    fontSize: 14.5,
    lineHeight: 20,
    minHeight: 80,
    maxHeight: 150,
    paddingHorizontal: 2,
    textAlignVertical: 'top',
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    maxWidth: 185,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 11,
  },
  modelChipLabel: {
    fontFamily: F.sans600,
    fontSize: 11.5,
    flexShrink: 1,
  },
  // The live dot beside the model name. Same green as the Agent header's
  // connected marker, so a lit dot means the same thing in both places.
  modelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontFamily: F.sans700,
    fontSize: 9,
    color: '#FFFFFF',
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

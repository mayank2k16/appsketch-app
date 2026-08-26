import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { GallerySheet } from '@/components/ui/GallerySheet';
import { ModelPickerModal } from '@/components/ui/ModelPickerModal';
import { VoiceInputModal } from '@/components/ui/VoiceInputModal';
import { F } from '@/lib/fonts';
import { pickImageFromCamera } from '@/lib/media/pickFromCamera';
import type { AppColors } from '@/lib/theme';

export type PromptModel = { value: string; label: string; context: number };

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
    <View
      style={[
        s.composer,
        { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder },
      ]}
    >
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
              <Pressable
                onPress={() => removeImage(i)}
                style={[s.thumbRemove, { backgroundColor: t.agentBtnBg }]}
                hitSlop={6}
              >
                <Ionicons name="close" size={11} color={t.agentBtnIcon} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={s.composerRow}>
        <TouchableOpacity
          onPress={() => setModelPickerOpen(true)}
          activeOpacity={0.7}
          style={[
            s.modelChip,
            { backgroundColor: t.agentBtnBg, borderColor: t.agentBtnBorder },
          ]}
        >
          <Text
            style={[s.modelChipLabel, { color: t.agentBtnIcon }]}
            numberOfLines={1}
          >
            {selectedModel?.label}
          </Text>
          <Ionicons name="chevron-down" size={13} color={t.agentBtnIcon} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAttach}
          activeOpacity={0.7}
          disabled={images.length >= maxImages}
          style={[
            s.circleBtn,
            { backgroundColor: t.agentBtnBg, borderColor: t.agentBtnBorder },
          ]}
        >
          <Ionicons name="add" size={20} color={t.agentBtnIcon} />
          {images.length > 0 && (
            <View
              style={[s.countBadge, { backgroundColor: t.agentTabActiveBg }]}
            >
              <Text style={s.countBadgeText}>{images.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCamera}
          activeOpacity={0.7}
          disabled={images.length >= maxImages}
          style={[
            s.circleBtn,
            { backgroundColor: t.agentBtnBg, borderColor: t.agentBtnBorder },
          ]}
        >
          <Ionicons name="camera-outline" size={18} color={t.agentBtnIcon} />
        </TouchableOpacity>

        {voiceSupported && (
          <TouchableOpacity
            onPress={() => setVoiceOpen(true)}
            activeOpacity={0.7}
            style={[
              s.circleBtn,
              { backgroundColor: t.agentBtnBg, borderColor: t.agentBtnBorder },
            ]}
          >
            <Ionicons name="mic-outline" size={18} color={t.agentBtnIcon} />
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={() => onSend()}
          activeOpacity={0.8}
          disabled={sending || !value.trim()}
        >
          <LinearGradient
            colors={[...t.agentSendGradient] as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[s.sendBtn, (sending || !value.trim()) && { opacity: 0.5 }]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={16} color="#FFFFFF" />
            )}
          </LinearGradient>
        </TouchableOpacity>
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
  );
}

const s = StyleSheet.create({
  composer: {
    borderRadius: 17,
    borderWidth: 1,
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

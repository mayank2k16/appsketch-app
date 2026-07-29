import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { F } from '@/lib/fonts';
import { useVoiceInput } from '@/lib/hooks/use-voice-input';
import type { AppColors } from '@/lib/theme';
import { toast } from '@/lib/toast';

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
  onSend: () => void;
  sending?: boolean;
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
}: Props) {
  const [modelPickerOpen, setModelPickerOpen] = React.useState(false);
  const selectedModel = models.find((m) => m.value === model) ?? models[0];

  const voice = useVoiceInput(value, onChangeText);

  // Mic button pulses while actively listening.
  const micPulse = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    if (voice.listening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, {
            toValue: 1.18,
            duration: 550,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(micPulse, {
            toValue: 1,
            duration: 550,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    micPulse.setValue(1);
  }, [voice.listening, micPulse]);

  async function handleAttach() {
    if (images.length >= maxImages) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      toast.error('Media library permission is required to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    onImagesChange([...images, ...result.assets.map((a) => a.uri)].slice(0, maxImages));
  }

  function removeImage(index: number) {
    onImagesChange(images.filter((_, i) => i !== index));
  }

  return (
    <View style={[s.composer, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}>
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
            <View key={`${uri}-${i}`} style={[s.thumb, { borderColor: t.agentInputBorder }]}>
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
          style={[s.modelChip, { backgroundColor: t.agentBtnBg, borderColor: t.agentBtnBorder }]}
        >
          <Text style={[s.modelChipLabel, { color: t.agentBtnIcon }]} numberOfLines={1}>
            {selectedModel?.label}
          </Text>
          <Ionicons name="chevron-down" size={13} color={t.agentBtnIcon} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAttach}
          activeOpacity={0.7}
          disabled={images.length >= maxImages}
          style={[s.circleBtn, { backgroundColor: t.agentBtnBg, borderColor: t.agentBtnBorder }]}
        >
          <Ionicons name="add" size={20} color={t.agentBtnIcon} />
          {images.length > 0 && (
            <View style={[s.countBadge, { backgroundColor: t.agentTabActiveBg }]}>
              <Text style={s.countBadgeText}>{images.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        {voice.supported && (
          <TouchableOpacity
            onPress={voice.toggle}
            activeOpacity={0.7}
            style={[
              s.circleBtn,
              {
                backgroundColor: voice.listening ? `${t.codeEditorDanger}1A` : t.agentBtnBg,
                borderColor: voice.listening ? t.codeEditorDanger : t.agentBtnBorder,
              },
            ]}
          >
            <Animated.View style={{ transform: [{ scale: micPulse }] }}>
              <Ionicons
                name={voice.listening ? 'mic' : 'mic-outline'}
                size={18}
                color={voice.listening ? t.codeEditorDanger : t.agentBtnIcon}
              />
            </Animated.View>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity onPress={onSend} activeOpacity={0.8} disabled={sending || !value.trim()}>
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

      <Modal
        visible={modelPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModelPickerOpen(false)}
      >
        <Pressable style={s.modalBackdrop} onPress={() => setModelPickerOpen(false)}>
          <Pressable style={[s.modelSheet, { backgroundColor: t.sheetBg, borderColor: t.agentInputBorder }]}>
            <Text style={[s.modelSheetTitle, { color: t.text }]}>AI model</Text>
            {models.map((m) => {
              const selected = m.value === model;
              return (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => {
                    onModelChange(m.value);
                    setModelPickerOpen(false);
                  }}
                  activeOpacity={0.7}
                  style={s.modelOption}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.modelOptionLabel, { color: t.text }]}>{m.label}</Text>
                    <Text style={[s.modelOptionMeta, { color: t.textSub }]}>{formatContext(m.context)}</Text>
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={18} color={t.accent} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  composer: {
    borderRadius: 17,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  input: {
    fontFamily: F.sans400,
    fontSize: 14.5,
    lineHeight: 20,
    minHeight: 75,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modelSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 18,
    paddingBottom: 34,
    gap: 4,
  },
  modelSheetTitle: {
    fontFamily: F.sans700,
    fontSize: 15,
    marginBottom: 8,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  modelOptionLabel: {
    fontFamily: F.sans600,
    fontSize: 13.5,
  },
  modelOptionMeta: {
    fontFamily: F.sans400,
    fontSize: 11.5,
    marginTop: 2,
  },
});

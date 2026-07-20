import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { TemplateListItem } from '@/api/templates';
import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

import { Skeleton } from './Skeleton';

const RADIUS = 16;

type Props = {
  t: AppColors;
  isDark: boolean;
  template: TemplateListItem;
  onCustomise: () => void;
  onUse: () => void;
};

/** Glass template card — same BlurView-plus-tint-overlay-plus-highlight
 * recipe as `AgentV2`'s prompt card, so the two glass surfaces in the app
 * read as one consistent material rather than two different effects. */
export const TemplateCard = React.memo(function TemplateCard({ t, isDark, template, onCustomise, onUse }: Props) {
  const name = template.name?.length > 34 ? `${template.name.slice(0, 34)}…` : template.name || 'Untitled';
  const description =
    template.description && template.description.length > 60
      ? `${template.description.slice(0, 60)}…`
      : template.description;

  const [previewLoaded, setPreviewLoaded] = React.useState(false);

  return (
    <View
      style={[
        styles.card,
        { borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(17,17,17,0.10)' },
      ]}
    >
      <BlurView intensity={Platform.OS === 'android' ? 50 : 30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: t.card, opacity: isDark ? 0.55 : 0.5 }]} />
      <LinearGradient
        pointerEvents="none"
        colors={isDark ? ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
        style={styles.highlight}
      />

      <View style={styles.content}>
        <View style={styles.imageWrap}>
          {template.thumbnail_image ? (
            <>
              {!previewLoaded && <Skeleton t={t} style={StyleSheet.absoluteFill} borderRadius={0} />}
              <Image
                source={{ uri: template.thumbnail_image }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
                onLoad={() => setPreviewLoaded(true)}
              />
            </>
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.imageFallback, { backgroundColor: t.accentSoft }]}>
              <Text style={[styles.imageFallbackText, { color: t.accent }]}>{(template.name?.[0] ?? '?').toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.statBadge}>
            <Ionicons name="heart" size={9} color="#FFFFFF" />
            <Text style={styles.statBadgeText}>{template.likes ?? 0}</Text>
            <Ionicons name="eye" size={9} color="#FFFFFF" style={{ marginLeft: 5 }} />
            <Text style={styles.statBadgeText}>{template.views ?? 0}</Text>
          </View>
        </View>

        <Text style={[styles.name, { color: t.text }]} numberOfLines={1}>
          {name}
        </Text>
        {description ? (
          <Text style={[styles.description, { color: t.textSub }]} numberOfLines={2}>
            {description}
          </Text>
        ) : null}

        {template.tags && template.tags.length > 0 ? (
          <View style={styles.tagRow}>
            {template.tags.slice(0, 3).map((tag, i) => (
              <View key={i} style={[styles.tag, { backgroundColor: t.templatesTagBg }]}>
                <Text style={[styles.tagText, { color: t.templatesTagText }]}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.btnRow}>
          <TouchableOpacity
            onPress={onCustomise}
            activeOpacity={0.75}
            style={[styles.btn, { borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(17,17,17,0.10)' }]}
          >
            <Text style={[styles.btnLabel, { color: t.text }]}>Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onUse} activeOpacity={0.85} style={[styles.btn, { backgroundColor: t.accent }]}>
            <Text style={[styles.btnLabel, { color: '#FFFFFF' }]}>Use this Template</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
  },
  content: {
    padding: 8,
    gap: 6,
  },
  imageWrap: {
    // height: 88,
    borderRadius: 11,
    overflow: 'hidden',
    aspectRatio: 1.4
  },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { fontFamily: F.sans700, fontSize: 22 },
  statBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  statBadgeText: { fontFamily: F.sans600, fontSize: 9, color: '#FFFFFF' },
  name: { fontFamily: F.sans600, fontSize: 12.5 },
  description: { fontFamily: F.sans400, fontSize: 10.5, lineHeight: 15 },
  tagRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  tag: { borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontFamily: F.sans600, fontSize: 8.5 },
  btnRow: { gap: 5, marginTop: 2 },
  btn: { height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnLabel: { fontFamily: F.sans600, fontSize: 9.5 },
});

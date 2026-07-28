import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ShortVideoItem } from '@/api/short-videos';

import { CmsStatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { lifetimeLabel } from '../utils';

type Props = {
  video: ShortVideoItem;
  colors: CmsThemeColors;
  onEdit: () => void;
  onDelete: () => void;
};

export const ShortVideoCard = React.memo(function ShortVideoCard({ video, colors, onEdit, onDelete }: Props) {
  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[st.previewWrap, { backgroundColor: colors.background }]}>
        {video.thumbnailUrl ? (
          <Image source={{ uri: video.thumbnailUrl }} style={st.preview} contentFit="cover" />
        ) : video.videoUrl ? (
          <VideoPreview uri={video.videoUrl} />
        ) : (
          <View style={[st.preview, st.previewEmpty]}>
            <Text style={{ fontSize: 32, opacity: 0.35 }}>🎬</Text>
          </View>
        )}
        {video.videoUrl ? (
          <View style={st.playBadge}>
            <Ionicons name="play" size={11} color="#FFFFFF" />
          </View>
        ) : null}
      </View>

      <View style={st.body}>
        <View style={st.badgeRow}>
          <CmsStatusBadge
            meta={
              video.is_active
                ? { label: 'Active', color: colors.success, kind: 'success' }
                : { label: 'Hidden', color: colors.textSecondary, kind: 'info' }
            }
          />
          {video.is_active && !video.is_live ? (
            <CmsStatusBadge meta={{ label: 'Out of date window', color: '#8a6d00', kind: 'warning' }} />
          ) : null}
          {video.is_live ? <CmsStatusBadge meta={{ label: '● Live now', color: colors.danger, kind: 'danger' }} /> : null}
          <CmsStatusBadge meta={{ label: `#${video.priority ?? 0}`, color: colors.textSecondary, kind: 'info' }} />
        </View>

        <Text style={[st.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {video.title}
        </Text>
        {video.description ? (
          <Text style={{ color: colors.textSecondary, fontSize: 12.5 }} numberOfLines={2}>
            {video.description}
          </Text>
        ) : null}
        <Text style={[st.lifetime, { color: colors.textSecondary }]} numberOfLines={1}>
          🗓 {lifetimeLabel(video)}
        </Text>
        {!video.videoUrl ? (
          <Text style={[st.warnText, { color: colors.danger }]}>⚠ No video file — won't show in the app.</Text>
        ) : null}

        <View style={st.actions}>
          <Pressable onPress={onEdit} style={[st.actionBtn, { borderColor: colors.border }]} hitSlop={6}>
            <Ionicons name="create-outline" size={15} color={colors.textPrimary} />
            <Text style={[st.actionLabel, { color: colors.textPrimary }]}>Edit</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={[st.actionBtn, { borderColor: colors.border }]} hitSlop={6}>
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
            <Text style={[st.actionLabel, { color: colors.danger }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

/** No-thumbnail fallback — a paused, uncontrolled first-frame preview standing
 * in for the web port's `<video muted preload="metadata">` (browsers show the
 * first frame without playing; there's no exact RN equivalent). */
function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  return <VideoView player={player} style={st.preview} nativeControls={false} contentFit="cover" />;
}

const st = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  previewWrap: { width: '100%', aspectRatio: 9 / 16, maxHeight: 260 },
  preview: { width: '100%', height: '100%' },
  previewEmpty: { alignItems: 'center', justifyContent: 'center' },
  playBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(20, 26, 18, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 12, gap: 4 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  title: { ...cmsType.listTitle },
  lifetime: { fontSize: 11.5 },
  warnText: { fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  actionLabel: cmsType.buttonLabel,
});

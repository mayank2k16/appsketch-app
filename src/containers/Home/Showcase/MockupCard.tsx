import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { F } from '@/lib/fonts';
import type { HomeColors } from '../theme/HomeTheme';

// Grid tiles previously sized via `width: '48%'` inside a chain with no
// explicit width anywhere above it (card → body → content → grid all rely on
// default flex/content sizing) — that percentage likely wasn't resolving to
// a real number, and expo-image never even attempted to load into a 0×0
// view (onLoadStart never fired). Computing an explicit pixel size, the same
// approach Gallery's columns already use successfully, is the robust fix.
const { width: SCREEN_W } = Dimensions.get('window');
const SECTION_PAD_H = 22 * 2;
const CARD_BORDER = 1 * 2;
const RAIL_W = 38 + 1;
const CONTENT_PAD_H = 10 * 2;
const GRID_GAP = 6;
const CARD_CONTENT_W = SCREEN_W - SECTION_PAD_H - CARD_BORDER - RAIL_W - CONTENT_PAD_H;
const TILE_SIZE = (CARD_CONTENT_W - GRID_GAP) / 2;

const CDN = 'https://cdn.appsketch.ai/phurti-cloudfront/builder/layouts/';
// Pre-compressed/descriptive-slug variants (55-108KB) — the original picks
// here were the CDN's full-res "Screenshot_...png" captures (2-3.9MB each)
// squeezed into a tiny thumbnail tile; on mobile data that's slow enough the
// tiles could still be blank by the time anyone looks at this section.
const GRID_IMAGES = [
  `${CDN}a-website-for-healthcare-brands.webp`,
  `${CDN}a-premium-and-elegant-beauty-store.webp`,
  `${CDN}a-portfolio-website-for-sports-academy.webp`,
  `${CDN}compressed_Screenshot_2026-01-12_at_10_1.webp`,
];

const TOOLS: { icon: keyof typeof Ionicons.glyphMap; active?: boolean }[] = [
  { icon: 'text-outline', active: true },
  { icon: 'image-outline' },
  { icon: 'color-wand-outline' },
  { icon: 'color-palette-outline' },
];

export function MockupCard({ t }: { t: HomeColors }) {
  return (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
      {/* ── Browser chrome ── */}
      <View style={[s.chrome, { borderBottomColor: t.border }]}>
        <View style={s.dots}>
          <View style={[s.dot, { backgroundColor: '#FF5F57' }]} />
          <View style={[s.dot, { backgroundColor: '#FEBC2E' }]} />
          <View style={[s.dot, { backgroundColor: '#28C840' }]} />
        </View>
        <View style={[s.urlPill, { backgroundColor: t.bg }]}>
          <Ionicons name="lock-closed" size={9} color={t.textMuted} />
          <Text style={[s.urlText, { color: t.textMuted }]} numberOfLines={1}>
            generativeai.com
          </Text>
        </View>
      </View>

      {/* ── Body: tool rail + content ── */}
      <View style={s.body}>
        <View style={[s.rail, { borderRightColor: t.border }]}>
          <View style={[s.brandMark, { backgroundColor: t.accent }]} />
          {TOOLS.map((tool, i) => (
            <View
              key={i}
              style={[
                s.toolBtn,
                tool.active
                  ? { backgroundColor: t.accentSoft }
                  : { backgroundColor: 'transparent' },
              ]}
            >
              <Ionicons
                name={tool.icon}
                size={14}
                color={tool.active ? t.accent : t.textMuted}
              />
            </View>
          ))}
        </View>

        <View style={s.content}>
          {/* Prompt row */}
          <View style={[s.promptRow, { backgroundColor: t.bg, borderColor: t.border }]}>
            <Text style={[s.promptText, { color: t.textMuted }]} numberOfLines={1}>
              Glitch art marble bust of caligula, studio lighting, orotation
            </Text>
            <TouchableOpacity style={s.generateBtn} activeOpacity={0.85}>
              <Text style={s.generateBtnTxt}>Generate</Text>
              <Ionicons name="arrow-forward" size={11} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Image grid */}
          <View style={s.grid}>
            {GRID_IMAGES.map((uri, i) => (
              <View key={uri} style={[s.tile, { width: TILE_SIZE, height: TILE_SIZE }]}>
                <ExpoImage
                  source={uri}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
                {i === 1 ? (
                  <View style={[s.tileBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                    <Ionicons name="expand-outline" size={11} color="#FFFFFF" />
                  </View>
                ) : null}
                {i === 3 ? (
                  <View style={[s.tileBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                    <Ionicons name="sparkles-outline" size={11} color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
            ))}
          </View>

          {/* Author row — initials badge instead of a photo: no network
              dependency at all, so it's guaranteed to render every time. */}
          <View style={[s.authorRow, { borderTopColor: t.border }]}>
            <View style={[s.avatar, { backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={[s.avatarInitials, { color: t.accent }]}>JC</Text>
            </View>
            <View>
              <Text style={[s.authorName, { color: t.text }]}>John Carter</Text>
              <Text style={[s.authorRole, { color: t.textMuted }]}>AI Product Designer</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },

  chrome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  urlPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  urlText: {
    fontFamily: F.sans500,
    fontSize: 10,
  },

  body: {
    flexDirection: 'row',
  },

  rail: {
    width: 38,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  brandMark: {
    width: 16,
    height: 16,
    borderRadius: 5,
    marginBottom: 4,
  },
  toolBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
    padding: 10,
    gap: 8,
  },

  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  promptText: {
    flex: 1,
    fontFamily: F.sans400,
    fontSize: 9.5,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3B6FF6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  generateBtnTxt: {
    fontFamily: F.sans700,
    fontSize: 9.5,
    color: '#FFFFFF',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tile: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#00000020',
  },
  tileBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarInitials: {
    fontFamily: F.sans700,
    fontSize: 9.5,
  },
  authorName: {
    fontFamily: F.sans700,
    fontSize: 11,
  },
  authorRole: {
    fontFamily: F.sans400,
    fontSize: 9.5,
    marginTop: 1,
  },
});

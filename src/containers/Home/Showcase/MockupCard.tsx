import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { F } from '@/lib/fonts';
import type { HomeColors } from '../theme/HomeTheme';

/**
 * MockupCard — the little "product screenshot" shown beside the copy in the
 * showcase section: browser chrome, a compact tool rail, a prompt bar, a
 * grid of generated images, and an author row. Purely decorative — text and
 * imagery are placeholders matching the reference, not live app UI.
 */

const splashUri = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const TOOLS: { icon: keyof typeof Ionicons.glyphMap; active?: boolean }[] = [
  { icon: 'text-outline', active: true },
  { icon: 'image-outline' },
  { icon: 'color-wand-outline' },
  { icon: 'color-palette-outline' },
];

const GRID_SEEDS = ['showcase-a', 'showcase-b', 'showcase-c', 'showcase-d'];

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
            {GRID_SEEDS.map((seed, i) => (
              <View key={seed} style={s.tile}>
                <Image
                  source={{ uri: splashUri(seed, 200, 200) }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
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

          {/* Author row */}
          <View style={[s.authorRow, { borderTopColor: t.border }]}>
            <Image
              source={{ uri: splashUri('showcase-avatar', 60, 60) }}
              style={s.avatar}
            />
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
    width: '48%',
    aspectRatio: 1,
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

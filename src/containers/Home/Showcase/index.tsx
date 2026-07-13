import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { F } from '@/lib/fonts';
import { homeTheme } from '../theme/HomeTheme';
import { MockupCard } from './MockupCard';

const FEATURES: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}[] = [
  {
    icon: 'globe-outline',
    title: 'Generate high-quality images',
    desc: 'Lorem ipsum dolor sit amet consectetur in quisque varius eget turpis sollicitudin purus arcu in tellus dolor eget.',
  },
  {
    icon: 'create-outline',
    title: 'Edit and upscale images',
    desc: 'Amet lorem ipsum egestas habitasse mauris lacus ante augue sit id sodales lectus neque gravida ac nulla.',
  },
];

export function Showcase() {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={[s.section, { backgroundColor: t.bg }]}>
      <Text style={[s.heading, { color: t.text }]}>
        {'A single place to\ncreate and edit images'}
      </Text>

      <View style={s.features}>
        {FEATURES.map((f) => (
          <View key={f.title} style={s.featureRow}>
            <View style={[s.iconBadge, { backgroundColor: t.accentSoft }]}>
              <Ionicons name={f.icon} size={18} color={t.accent} />
            </View>
            <View style={s.featureText}>
              <Text style={[s.featureTitle, { color: t.text }]}>{f.title}</Text>
              <Text style={[s.featureDesc, { color: t.textSub }]}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <MockupCard t={t} />
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingHorizontal: 22,
    paddingTop: 44,
    paddingBottom: 56,
  },

  heading: {
    fontFamily: F.display900,
    fontSize: 27,
    letterSpacing: -0.8,
    lineHeight: 32,
    marginBottom: 26,
  },

  features: {
    gap: 18,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 14,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: F.sans700,
    fontSize: 15,
    marginBottom: 4,
  },
  featureDesc: {
    fontFamily: F.sans400,
    fontSize: 13,
    lineHeight: 19,
  },
});

/**
 * Discover — ported from Vite's `Containers/Studio/Discover`. The web
 * version hand-rolls a `<video>` element with manual play/pause state; RN
 * has no equivalent, so this uses `expo-video`'s `useVideoPlayer`/`VideoView`
 * (already a dependency, already the established substitution — see
 * `Support/components/MessageBubble.tsx` and `CMS/README.md`'s platform-gap
 * notes). `nativeControls` gives real play/pause/scrub/fullscreen for free,
 * so unlike the web version there's no hand-rolled play-button overlay.
 *
 * Tutorial list is static content (same three CDN video URLs as the web
 * reference) — no backend endpoint for this.
 */
import { useVideoPlayer, VideoView } from 'expo-video';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme, type AppColors } from '@/lib/theme';

import { VideoListItem } from './components/VideoListItem';

type Tutorial = {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
};

const TUTORIALS: Tutorial[] = [
  {
    id: 1,
    title: 'Explore the App Sketch Studio Editor',
    description: 'Learn how to navigate and use the main features of App Sketch Studio',
    videoUrl: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/AI-Powered_E-Commerce_Website_Builder.mp4',
    duration: '9:12',
  },
  {
    id: 2,
    title: 'Build along to create AI-powered e-commerce website',
    description: 'Step-by-step guide to building an e-commerce site with AI features',
    videoUrl: 'https://appsketch-prod-1.s3.ap-south-1.amazonaws.com/phurti-cloudfront/imagestore/How+to+Use+Appscatch.ai.mp4',
    duration: '1:38',
  },
  {
    id: 3,
    title: 'How to use App Sketch for website building',
    description: 'Complete tutorial on website building with App Sketch tools',
    videoUrl:
      'https://appsketch-prod-1.s3.ap-south-1.amazonaws.com/phurti-cloudfront/imagestore/How+to+Use+Appscatch.ai+-+MERGE+-+Videobolt.net.mp4',
    duration: '7:43',
  },
];

export function DiscoverScreen() {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const [selected, setSelected] = React.useState(0);
  const video = TUTORIALS[selected];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <Text style={[st.heading, { color: t.text }]}>Discover</Text>
      <Text style={[st.subheading, { color: t.textSub }]}>
        Explore tutorials, templates, and resources for your projects.
      </Text>

      {/* Re-keyed by video id — same effect as the web reference's
          `key={selectedVideo}` forcing a fresh <video> element on selection. */}
      <FeaturedPlayer key={video.id} video={video} t={t} />

      <Text style={[st.listHeading, { color: t.text }]}>More tutorials</Text>
      <View style={st.list}>
        {TUTORIALS.map((item, i) => (
          <VideoListItem
            key={item.id}
            title={item.title}
            duration={item.duration}
            active={i === selected}
            t={t}
            onPress={() => setSelected(i)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function FeaturedPlayer({ video, t }: { video: Tutorial; t: AppColors }) {
  const player = useVideoPlayer(video.videoUrl, (p) => {
    p.muted = true;
    p.loop = false;
    p.play();
  });

  return (
    <View style={[st.playerWrap, { backgroundColor: t.card, borderColor: t.border }]}>
      <VideoView player={player} style={st.player} nativeControls allowsFullscreen contentFit="cover" />
      <Text style={[st.playerTitle, { color: t.text }]} numberOfLines={2}>
        {video.title}
      </Text>
      <Text style={[st.playerDesc, { color: t.textSub }]} numberOfLines={2}>
        {video.description}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  subheading: { fontSize: 13, marginTop: 4, marginBottom: 18, lineHeight: 18 },

  playerWrap: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  player: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  playerTitle: { fontSize: 15, fontWeight: '700', paddingHorizontal: 14, paddingTop: 12 },
  playerDesc: { fontSize: 12.5, lineHeight: 18, paddingHorizontal: 14, paddingTop: 4, paddingBottom: 14 },

  listHeading: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  list: { gap: 10 },
});

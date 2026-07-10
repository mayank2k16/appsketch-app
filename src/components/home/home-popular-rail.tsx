import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Image } from '@/components/ui';
import { F } from '@/lib/fonts';
import { Heart } from '@/components/ui/icons';
import type { Product } from '@/api/home';

const RED   = '#C41230';
const BLACK = '#0C0C0C';

type HomePopularRailProps = {
  products: Product[] | undefined;
  primaryColor?: string;
};

export function HomePopularRail({
  products,
  primaryColor = RED,
}: HomePopularRailProps) {
  const router = useRouter();

  if (!products?.length) return null;

  return (
    <View style={rl.root}>
      {/* Header */}
      <View style={rl.header}>
        <View style={rl.accentBar} />
        <View style={{ flex: 1, gap: 2 }}>
          <TextInput
            editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
            value="Most Popular"
            style={rl.title}
          />
          <TextInput
            editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
            value="Top picks from Chinese Corner"
            style={rl.subtitle}
          />
        </View>
        <Pressable
          onPress={() => router.push('/storefront/categories')}
          style={rl.seeAllBtn}
        >
          <TextInput
            editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
            value="See All →"
            style={rl.seeAllTxt}
          />
        </Pressable>
      </View>

      {/* Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={rl.scroll}
      >
        {products.map((product) => (
          <Pressable
            key={product.id}
            onPress={() => router.push(`/storefront/${product.id}` as never)}
            style={rl.card}
          >
            <View style={rl.imgWrap}>
              <Image
                source={{ uri: product.imageUrl }}
                style={rl.img}
                contentFit="cover"
              />
              {product.statusTag && (
                <View style={rl.statusTag}>
                  <TextInput
                    editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                    value={product.statusTag}
                    style={rl.statusTxt}
                  />
                </View>
              )}
              <View style={rl.likesBadge}>
                <Heart color="#FFF" size={12} filled />
                <TextInput
                  editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                  value={String(product.likesCount ?? 0)}
                  style={rl.likesTxt}
                />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const rl = StyleSheet.create({
  root: {
    backgroundColor: '#FFF5F7',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFD5D8',
  },
  accentBar: {
    width: 4, height: 38,
    backgroundColor: RED, borderRadius: 2,
    ...Platform.select({
      ios: { shadowColor: RED, shadowOpacity: 0.55, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
      android: { elevation: 3 },
    }),
  },
  title: {
    fontSize: 22, fontFamily: F.display900, color: '#1A1A1A', letterSpacing: -0.4,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 30,
  },
  subtitle: {
    fontSize: 10.5, fontFamily: F.sans600, color: RED, letterSpacing: 0.5,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 16,
  },
  seeAllBtn: {
    paddingVertical: 6, paddingHorizontal: 14,
    backgroundColor: RED, borderRadius: 20,
  },
  seeAllTxt: {
    fontSize: 11, fontFamily: F.sans700, color: '#FFFFFF', letterSpacing: 0.3,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 15,
  },
  scroll: {
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 10,
  },
  card: {
    width: 160,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 },
    }),
  },
  imgWrap: {
    width: 160, height: 200,
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#FFE4E8',
    position: 'relative',
  },
  img: { width: 160, height: 200, borderRadius: 12 },
  statusTag: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  statusTxt: {
    fontSize: 10, fontFamily: F.sans700, color: BLACK,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 14,
  },
  likesBadge: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
  },
  likesTxt: {
    fontSize: 11, fontFamily: F.sans700, color: '#FFFFFF',
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 14,
  },
});

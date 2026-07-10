import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Pressable,
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image, Text } from '@/components/ui';
import { Image as ExpoImage } from 'expo-image';
import { F } from '@/lib/fonts';
import { LinearGradient } from 'expo-linear-gradient';
import { Cart, Settings } from '@/components/ui/icons';
import { useCart } from '@/lib/store/cart-store';
import { Ionicons } from '@expo/vector-icons';
import { authenticatedClient } from '@/api/common/client';

const { width } = Dimensions.get('window');

const LOGO = require('../../../assets/chinese_corner.png');

// ── Letter-by-letter animated brand text ──────────────────────────────────────
function BrandLine({
  text,
  fontSize,
  startDelay,
}: {
  text: string;
  fontSize: number;
  startDelay: number;
}) {
  const letters = text.split('');
  const anims = React.useRef(letters.map(() => new Animated.Value(0))).current;

  React.useEffect(() => {
    const sequence = letters.map((_, i) =>
      Animated.spring(anims[i], {
        toValue: 1,
        delay: startDelay + i * 58,
        useNativeDriver: true,
        damping: 14,
        stiffness: 260,
      })
    );
    Animated.parallel(sequence).start();
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      {letters.map((char, i) => (
        <Animated.Text
          key={i}
          style={{
            opacity: anims[i],
            transform: [
              {
                translateY: anims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
            fontFamily: F.display900,
            fontSize,
            color: '#FFFFFF',
            letterSpacing: char === ' ' ? 2 : 1.2,
            // space character width fix
            width: char === ' ' ? fontSize * 0.28 : undefined,
          }}
        >
          {char}
        </Animated.Text>
      ))}
    </View>
  );
}

type Props = {
  user?: any;
  primaryColor?: string;
  onMenuPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
};

export function HomeHeader({
  user,
  primaryColor = '#111',
  onMenuPress,
  showBackButton = false,
  onBackPress,
}: Props) {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { totalItems } = useCart();

  const headerPaddingTop = insets.top + (Platform.OS === 'android' ? 8 : 10);

  const [searchOpen, setSearchOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const animatedWidth = React.useRef(new Animated.Value(0)).current;
  const debounceRef   = React.useRef<any>(null);

  React.useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: searchOpen ? width - 40 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [searchOpen]);

  React.useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await authenticatedClient.get(`api/shop/sellableproductsearch/${search}/`);
        setResults(res?.data?.results || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const closeSearch = () => {
    setSearch('');
    setResults([]);
    setSearchOpen(false);
    Keyboard.dismiss();
  };

  return (
    <View style={h.root}>
      {/* ── Solid premium red background ── */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#C41230' }]} />

      {/* ── Top row: logo  |  (search open bar)  |  icons ── */}
      <View style={[h.topRow, { paddingTop: headerPaddingTop }]}>

        {/* LEFT: back button (if sub-screen) + logo + brand name */}
        {!searchOpen && (
          <View style={h.leftGroup}>
            {showBackButton && (
              <Pressable onPress={onBackPress} style={h.backBtn} hitSlop={8}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </Pressable>
            )}
            <Pressable
              onPress={() => router.push('/storefront')}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={h.logoClip}>
                <ExpoImage
                  source={LOGO}
                  style={h.logoWide}
                  contentFit="contain"
                />
              </View>
            </Pressable>
          </View>
        )}

        {/* SEARCH EXPAND BAR */}
        <Animated.View style={{ width: animatedWidth, overflow: 'hidden' }}>
          {searchOpen && (
            <View style={h.searchExpandRow}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.7)" />
              <TextInput
                autoFocus
                value={search}
                onChangeText={setSearch}
                placeholder="Search fresh market..."
                placeholderTextColor="rgba(255,255,255,0.40)"
                style={h.searchInput}
              />
              <Pressable onPress={closeSearch}>
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.65)" />
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* RIGHT: search + cart + settings */}
        {!searchOpen && (
          <View style={h.iconsRow}>
            <Pressable onPress={() => setSearchOpen(true)} style={h.iconBtn}>
              <Ionicons name="search" size={22} color="#FFFFFF" />
            </Pressable>

            <Pressable onPress={() => router.push('/storefront/cart')} style={h.iconBtn}>
              <View>
                <Cart color="#FFFFFF" size={22} />
                {totalItems > 0 && (
                  <View style={h.cartBadge}>
                    <Text style={h.cartBadgeTxt}>{totalItems}</Text>
                  </View>
                )}
              </View>
            </Pressable>

            <Pressable onPress={onMenuPress} style={h.iconBtn}>
              <Settings color="#FFFFFF" width={22} height={22} />
            </Pressable>
          </View>
        )}
      </View>

      {/* ── Search results dropdown ── */}
      {searchOpen && search.length > 0 && (
        <View style={h.dropdown}>
          {loading ? (
            <ActivityIndicator style={{ margin: 16 }} />
          ) : (
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={results}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { closeSearch(); router.push(`/storefront/${item.id}`); }}
                  style={h.dropRow}
                >
                  <Image
                    source={{ uri: item.photo }}
                    style={h.dropImg}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontWeight: '600' }}>{item.product_name}</Text>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>₹{item.price}</Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const h = StyleSheet.create({
  root: {
    zIndex: 100,
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  // ── Circular logo container — matches the circular logo shape exactly ──
  logoClip: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  logoWide: {
    width: 56,
    height: 56,
  },
  searchExpandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: '#FFFFFF',
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -6, right: -8,
    backgroundColor: '#E01F3D',
    minWidth: 18, height: 18,
    borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeTxt: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0, right: 0,
    backgroundColor: '#fff',
    maxHeight: 300,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  dropRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  dropImg: {
    width: 50, height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
});
// /components/common/CommonHeader.tsx
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
  StyleSheet,
} from 'react-native';
import { Image, Text } from '@/components/ui';
import { Cart, Settings } from '@/components/ui/icons';
import { useCart } from '@/lib/store/cart-store';
import { Ionicons } from '@expo/vector-icons';
import { authenticatedClient } from '@/api/common/client';

const { width } = Dimensions.get('window');

type Props = {
  user?: any;
  primaryColor?: string;
  onMenuPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  // optional override to control header zIndex / style
  containerStyle?: any;
};

export function CommonHeader({
  user,
  primaryColor = '#111',
  onMenuPress,
  showBackButton = false,
  onBackPress,
  containerStyle,
}: Props) {
  const router = useRouter();
  const { totalItems } = useCart();

  const [searchOpen, setSearchOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const animatedWidth = React.useRef(new Animated.Value(0)).current;
  const debounceRef = React.useRef<any>(null);

  // Animate search open/close
  React.useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: searchOpen ? width - 40 : 0,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [searchOpen]);

  // Debounced search
  React.useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await authenticatedClient.get(
          `api/shop/sellableproductsearch/${encodeURIComponent(search)}/`
        );
        const data = res?.data;
        setResults(data?.results || []);
      } catch (err) {
        console.log('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 380);

    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const closeSearch = () => {
    setSearch('');
    setResults([]);
    setSearchOpen(false);
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.root, containerStyle]}>
      <View style={styles.topRow}>
        {/* LEFT: Back button or Logo */}
        {!searchOpen && (
          <Pressable
            onPress={showBackButton ? onBackPress : () => router.push('/storefront')}
            hitSlop={8}
          >
            {showBackButton ? (
              <Ionicons name="chevron-back" size={24} color="#111" />
            ) : (
              <View style={styles.logoWrap}>
                <Image
                  source={{
                    uri:
                      (user?.tenantLogo ||
                        'https://appsketch-prod-1.s3.amazonaws.com/phurti-cloudfront/website_images/Screenshot_2025-11-20_at_12.06.57_AM_V2hcfON.png'),
                  }}
                  style={styles.logo}
                  contentFit="contain"
                />
              </View>
            )}
          </Pressable>
        )}

        {/* SEARCH BAR (animated) */}
        <Animated.View style={{ width: animatedWidth, overflow: 'hidden' }}>
          {searchOpen && (
            <View style={styles.searchInner}>
              <Ionicons name="search" size={18} color="#6B7280" />
              <TextInput
                autoFocus
                value={search}
                onChangeText={setSearch}
                placeholder="Search products..."
                style={styles.searchInput}
                returnKeyType="search"
              />
              <Pressable onPress={closeSearch} hitSlop={8}>
                <Ionicons name="close" size={18} color="#6B7280" />
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* RIGHT ICONS */}
        {!searchOpen && (
          <View style={styles.rightIcons}>
            <Pressable onPress={() => setSearchOpen(true)} style={{ marginRight: 12 }} hitSlop={8}>
              <Ionicons name="search" size={22} color="#111" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/storefront/cart')}
              style={{ marginRight: 12 }}
              hitSlop={8}
            >
              <View>
                <Cart color="#111" size={22} />
                {totalItems > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalItems}</Text>
                  </View>
                )}
              </View>
            </Pressable>

            <Pressable onPress={onMenuPress} hitSlop={8}>
              <Settings color="#111" width={22} height={22} />
            </Pressable>
          </View>
        )}
      </View>

      {/* SEARCH RESULTS DROPDOWN (overlay) */}
      {searchOpen && search.length > 0 && (
        <View style={styles.searchDropdown}>
          {loading ? (
            <ActivityIndicator style={{ margin: 16 }} />
          ) : (
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={results}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    closeSearch();
                    router.push(`/storefront/${item.id}`);
                  }}
                  style={styles.searchRow}
                >
                  <Image
                    source={{ uri: item.photo }}
                    style={styles.searchImage}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontWeight: '600' }}>
                      {item.product_name}
                    </Text>
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>
                      ₹{item.price}
                    </Text>
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

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#fff',
    zIndex: 100,
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  logoWrap: {
    backgroundColor: 'white',
    paddingHorizontal: 1,
    paddingVertical: 1,
    borderRadius: 2,
  },
  logo: { width: 90, height: 24 },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  searchDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    maxHeight: 320,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  searchRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  searchImage: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
});

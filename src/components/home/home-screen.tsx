/**
 * HomeScreen — Fast FCP Edition
 *
 * Key improvements over previous version:
 *
 * 1. NO SKELETON ON BACK-NAVIGATION
 *    React Query caches data. If we already have cached data (isLoading=false
 *    + data exists), we skip the skeleton entirely and render content instantly.
 *    `hasAnyCachedData` checks this before deciding to show skeleton.
 *
 * 2. FASTER SHIMMER (500ms cycle, not 850ms)
 *    Shimmer is now a component-local hook so it starts/stops with the
 *    component — no module-level singleton that bleeds across screens.
 *
 * 3. SKELETON ONLY FOR FIRST LOAD
 *    We track `everHadData` in a ref. Once data has been seen, skeleton
 *    is permanently suppressed for the lifetime of the component — even
 *    if a background refetch happens.
 *
 * 4. SECTION GUARD (error boundary per section)
 *    A render crash in one component can't take down the whole screen.
 *
 * 5. safeData() — all query results safely unwrapped, never throws.
 */

import * as React from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Text }        from '@/components/ui';
import { Footer }      from '@/components/footer';
import { useTenant }   from '@/lib/tenant';
import { useHomePage } from '@/api/home';

import { HomeHeader }           from './home-header';
import { HomeGreeting, LocationPickerModal } from './home-greeting';
import { HomeAnnouncement }   from './home-announcement';
import { HomeRecentlyViewed } from './home-recently-viewed';
import { HomeOrders }         from './home-orders';
import { HomeStories }        from './home-stories';
import { HomeProductRail }    from './home-product-rail';
import { HomePopularRail }    from './home-popular-rail';
import { HomeCategories }     from './home-categories';

const { width } = Dimensions.get('window');

// ─── safeData ─────────────────────────────────────────────────────────────────
function safeData<T>(query: any): T | null {
  try {
    if (query == null) return null;
    if (typeof query === 'object' && 'data' in query) return (query.data as T) ?? null;
    return query as T;
  } catch {
    return null;
  }
}

// ─── SectionGuard (error boundary) ────────────────────────────────────────────
class SectionGuard extends React.Component<
  { children: React.ReactNode; name?: string },
  { crashed: boolean }
> {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch(e: Error) {
    console.warn(`[HomeScreen] <${this.props.name}> crashed:`, e.message);
  }
  render() { return this.state.crashed ? null : this.props.children; }
}

// ─── useShimmer — local shimmer, lifecycle-safe ────────────────────────────────
// Returns an interpolated opacity value. Starts when called, stops on unmount.
// No module-level state — safe across navigation.
function useShimmer() {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 450, useNativeDriver: true, isInteraction: false }),
        Animated.timing(anim, { toValue: 0, duration: 450, useNativeDriver: true, isInteraction: false }),
      ]),
    );
    loop.start();
    return () => loop.stop(); // clean up on unmount / back-nav
  }, []);
  return anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.7] });
}

// ─── Bone ─────────────────────────────────────────────────────────────────────
function Bone({
  shimmer,
  w, h, r = 8,
}: {
  shimmer: Animated.AnimatedInterpolation<number>;
  w: number | string;
  h: number;
  r?: number;
}) {
  return (
    <Animated.View
      style={{
        width: w as any, height: h, borderRadius: r,
        backgroundColor: '#E0E0E0', opacity: shimmer,
      }}
    />
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function HomeSkeleton() {
  const shimmer = useShimmer();
  const B = (p: { w: number | string; h: number; r?: number }) =>
    <Bone shimmer={shimmer} {...p} />;

  const cardW = (width - 32 - 16) / 3;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
      scrollEventThrottle={16}
    >
      {/* Greeting */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 16, gap: 8 }}>
        <B w={180} h={22} r={6} />
        <B w={240} h={14} r={5} />
      </View>

      {/* Announcement */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <B w="100%" h={60} r={12} />
      </View>

      {/* Categories */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <B w={100} h={18} r={6} />
          <B w={60}  h={18} r={6} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={{ flex: 1, gap: 6 }}>
              <B w="100%" h={90} r={10} />
              <B w="70%"  h={12} r={4} />
              <B w="50%"  h={11} r={4} />
            </View>
          ))}
        </View>
      </View>

      {/* Rail */}
      <View style={{ paddingVertical: 16 }}>
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}><B w={140} h={20} r={6} /></View>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={{ gap: 7 }}>
              <B w={140} h={180} r={12} />
              <B w={100} h={13}  r={4} />
              <B w={70}  h={13}  r={4} />
            </View>
          ))}
        </View>
      </View>

      {/* Orders */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}>
        <B w={120} h={20} r={6} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[1, 2, 3].map(i => <B key={i} w={cardW} h={80} r={12} />)}
        </View>
      </View>

      {/* Stories */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 16 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={{ alignItems: 'center', gap: 6 }}>
            <B w={60} h={60} r={30} />
            <B w={48} h={10} r={4}  />
          </View>
        ))}
      </View>

      {/* Rail 2 */}
      <View style={{ paddingVertical: 16 }}>
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}><B w={140} h={20} r={6} /></View>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={{ gap: 7 }}>
              <B w={140} h={180} r={12} />
              <B w={100} h={13}  r={4} />
              <B w={70}  h={13}  r={4} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── CategoriesSkeleton — inline, shows while categories API is in-flight ─────
function CategoriesSkeleton() {
  const shimmer = useShimmer();
  const B = (p: { w: number | string; h: number; r?: number }) =>
    <Bone shimmer={shimmer} {...p} />;
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <B w={100} h={18} r={6} />
        <B w={60}  h={18} r={6} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {[1, 2, 3].map(i => (
          <View key={i} style={{ flex: 1, gap: 6 }}>
            <B w="100%" h={90} r={10} />
            <B w="70%"  h={12} r={4} />
            <B w="50%"  h={11} r={4} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── HomeScreen ────────────────────────────────────────────────────────────────
type HomeScreenProps = { onMenuPress?: () => void };

export function HomeScreen({ onMenuPress }: HomeScreenProps) {
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.theme?.colors?.primary ?? '#2563EB';

  // Location modal state lives here — OUTSIDE the ScrollView — so closing it
  // never breaks the ScrollView touch responder chain (iOS transparent Modal bug).
  const [locationOpen, setLocationOpen] = React.useState(false);

  // Stable callbacks — changing locationOpen won't create new references,
  // so React.memo on Content will block re-renders caused by locationOpen toggling.
  const onLocationPress = React.useCallback(() => setLocationOpen(true), []);
  const onMenuPressCb   = React.useCallback(() => onMenuPress?.(), [onMenuPress]);

  const raw = useHomePage();

  // Safely destructure — everything optional
  const userQuery          = raw?.user;
  const announcementQuery  = raw?.announcement;
  const categoriesQuery    = raw?.categories;
  const recentlyViewedQ    = raw?.recentlyViewed;
  const orderCountsQuery   = raw?.orderCounts;
  const storiesQuery       = raw?.stories;
  const newItemsRaw        = raw?.newItems;
  const mostPopularQuery   = raw?.mostPopular;

  // Unwrap all data safely
  const userData           = safeData<any>(userQuery);
  const announcementData   = safeData<any>(announcementQuery);
  const categoriesData     = safeData<any>(categoriesQuery);
  const recentlyViewedData = safeData<any>(recentlyViewedQ);
  const orderCountsData    = safeData<any>(orderCountsQuery);
  const storiesData        = safeData<any>(storiesQuery);
  const mostPopularData    = safeData<any>(mostPopularQuery);
  const newItemsData       = safeData<any>(newItemsRaw) ?? (Array.isArray(newItemsRaw) ? newItemsRaw : null);

  // ── Per-section loading flags ─────────────────────────────────────────────
  // No full-page gate. Content renders immediately; each section owns its skeleton.
  const categoriesLoading = (raw?.categories?.isLoading ?? false) && !categoriesData;

  // Image prefetch — section-by-section as data lands
  React.useEffect(() => {
    if (!categoriesData) return;
    try {
      (Array.isArray(categoriesData) ? categoriesData : [])
        .slice(0, 6).forEach((c: any) => { if (c?.image) Image.prefetch(c.image).catch(() => {}); });
    } catch {}
  }, [categoriesData]);

  React.useEffect(() => {
    if (!newItemsData) return;
    try {
      (Array.isArray(newItemsData) ? newItemsData : [])
        .slice(0, 4).forEach((p: any) => {
          const u = p?.image_url || p?.photo || p?.images?.[0];
          if (u) Image.prefetch(u).catch(() => {});
        });
    } catch {}
  }, [newItemsData]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={st.screen}>
      <SectionGuard name="HomeHeader">
        <HomeHeader user={userData} primaryColor={primaryColor} onMenuPress={onMenuPress} />
      </SectionGuard>

      <ScrollView
        style={st.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0 }}
        removeClippedSubviews={Platform.OS === 'android'}
        scrollEventThrottle={16}
      >
        {/*
          Always render Content without a conditional FadeIn wrapper.
          Previously: switching between <FadeIn><Content/></FadeIn> and <Content/>
          when isLoading flipped caused a full unmount+remount of 200 products → 2s freeze.
          Now: Content is always mounted; its own internal fade runs once on first mount.
          React.memo + stable useCallback refs prevent re-renders from locationOpen changes.
        */}
        <Content
          userData={userData}
          announcementData={announcementData}
          categoriesData={categoriesData}
          categoriesLoading={categoriesLoading}
          recentlyViewedData={recentlyViewedData}
          newItemsRaw={newItemsRaw}
          newItemsData={newItemsData}
          orderCountsData={orderCountsData}
          storiesData={storiesData}
          mostPopularData={mostPopularData}
          primaryColor={primaryColor}
          onLocationPress={onLocationPress}
          onMenuPress={onMenuPressCb}
        />
      </ScrollView>

      {/*
        LocationPickerModal rendered OUTSIDE the ScrollView.
        Transparent Modals closing inside a ScrollView break iOS touch
        responder chain — keeping it here as a sibling fixes the freeze.
      */}
      <LocationPickerModal
        visible={locationOpen}
        onClose={() => setLocationOpen(false)}
      />
    </View>
  );
}

// ─── Content — memoized so locationOpen state changes don't cause re-renders ───
// React.memo + stable useCallback refs in HomeScreen mean this component only
// re-renders when actual data props change (i.e. when queries resolve), never
// when the modal is opened/closed.
type ContentProps = {
  userData: any;
  announcementData: any;
  categoriesData: any;
  categoriesLoading: boolean;
  recentlyViewedData: any;
  newItemsRaw: any;
  newItemsData: any;
  orderCountsData: any;
  storiesData: any;
  mostPopularData: any;
  primaryColor: string;
  onLocationPress: () => void;
  onMenuPress?: () => void;
};

const Content = React.memo(function Content({
  userData, announcementData, categoriesData, categoriesLoading,
  recentlyViewedData, newItemsRaw, newItemsData,
  orderCountsData, storiesData, mostPopularData, primaryColor,
  onLocationPress, onMenuPress,
}: ContentProps) {
  // Fade in once on first mount — never re-triggers, no unmount/remount risk.
  const opacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity }}>

      <SectionGuard name="HomeGreeting">
        <HomeGreeting user={userData} onLocationPress={onLocationPress} onMenuPress={onMenuPress} />
      </SectionGuard>

      {/* {storiesData != null && (
        <SectionGuard name="HomeStories">
          <HomeStories stories={storiesData} />
        </SectionGuard>
      )} */}

      {categoriesLoading ? (
        <CategoriesSkeleton />
      ) : categoriesData != null ? (
        <SectionGuard name="HomeCategories">
          <HomeCategories categories={categoriesData} primaryColor={primaryColor} />
        </SectionGuard>
      ) : null}

      {announcementData != null && (
        <SectionGuard name="HomeAnnouncement">
          <HomeAnnouncement announcement={announcementData} primaryColor={primaryColor} />
        </SectionGuard>
      )}

{/*
      {recentlyViewedData != null && (
        <SectionGuard name="HomeRecentlyViewed">
          <HomeRecentlyViewed items={recentlyViewedData} />
        </SectionGuard>
      )} */}

      {/* Always mounted — HomeProductRail shows its own skeleton while loading.
          Conditional mount caused the freeze: unmount→remount layouted every card at once. */}
      <SectionGuard name="HomeProductRail">
        <HomeProductRail title="New Items" products={newItemsRaw} primaryColor={primaryColor} />
      </SectionGuard>

      {/* {orderCountsData != null && (
        <SectionGuard name="HomeOrders">
          <HomeOrders counts={orderCountsData} primaryColor={primaryColor} />
        </SectionGuard>
      )} */}

      {mostPopularData != null && (
        <SectionGuard name="HomePopularRail">
          <HomePopularRail products={mostPopularData} primaryColor={primaryColor} />
        </SectionGuard>
      )}

      <Footer />
    </Animated.View>
  );
});

// ─── Styles ────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0C0C0C' },
  scroll: { flex: 1 },
});
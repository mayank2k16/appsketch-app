
/**
 * HomeGreeting — Marketplace Edition
 *
 * FIXES:
 *  1. ROOT VIEW: Never use pointerEvents="box-none" on the root wrapper —
 *     it prevents correct height measurement inside a ScrollView on Android,
 *     causing all content below a certain point to collapse/disappear.
 *     Root View is plain (no pointerEvents). Section wrappers that are purely
 *     decorative containers use pointerEvents="box-none" safely because their
 *     children (Pressables, ScrollViews) are explicitly sized.
 *
 *  2. BLANK SCREEN BUG: The previous phantom-tap issue (tapping blank space
 *     navigating away) is fixed by removing the height:20 bottom spacer and
 *     ensuring the root View has no pointerEvents override. The parent
 *     ScrollView's contentContainerStyle={{ paddingBottom: 24 }} handles inset.
 *
 *  3. Consistent PAD = 12 applied as paddingHorizontal across ALL sections.
 *  4. Section gaps unified via SECTION_GAP constant (8px).
 *  5. HomeGreeting accepts optional `user` prop (passed by HomeScreen) — ignored
 *     internally but prevents a TypeScript prop-mismatch warning.
 */

import * as React from 'react';
import {
  View,
  Animated,
  Pressable,
  Dimensions,
  StyleSheet,
  Platform,
  TextInput,
  Modal,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Alert,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { Image } from '@/components/ui';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { authenticatedClient } from '@/api/common/client';
import { useCart } from '@/lib/store/cart-store';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import type { DeliveryLocation } from '@/lib/store/cart-store';
import { F } from '@/lib/fonts';
import type { Region } from 'react-native-maps';

// ── react-native-maps — guarded require so a missing native module never crashes ──
let MapView: any        = null;
let Marker: any         = null;
let PROVIDER_DEFAULT: any = null;
try {
  const m          = require('react-native-maps');
  MapView          = m.default;
  Marker           = m.Marker;
  PROVIDER_DEFAULT = m.PROVIDER_DEFAULT;
} catch { /* native module not yet linked — MapView stays null */ }

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Design tokens ──────────────────────────────────────────────────────────
const C = {
  // Premium red palette — #C41230
  orange:     '#C41230',   // primary red (replaces orange — kept name for compat)
  orangeTint: '#FFF0F3',   // light red tint
  black:      '#0C0C0C',
  void:       '#1A0005',   // deep dark reddish-black (header bg)
  obsidian:   '#1C0008',   // dark (carousel bg)
  slate:      '#2B0010',   // mid dark
  slateUp:    '#3D0018',   // lighter dark
  glass:      'rgba(255,255,255,0.07)',
  glassBdr:   'rgba(255,255,255,0.12)',
  white:      '#FFFFFF',
  offWhite:   'rgba(255,255,255,0.90)',
  dimWhite:   'rgba(255,255,255,0.50)',
  muted:      '#9A8F85',
  mutedLight: '#C4B8AD',
  border:     '#E8E0E5',
  bgPage:     '#FFF5F7',   // light red tint page background
  bgCard:     '#FFFFFF',
  limeBtn:    '#C41230',   // CTA button
  pinCircle:  '#7A0018',   // location pin circle bg
  leafGreen:  '#C41230',   // primary for success states
} as const;

// ─── Layout constants — single source of truth ──────────────────────────────
const PAD         = 12;   // horizontal padding for ALL sections
const SECTION_GAP = 8;    // vertical gap between sections

// ═══════════════════════════════════════════════════════════════════════════
//  HOME CONFIG
// ═══════════════════════════════════════════════════════════════════════════
export const HOME_CONFIG = {

  searchConfig: {
    enabled: true,
    showVoice: true,
    hints: [
      "Search 'Dim Sum'",
      "Search 'Kung Pao Chicken'",
      "Search 'Wonton Soup'",
      "Search 'Peking Duck'",
      "Search 'Fried Rice'",
    ],
  },

  carouselConfig: {
    enabled: true,
    autoAdvanceMs: 4000,
    slides: [
      {
        id: 'h1',
        route: '/storefront/categories',
        params: { categoryId: 24638, categoryName: 'Momos Veg' },
        brandLogoText: 'CHINESE CORNER',
        brandLogoColor: '#FFD166',
        title: 'Authentic Dim Sum',
        subtitle: 'Hand-folded dumplings & buns delivered hot',
        priceLabel: 'FREE DELIVERY',
        dateLabel: 'Order before 10 PM for same-day delivery',
        heroImageUri: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=85',
        bgFrom: '#1A0005',
        bgTo:   '#2D0010',
        partners: [
          { id: 'p1', text: '15% off\nfirst order', icon: '🥟', highlight: false },
          { id: 'p2', text: 'Same-day\ndelivery', icon: '🚚', highlight: true },
        ],
      },
      {
        id: 'h2',
        route: '/storefront/categories',
        params: { categoryId: 24633, categoryName: 'Noodles' },
        brandLogoText: 'WOK & FIRE',
        brandLogoColor: '#FFD166',
        title: 'Wok-Tossed Noodles',
        subtitle: 'Fresh hand-pulled noodles in rich broth',
        priceLabel: 'UP TO 30% OFF',
        dateLabel: 'Limited time — order today',
        heroImageUri: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=85',
        bgFrom: '#1C0008',
        bgTo:   '#3A0018',
        partners: [
          { id: 'p1', text: 'Extra 5% off\nwith wallet', icon: '🍜', highlight: false },
          { id: 'p2', text: 'Authentic\nrecipes', icon: '🔥', highlight: true },
        ],
      },
    ],
  },

  primaryBanners: {
    enabled: true,
    items: [
      { id: 'pb1', title: 'Noodles',          image: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/3f656968c7a04dd2acbf4dd83ce86f74.webp', route: '/storefront/categories', params: { categoryId: 24633, categoryName: 'Noodles' } },
      { id: 'pb2', title: 'Momos Veg',        image: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/3cf5c7bcfb424355af25f5e12d70cf2f.webp',  route: '/storefront/categories', params: { categoryId: 24638, categoryName: 'Momos Veg' } },
      { id: 'pb3', title: 'Momos Non-Veg',    image: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/53c410ab39584d8c984e91e2ea37480f.webp', route: '/storefront/categories', params: { categoryId: 24637, categoryName: 'Momos Non-Veg' } },
      { id: 'pb4', title: 'Wonton Fried',     image: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/67c63366e6574d5199a6f2e69fbc5afd.webp', route: '/storefront/categories', params: { categoryId: 24636, categoryName: 'Wonton Fried' } },
      { id: 'pb5', title: 'Soups',            image: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/8818a1bdc0264f6ba9f0c093575d100a.webp', route: '/storefront/categories', params: { categoryId: 24627, categoryName: 'Soups' } },
      { id: 'pb6', title: 'Starters Non-Veg', image: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/9546d5ccfdc544279bb8ee90b4f48744.webp', route: '/storefront/categories', params: { categoryId: 24628, categoryName: 'Starters Non-Veg' } },
      { id: 'pb7', title: 'Starters Veg',     image: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/05a4e266a39a49498d4e2df2f761ac67.webp', route: '/storefront/categories', params: { categoryId: 24629, categoryName: 'Starters Veg' } },
      { id: 'pb8', title: 'Fried Rice',       image: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/8cc2fdc911c241ee80381a3af2ae7667.webp', route: '/storefront/categories', params: { categoryId: 24634, categoryName: 'Fried Rice' } },
    ],
  },

  secondaryBanners: {
    enabled: true,
    items: [
      {
        id: 'sb1',
        route: '/storefront/categories',
        params: { categoryId: 24629, categoryName: 'Starters Veg' },
        brandLogoText: 'ORGANIC',
        brandLogoColor: '#C41230',
        personImageUri: 'https://images.unsplash.com/photo-1506484381205-f7945653044d?w=300&q=80',
        productName: 'ORGANIC BASKET',
        tagline: 'Certified organic produce straight from partner farms',
        pillText: 'New arrivals every Monday',
        pillBg: '#C41230',
        pillTextColor: '#FFFFFF',
        cardBg: '#FFF0F3',
        textColor: '#111111',
      },
      {
        id: 'sb2',
        route: '/storefront/categories',
        params: { categoryId: 24631, categoryName: 'Non-Veg Main Course' },
        brandLogoText: 'EXPRESS',
        brandLogoColor: '#D97706',
        personImageUri: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=300&q=80',
        productName: '30-MIN DELIVERY',
        tagline: 'Order groceries and get them in 30 minutes flat',
        pillText: 'Available in your area · Try now',
        pillBg: '#D97706',
        pillTextColor: '#FFFFFF',
        cardBg: '#FFFBEB',
        textColor: '#111111',
      },
    ],
  },

} as const;

// ─── Types ───────────────────────────────────────────────────────────────────
type HeroSlide       = (typeof HOME_CONFIG.carouselConfig.slides)[number];
type PrimaryBanner   = (typeof HOME_CONFIG.primaryBanners.items)[number];
type SecondaryBanner = (typeof HOME_CONFIG.secondaryBanners.items)[number];
type SearchResult = {
  id: number;
  slug?: string;          // product slug used for navigation (preferred over id)
  product_name: string;
  photo: string;
  price: number;
  market_price: number;
  currency?: { symbol: string };
  categories?: { name: string; id: number }[];
  sellable_inventory?: { quantity_remaining: number };
};

// ─── Waveform bars — voice recording animation ────────────────────────────────
const BAR_PEAKS  = [0.55, 0.80, 1.00, 0.90, 0.65, 0.85, 0.50];
const BAR_DURS   = [280, 320, 260, 300, 270, 310, 290];
const BAR_DELAYS = [  0,  70, 140, 210, 100, 170,  30];

function WaveformBars({ active }: { active: boolean }) {
  const anims = React.useRef(BAR_PEAKS.map(() => new Animated.Value(0.25))).current;

  React.useEffect(() => {
    if (!active) {
      anims.forEach(a => a.setValue(0.25));
      return;
    }
    const loops = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(BAR_DELAYS[i]),
          Animated.timing(anim, { toValue: BAR_PEAKS[i], duration: BAR_DURS[i], useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.20, duration: BAR_DURS[i], useNativeDriver: true }),
        ])
      )
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [active]);

  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', height: 56 }}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={{
            width: 5, height: 44, borderRadius: 3,
            backgroundColor: C.orange,
            opacity: 0.6 + i * 0.06,
            transform: [{ scaleY: a }],
          }}
        />
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VOICE SEARCH MODAL
// ═══════════════════════════════════════════════════════════════════════════
function VoiceSearchModal({ visible, onClose, onResult }: {
  visible: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
}) {
  const [phase,      setPhase]      = React.useState<'idle' | 'recording' | 'processing'>('idle');
  const [transcript, setTranscript] = React.useState('');
  const fadeAnim  = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  // Track whether we already sent a result to avoid double-firing
  const resultSentRef = React.useRef(false);

  // ── Wire up Voice listeners once ────────────────────────────────────────────
  React.useEffect(() => {
    Voice.onSpeechStart = () => setPhase('recording');

    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      const partial = e.value?.[0] ?? '';
      if (partial) setTranscript(partial);
    };

    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const best = e.value?.[0] ?? '';
      setTranscript(best);
      if (!resultSentRef.current) {
        resultSentRef.current = true;
        onResult(best);
        onClose();
      }
    };

    Voice.onSpeechEnd = () => {
      setPhase('processing');
    };

    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      const code = e.error?.code ?? '';
      // Code 5 = "client side error" / user cancelled — close silently
      if (code !== '5' && code !== 'recognition_fail') {
        Alert.alert('Voice Search', 'Could not recognise speech. Please try again.');
      }
      onClose();
    };

    return () => {
      Voice.destroy().then(() => Voice.removeAllListeners()).catch(() => {});
    };
  }, []);

  // ── Open / close ─────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (visible) {
      resultSentRef.current = false;
      setPhase('idle');
      setTranscript('');
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      startListening();
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start();
      Voice.stop().catch(() => {});
    }
  }, [visible]);

  async function startListening() {
    try {
      await Voice.start('en-IN');   // en-IN for Indian English accent; fallback to en-US
    } catch (err: any) {
      // If locale not supported fall back to en-US
      try { await Voice.start('en-US'); } catch {
        Alert.alert('Voice Search', 'Speech recognition is not available on this device.');
        onClose();
      }
    }
  }

  const handleStop = async () => {
    try {
      await Voice.stop();
      setPhase('processing');
    } catch { onClose(); }
  };

  // ── Pulse animation while recording ──────────────────────────────────────────
  React.useEffect(() => {
    if (phase !== 'recording') { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.00, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [phase]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[vmod.root, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <View style={vmod.card}>
          {/* Close */}
          <Pressable onPress={onClose} style={vmod.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={22} color={C.muted} />
          </Pressable>

          {/* Title */}
          <Text style={vmod.title}>
            {phase === 'idle' ? 'Starting…' : phase === 'recording' ? 'Listening…' : 'Processing…'}
          </Text>
          <Text style={vmod.sub}>
            {phase === 'recording' ? 'Speak now. Tap ■ when done.' : ' '}
          </Text>

          {/* Live transcript preview */}
          {!!transcript && (
            <Text style={vmod.transcript} numberOfLines={2}>{transcript}</Text>
          )}

          {/* Mic + waveform */}
          <View style={{ alignItems: 'center', marginVertical: 24 }}>
            {phase === 'recording' ? (
              <>
                <WaveformBars active />
                <View style={{ height: 16 }} />
                <Animated.View style={[vmod.micRing, { transform: [{ scale: pulseAnim }] }]}>
                  <View style={vmod.micInner}>
                    <Ionicons name="mic" size={30} color="#fff" />
                  </View>
                </Animated.View>
              </>
            ) : (
              <View style={[vmod.micRing, { opacity: 0.6 }]}>
                <View style={vmod.micInner}>
                  <Ionicons
                    name={phase === 'processing' ? 'sync-outline' : 'mic'}
                    size={30} color="#fff"
                  />
                </View>
              </View>
            )}
          </View>

          {/* Stop button */}
          {phase === 'recording' && (
            <Pressable onPress={handleStop} style={vmod.stopBtn}>
              <View style={vmod.stopIcon} />
              <Text style={vmod.stopTxt}>Stop</Text>
            </Pressable>
          )}

          {phase === 'processing' && (
            <ActivityIndicator color="#C41230" size="small" style={{ marginTop: 4 }} />
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const vmod = StyleSheet.create({
  root:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  card:     {
    backgroundColor: C.white, borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingTop: 20, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 16 },
      android: { elevation: 20 },
    }),
  },
  closeBtn:   { position: 'absolute', top: 16, right: 20 },
  title:      { fontSize: 20, fontWeight: '800', color: C.black, marginBottom: 4 },
  sub:        { fontSize: 13, color: C.muted, marginBottom: 8 },
  transcript: {
    fontSize: 15, fontWeight: '600', color: '#C41230',
    textAlign: 'center', paddingHorizontal: 16, marginBottom: 4,
  },
  micRing:  {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,75,20,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  micInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#C41230',
    alignItems: 'center', justifyContent: 'center',
  },
  stopBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F5F5F5', borderRadius: 50,
    paddingHorizontal: 28, paddingVertical: 12, marginTop: 8,
  },
  stopIcon: { width: 12, height: 12, borderRadius: 2, backgroundColor: C.black },
  stopTxt:  { fontSize: 14, fontWeight: '700', color: C.black },
});

// ═══════════════════════════════════════════════════════════════════════════
//  LOCATION BAR + PICKER MODAL
// ═══════════════════════════════════════════════════════════════════════════
const LOC_SHEET_H = Math.min(SH * 0.72, 580);

function formatDisplayName(addr: Location.LocationGeocodedAddress): string {
  // Prefer street-level precision so the user can see the pin moved
  const street = addr.street
    ? [addr.streetNumber, addr.street].filter(Boolean).join(' ')
    : null;
  const area = addr.district || addr.subregion || addr.city;
  const parts = [street, area].filter(Boolean);
  return parts.slice(0, 2).join(', ') || addr.city || 'Unknown';
}

function formatFullAddress(addr: Location.LocationGeocodedAddress): string {
  return [
    addr.streetNumber, addr.street,
    addr.district || addr.subregion,
    addr.city, addr.region,
    addr.postalCode, addr.country,
  ].filter(Boolean).join(', ');
}

function LocationBar({ onPress }: { onPress: () => void }) {
  // No insets.top — HomeHeader above already consumes the notch/status-bar area.
  const { deliveryLocation } = useCart();
  const line1 = deliveryLocation
    ? deliveryLocation.displayName
    : 'Set your delivery location';

  return (
    <Pressable style={loc.bar} onPress={onPress}>
      {/* "Delivery location" label */}
      <TextInput
        editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
        value="Delivery location"
        style={loc.barLabel}
      />
      {/* Pin icon + address on the same row */}
      <View style={loc.addrRow}>
        <Ionicons name="location-sharp" size={16} color="#E01F3D" />
        <TextInput
          editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
          numberOfLines={1}
          value={line1}
          style={loc.barAddress}
        />
      </View>
    </Pressable>
  );
}

const loc = StyleSheet.create({
  bar: {
    // Left-aligned column — tapping the whole row opens location picker
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    alignSelf: 'flex-start',  // don't stretch full width unnecessarily
  },
  barLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.50)',
    fontFamily: F.sans400,
    padding: 0, margin: 0,
    backgroundColor: 'transparent',
    height: 16,
    letterSpacing: 0.8,
  },
  addrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  barAddress: {
    fontSize: 16,
    fontFamily: F.sans700,
    color: '#FFFFFF',
    padding: 0, margin: 0,
    backgroundColor: 'transparent',
    maxWidth: SW - 80,
    height: 22,
    letterSpacing: 0.2,
  },
  // legacy — kept so no compile errors if referenced elsewhere
  bellWrap: { padding: 4 },
  centerBlock: { flex: 1, alignItems: 'center' },
  menuBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  menuLines: { gap: 5 },
  menuLine: { width: 20, height: 2, borderRadius: 1, backgroundColor: '#FFFFFF' },
});

const hdr = StyleSheet.create({
  promoBlock: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 8,
  },
  promoPct: {
    fontSize: 68,
    fontFamily: F.display900,
    color: '#E01F3D',
    padding: 0, margin: 0,
    backgroundColor: 'transparent',
    lineHeight: 72,
    height: 72,
    letterSpacing: -1,
  },
  promoRightCol: {
    paddingBottom: 8,
    gap: 2,
  },
  promoExtra: {
    fontSize: 28,
    fontFamily: F.display900,
    color: '#FFFFFF',
    letterSpacing: 3,
    padding: 0, margin: 0,
    backgroundColor: 'transparent',
    height: 32,
  },
  promoDiscount: {
    fontSize: 28,
    fontFamily: F.display900,
    color: '#FFFFFF',
    letterSpacing: 3,
    padding: 0, margin: 0,
    backgroundColor: 'transparent',
    height: 32,
  },
  promoSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.80)',
    fontFamily: F.sans400,
    padding: 0, margin: 0,
    backgroundColor: 'transparent',
    textAlign: 'center',
    height: 20,
    letterSpacing: 0.3,
  },
});

const INDIA_LAT = 20.5937;
const INDIA_LNG = 78.9629;

// ── Map confirm screen ─────────────────────────────────────────────────────────

function MapConfirmScreen({
  location,
  onConfirm,
  onBack,
}: {
  location: DeliveryLocation;
  onConfirm: (loc: DeliveryLocation) => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();

  const [mapRegion, setMapRegion] = React.useState<Region>({
    latitude:      location.latitude  || INDIA_LAT,
    longitude:     location.longitude || INDIA_LNG,
    latitudeDelta:  0.005,
    longitudeDelta: 0.005,
  });
  const [mapLat, setMapLat]         = React.useState(location.latitude  || INDIA_LAT);
  const [mapLng, setMapLng]         = React.useState(location.longitude || INDIA_LNG);
  const [pinDisplay, setPinDisplay] = React.useState(location.displayName);
  const [pinAddress, setPinAddress] = React.useState(location.fullAddress);
  const [gpsLoading, setGpsLoading] = React.useState(false);
  const [geocoding, setGeocoding]   = React.useState(false);
  const [searchQuery, setSearchQuery]     = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [showResults, setShowResults]     = React.useState(false);
  const [searching, setSearching]         = React.useState(false);
  const [bottomCardH, setBottomCardH]     = React.useState(220); // measured via onLayout

  const mapRef       = React.useRef<any>(null);
  const geocodeRef   = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimer  = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function flyTo(lat: number, lng: number, delta = 0.005) {
    const r: Region = { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta };
    setMapLat(lat); setMapLng(lng); setMapRegion(r);
    mapRef.current?.animateToRegion(r, 500);
  }

  function handleZoom(dir: 'in' | 'out') {
    const factor = dir === 'in' ? 0.4 : 2.2;
    const r: Region = {
      latitude: mapLat, longitude: mapLng,
      latitudeDelta:  mapRegion.latitudeDelta  * factor,
      longitudeDelta: mapRegion.longitudeDelta * factor,
    };
    setMapRegion(r);
    mapRef.current?.animateToRegion(r, 250);
  }

  function scheduleReverseGeocode(lat: number, lng: number) {
    if (geocodeRef.current) clearTimeout(geocodeRef.current);
    geocodeRef.current = setTimeout(async () => {
      try {
        setGeocoding(true);
        const [addr] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (addr) { setPinDisplay(formatDisplayName(addr)); setPinAddress(formatFullAddress(addr)); }
      } catch {} finally { setGeocoding(false); }
    }, 500);
  }

  async function handleGPSLocation() {
    try {
      setGpsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Access', 'Please allow location access in Settings.', [{ text: 'OK' }]);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      flyTo(pos.coords.latitude, pos.coords.longitude);
      scheduleReverseGeocode(pos.coords.latitude, pos.coords.longitude);
    } catch {
      Alert.alert('Location Error', 'Could not get current location.');
    } finally { setGpsLoading(false); }
  }

  function handleSearchChange(text: string) {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) { setSearchResults([]); setShowResults(false); return; }
    searchTimer.current = setTimeout(() => runSearch(text.trim()), 500);
  }

  async function runSearch(q: string) {
    try {
      setSearching(true);
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'ChineseCornerApp/1.0' } }
      );
      const data: any[] = await res.json();
      setSearchResults(data);
      setShowResults(data.length > 0);
    } catch {} finally { setSearching(false); }
  }

  function handleSelectResult(result: any) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    flyTo(lat, lng, 0.008);
    scheduleReverseGeocode(lat, lng);
    const a      = result.address ?? {};
    const street = [a.house_number, a.road].filter(Boolean).join(' ');
    const area   = a.suburb ?? a.neighbourhood ?? a.city_district ?? '';
    const disp   = ([street, area].filter(Boolean).join(', ') || result.display_name?.split(',')[0]) ?? '';
    if (disp) setPinDisplay(disp);
    if (result.display_name) setPinAddress(result.display_name);
    setSearchQuery(result.display_name?.split(',').slice(0, 2).join(',').trim() ?? '');
    setShowResults(false);
    Keyboard.dismiss();
  }

  function confirmLocation() {
    onConfirm({
      latitude: mapLat, longitude: mapLng,
      displayName: pinDisplay,
      city: location.city, state: location.state, pincode: location.pincode,
      fullAddress: pinAddress,
    });
  }

  return (
    <View style={mc.root}>
      {/* Header zone — topBar + search dropdown stacked, overlays map below */}
      <View style={mc.headerZone}>
        <View style={[mc.topBar, { paddingTop: insets.top + 6 }]}>
          <Pressable onPress={onBack} style={mc.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={C.black} />
          </Pressable>
          <View style={mc.topSearch}>
            {geocoding || searching
              ? <ActivityIndicator size="small" color={C.muted} style={{ marginLeft: 10 }} />
              : <Ionicons name="search-outline" size={15} color={C.muted} style={{ marginLeft: 10 }} />
            }
            <TextInput
              style={mc.topSearchInput}
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder={geocoding ? 'Finding address…' : (pinDisplay || 'Search location…')}
              placeholderTextColor={C.muted}
              returnKeyType="search"
              autoCorrect={false}
              selectionColor="#C41230"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); }}
                hitSlop={8}
                style={{ marginRight: 10 }}
              >
                <Ionicons name="close" size={16} color={C.muted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Search results — flows directly below the search bar, overlays map */}
        {showResults && (
          <ScrollView
            style={mc.searchDropdown}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {searchResults.map((r, i) => {
              const parts     = (r.display_name ?? '').split(',');
              const primary   = parts[0]?.trim() ?? '';
              const secondary = parts.slice(1, 4).join(', ').trim();
              return (
                <View key={r.place_id ?? i}>
                  {/* Force flexDirection:row inline — NativeWind can override StyleSheet on Pressable */}
                  <Pressable
                    onPress={() => handleSelectResult(r)}
                    style={({ pressed }) => ({
                      flexDirection: 'row' as const,
                      alignItems: 'center' as const,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      gap: 12,
                      backgroundColor: pressed ? '#FFF5F7' : '#FFFFFF',
                    })}
                  >
                    <View style={mc.searchResultIcon}>
                      <Ionicons name="location" size={18} color="#C41230" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={mc.searchResultPrimary} numberOfLines={1}>{primary}</Text>
                      {secondary ? (
                        <Text style={mc.searchResultSecondary} numberOfLines={1}>{secondary}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                  {i < searchResults.length - 1 && (
                    <View style={mc.searchResultDivider} />
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Map */}
      <View style={mc.mapWrap}>
        {MapView ? (
          <>
            <MapView
              ref={mapRef}
              style={mc.mapFull}
              provider={PROVIDER_DEFAULT}
              region={mapRegion}
              onRegionChangeComplete={r => {
                setMapRegion(r);
                setMapLat(r.latitude);
                setMapLng(r.longitude);
                scheduleReverseGeocode(r.latitude, r.longitude);
              }}
              showsUserLocation
              showsMyLocationButton={false}
              showsCompass={false}
              rotateEnabled={false}
            >
              <Marker
                coordinate={{ latitude: mapLat, longitude: mapLng }}
                draggable
                onDragEnd={e => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  flyTo(latitude, longitude);
                  scheduleReverseGeocode(latitude, longitude);
                }}
                pinColor="#C41230"
              />
            </MapView>

            {/* Zoom +/- controls */}
            <View style={mc.zoomBtns} pointerEvents="box-none">
              <Pressable style={mc.zoomBtn} onPress={() => handleZoom('in')} hitSlop={4}>
                <Ionicons name="add" size={22} color={C.black} />
              </Pressable>
              <View style={mc.zoomDivider} />
              <Pressable style={mc.zoomBtn} onPress={() => handleZoom('out')} hitSlop={4}>
                <Ionicons name="remove" size={22} color={C.black} />
              </Pressable>
            </View>
          </>
        ) : (
          <View style={mc.mapFallback}>
            <Ionicons name="map-outline" size={36} color={C.muted} />
            <Text style={{ color: C.muted, fontSize: 14, marginTop: 8 }}>Map requires a rebuild</Text>
          </View>
        )}

      </View>

      {/* GPS button — direct child of root, OUTSIDE mapWrap so native MapView cannot paint over it */}
      <View style={[mc.curLocRow, { bottom: bottomCardH + 12 }]} pointerEvents="box-none">
        <Pressable
          style={({ pressed }) => [mc.curLocBtn, pressed && { opacity: 0.85 }]}
          onPress={handleGPSLocation}
          disabled={gpsLoading}
        >
          {gpsLoading
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Ionicons name="locate" size={17} color="#FFFFFF" />
          }
          <Text style={mc.curLocTxt}>Current Location</Text>
        </Pressable>
      </View>

      {/* Bottom card — onLayout measures height so GPS button stays above it */}
      <View
        style={[mc.bottomCard, { paddingBottom: Math.max(insets.bottom, 20) + 8 }]}
        onLayout={e => setBottomCardH(e.nativeEvent.layout.height)}
      >
        <Text style={mc.pinHint}>Drag pin or map to adjust · tap to confirm</Text>

        <TouchableOpacity activeOpacity={0.75} onPress={confirmLocation} style={mc.addrRow}>
          <View style={mc.addrIconWrap}>
            <Ionicons name="location" size={22} color="#C41230" />
          </View>
          <View style={mc.addrTextWrap}>
            <TextInput
              editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden numberOfLines={1}
              value={geocoding ? 'Finding address…' : (pinDisplay || location.displayName || 'Location selected')}
              style={mc.addrTitle}
            />
            <TextInput
              editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
              multiline numberOfLines={2} scrollEnabled={false}
              value={pinAddress || location.fullAddress || 'Tap to confirm this location'}
              style={mc.addrSub}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} style={mc.confirmBtn} onPress={confirmLocation}>
          <Text style={mc.confirmBtnTxt}>Confirm & proceed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const mc = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.white },
  // headerZone — wraps topBar + dropdown so dropdown flows below the search bar
  // and overlays the map (zIndex lifts it above mapWrap)
  headerZone:   { zIndex: 20 },
  topBar:       {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 10, backgroundColor: C.white,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  backBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  topSearch:     { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10, height: 42, borderRadius: 22, backgroundColor: '#F5F5F5', paddingRight: 6, gap: 4 },
  topSearchTxt:  { flex: 1, fontSize: 14, color: C.black, fontWeight: '500' },
  topSearchInput:{ flex: 1, fontSize: 14, color: C.black, fontWeight: '500', paddingVertical: 0, paddingRight: 4 },
  // Search dropdown — shows 3 results (≈66px/row × 3 = 198px), scrollable for more
  searchDropdown: {
    maxHeight: 200,
    backgroundColor: C.white,
    borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.13, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  searchResult:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  searchResultIcon:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF0F3', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  searchResultTexts:    { flex: 1, minWidth: 0 },
  searchResultPrimary:  { fontSize: 14, fontWeight: '700', color: C.black, marginBottom: 2 },
  searchResultSecondary:{ fontSize: 12, color: C.muted, lineHeight: 16 },
  searchResultDivider:  { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: 62 },
  searchResultTxt:      { flex: 1, fontSize: 13, color: C.black, lineHeight: 18 }, // legacy compat
  // Map
  mapWrap:       { flex: 1, backgroundColor: '#e8e0d8' },
  mapFull:       { ...StyleSheet.absoluteFillObject },
  mapFallback:   { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0ECE8' },
  zoomBtns:     {
    position: 'absolute', right: 14, bottom: 80,
    backgroundColor: C.white, borderRadius: 10, overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 5 },
    }),
  },
  zoomBtn:      { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  zoomDivider:  { height: 1, backgroundColor: '#E0E0E0', marginHorizontal: 8 },
  // Full-width absolute row — `bottom` set dynamically in JSX from onLayout measurement
  curLocRow:    { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 30 },
  curLocBtn:    {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#007AFF', borderRadius: 24, paddingHorizontal: 22, paddingVertical: 12,
    ...Platform.select({
      ios:     { shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.40, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  curLocTxt:    { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  bottomCard:   {
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.10, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  pinHint:      { fontSize: 12, color: C.muted, marginBottom: 10 },
  addrRow:      {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EDEBE8',
  },
  addrIconWrap: { width: 32, alignItems: 'center', flexShrink: 0 },
  addrTextWrap: { flex: 1, minWidth: 0 },
  addrTitle: {
    fontSize: 15, fontFamily: F.sans700, color: '#111111',
    padding: 0, margin: 0, height: 20, backgroundColor: 'transparent',
  },
  addrSub: {
    fontSize: 12, fontFamily: F.sans400, color: '#555555', lineHeight: 17,
    padding: 0, margin: 0, marginTop: 2, backgroundColor: 'transparent',
  },
  confirmBtn:    { backgroundColor: '#C41230', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  confirmBtnTxt: { color: '#fff', fontFamily: F.sans800, fontSize: 15 },
});

// ── Main location picker (search → map confirm) ───────────────────────────────
export function LocationPickerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { setDeliveryLocation } = useCart();

  const [query, setQuery]             = React.useState('');
  const [gpsLoading, setGpsLoading]   = React.useState(false);
  const [searchLoading, setSearchLoad]= React.useState(false);
  const [results, setResults]         = React.useState<DeliveryLocation[]>([]);
  const [mapLoc, setMapLoc]           = React.useState<DeliveryLocation | null>(null);
  const debRef  = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef= React.useRef<TextInput>(null);

  React.useEffect(() => {
    if (!visible) { setQuery(''); setResults([]); setMapLoc(null); }
    else { setTimeout(() => inputRef.current?.focus(), 400); }
  }, [visible]);

  React.useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    const q = query.trim();
    if (!q) { setResults([]); return; }
    debRef.current = setTimeout(async () => {
      try {
        setSearchLoad(true);
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'User-Agent': 'ChineseCornerApp/1.0' } }
        );
        const data: any[] = await res.json();
        const resolved: DeliveryLocation[] = data.map(item => {
          const a    = item.address ?? {};
          const street = [a.house_number, a.road].filter(Boolean).join(' ');
          const area   = a.suburb ?? a.neighbourhood ?? a.city_district ?? '';
          const displayName = ([street, area].filter(Boolean).join(', ') ||
            item.display_name?.split(',')[0]) ?? item.display_name ?? '';
          return {
            latitude:    parseFloat(item.lat),
            longitude:   parseFloat(item.lon),
            displayName,
            city:    a.city ?? a.town ?? a.village ?? a.county ?? '',
            state:   a.state ?? '',
            pincode: a.postcode ?? '',
            fullAddress: item.display_name ?? '',
          };
        });
        setResults(resolved);
      } catch { setResults([]); } finally { setSearchLoad(false); }
    }, 500);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [query]);

  async function handleUseGps() {
    try {
      setGpsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Location Access', 'Please allow location access in Settings.', [{ text: 'OK' }]); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [addr] = await Location.reverseGeocodeAsync(pos.coords);
      if (!addr) return;
      setMapLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, displayName: formatDisplayName(addr), city: addr.city || addr.subregion || '', state: addr.region || '', pincode: addr.postalCode || '', fullAddress: formatFullAddress(addr) });
    } catch { Alert.alert('Location Error', 'Could not get your location. Please search manually.'); }
    finally { setGpsLoading(false); }
  }

  function handleMapConfirm(loc: DeliveryLocation) {
    setDeliveryLocation(loc);
    Keyboard.dismiss();
    setMapLoc(null);
    setTimeout(() => onClose(), 280);
  }

  if (mapLoc) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={() => setMapLoc(null)} statusBarTranslucent hardwareAccelerated>
        <MapConfirmScreen location={mapLoc} onConfirm={handleMapConfirm} onBack={() => setMapLoc(null)} />
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { Keyboard.dismiss(); onClose(); }} statusBarTranslucent hardwareAccelerated>
      <View style={lmod.root}>
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onClose(); }}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.65)' }]} />
        </TouchableWithoutFeedback>

        <View style={lmod.sheet}>
          <View style={lmod.handle} />

          <View style={lmod.headerRow}>
            <Pressable onPress={() => { Keyboard.dismiss(); onClose(); }} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color={C.black} />
            </Pressable>
            <Text style={lmod.sheetTitle}>Select your location</Text>
          </View>

          <View style={lmod.inputRow}>
            <TextInput
              ref={inputRef}
              style={lmod.input}
              placeholder="Search an area or address"
              placeholderTextColor={C.muted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
              selectionColor="#C41230"
            />
            {query.length > 0
              ? <Pressable onPress={() => { setQuery(''); setResults([]); }} hitSlop={8}><Ionicons name="close" size={18} color={C.muted} /></Pressable>
              : <Ionicons name="search" size={18} color={C.muted} />
            }
          </View>

          <View style={lmod.gpsBtnWrap}>
            <Pressable onPress={handleUseGps} style={({ pressed }) => [lmod.gpsBtn, pressed && { opacity: 0.75 }]} disabled={gpsLoading}>
              {gpsLoading ? <ActivityIndicator size="small" color="#C41230" /> : <Ionicons name="locate" size={16} color="#C41230" />}
              <Text style={lmod.gpsTxt}>Use Current Location</Text>
            </Pressable>
          </View>

          {results.length > 0 && <Text style={lmod.sectionLabel}>SEARCH RESULTS</Text>}

          <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {searchLoading ? (
              <View style={{ padding: 28, alignItems: 'center' }}>
                <ActivityIndicator color="#C41230" />
                <Text style={{ color: C.muted, marginTop: 8, fontSize: 13 }}>Searching…</Text>
              </View>
            ) : results.length > 0 ? (
              <View style={lmod.resultsCard}>
                {results.map((r, i) => (
                  <View key={i}>
                    <Pressable
                      onPress={() => { Keyboard.dismiss(); setMapLoc(r); }}
                      style={({ pressed }) => [lmod.resultRow, pressed && { backgroundColor: '#FFF5F7' }]}
                    >
                      <View style={lmod.pinWrap}>
                        <Ionicons name="time-outline" size={16} color={C.muted} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={lmod.resultName} numberOfLines={1}>{r.displayName}</Text>
                        <Text style={lmod.resultAddr} numberOfLines={2}>{r.fullAddress}</Text>
                      </View>
                    </Pressable>
                    {i < results.length - 1 && (
                      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: 60 }} />
                    )}
                  </View>
                ))}
              </View>
            ) : query.length > 0 ? (
              <View style={{ padding: 28, alignItems: 'center' }}>
                <Text style={{ color: C.muted, fontSize: 13 }}>No results for "{query}"</Text>
              </View>
            ) : (
              <View style={{ padding: 28, alignItems: 'center' }}>
                <Text style={{ color: C.muted, fontSize: 13, textAlign: 'center' }}>Search for your locality, street name or landmark</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const lmod = StyleSheet.create({
  root:        { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    height: LOC_SHEET_H + 60, backgroundColor: C.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.22, shadowRadius: 16 },
      android: { elevation: 20 },
    }),
  },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, marginTop: 4, marginBottom: 16 },
  sheetTitle:  { fontSize: 18, fontWeight: '800', color: C.black },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'android' ? 4 : 13,
    backgroundColor: '#FAFAFA',
  },
  input:       { flex: 1, fontSize: 15, color: C.black, paddingVertical: Platform.OS === 'android' ? 8 : 0, paddingRight: 8 },
  gpsBtnWrap:  { marginHorizontal: 16, marginBottom: 8 },
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5, borderColor: '#C41230', borderRadius: 14, backgroundColor: '#FFF0F3',
  },
  gpsTxt:      { fontSize: 14, fontWeight: '700', color: '#C41230' },
  sectionLabel:{ fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  resultsCard: {
    marginHorizontal: 16, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border, backgroundColor: C.white,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  resultRow:   { flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 18, paddingVertical: 16, gap: 14 },
  pinWrap:     { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  resultName:  { fontSize: 15, fontWeight: '700', color: C.black, marginBottom: 2 },
  resultAddr:  { fontSize: 12, color: C.muted, lineHeight: 18 },
  // kept for any remaining legacy references
  confirmBg:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmCard: { backgroundColor: C.white, borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' },
  confirmIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF0F3', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  confirmTitle:{ fontSize: 18, fontWeight: '800', color: C.black, marginBottom: 10 },
  confirmAddr: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
  confirmBtn:  { backgroundColor: '#C41230', borderRadius: 50, paddingVertical: 15, paddingHorizontal: 40, alignItems: 'center', width: '100%' },
  confirmBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 1 — SEARCH BAR
// ═══════════════════════════════════════════════════════════════════════════
const SHEET_H      = Math.min(680, SH * 0.75);
const STATUS_H     = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
// Search grid: 3 columns, 12px padding on each side, 8px gap between cols
const SRCH_GRID_PAD = 12;
const SRCH_GRID_GAP = 8;
const SRCH_CELL_W   = Math.floor((SW - SRCH_GRID_PAD * 2 - SRCH_GRID_GAP * 2) / 3);

function AnimatedHint({ hints }: { hints: readonly string[] }) {
  const [idx, setIdx] = React.useState(0);
  const opacity = React.useRef(new Animated.Value(1)).current;
  const slideY  = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const cycle = () => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideY,  { toValue: -5, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setIdx(i => (i + 1) % hints.length);
        slideY.setValue(5);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(slideY,  { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      });
    };
    const t = setInterval(cycle, 2800);
    return () => clearInterval(t);
  }, [hints]);

  return (
    <Animated.Text style={[srch.hint, { opacity, transform: [{ translateY: slideY }] }]}>
      {hints[idx]}
    </Animated.Text>
  );
}

function SearchBar({ hints, showVoice, onOpen, onVoicePress }: {
  hints: readonly string[];
  showVoice: boolean;
  onOpen: () => void;
  onVoicePress: () => void;
}) {
  return (
    <View style={srch.row}>
      {/* White search pill */}
      <Pressable style={srch.bar} onPress={onOpen}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <AnimatedHint hints={hints} />
      </Pressable>

      {/* Lime green filter button */}
      <Pressable style={srch.filterBtn} onPress={onVoicePress} hitSlop={8}>
        <Ionicons name="map-outline" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const srch = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: PAD, gap: 10, marginBottom: 14,
  },
  bar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 50, height: 48,
    paddingHorizontal: 16, gap: 10,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  hint:      { flex: 1, fontSize: 14, color: '#9CA3AF', fontFamily: F.sans400 },
  filterBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.limeBtn,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#C41230', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: { elevation: 5 },
    }),
  },
});

// ═══════════════════════════════════════════════════════════════════════════
//  SEARCH GRID CARD — used inside the manual 3-column grid below
// ═══════════════════════════════════════════════════════════════════════════
function SearchGridCard({
  item,
  onPress,
}: {
  item: SearchResult;
  onPress: () => void;
}) {
  const sym  = item.currency?.symbol ?? '₹';
  const disc = item.market_price > item.price
    ? Math.round(((item.market_price - item.price) / item.market_price) * 100)
    : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [grd.card, { opacity: pressed ? 0.75 : 1 }]}
    >
      {/* Image */}
      <View style={grd.imgWrap}>
        <ExpoImage
          source={{ uri: item.photo }}
          style={grd.img}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
        {disc > 0 && (
          <View style={grd.badge}>
            <Text style={grd.badgeTxt}>{disc}%{'\n'}off</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={grd.body}>
        <Text numberOfLines={2} style={grd.name}>{item.product_name}</Text>
        <Text style={grd.price} numberOfLines={1}>
          {sym}{Math.round(item.price).toLocaleString()}
        </Text>
        {item.market_price > item.price && (
          <Text style={grd.mrp} numberOfLines={1}>
            {sym}{Math.round(item.market_price).toLocaleString()}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ── 3-column search grid styles ───────────────────────────────────────────
const grd = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0EDE8',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  imgWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F5F3F0',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#C41230',
    borderBottomLeftRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  badgeTxt: {
    color: '#fff', fontSize: 7, fontWeight: '900',
    textAlign: 'center', lineHeight: 10,
  },
  body: {
    paddingHorizontal: 6,
    paddingTop: 5,
    paddingBottom: 7,
  },
  name: {
    fontSize: 10, fontWeight: '600', color: C.black,
    lineHeight: 13, marginBottom: 3,
  },
  price: {
    fontSize: 12, fontWeight: '900', color: '#C41230',
    marginBottom: 1,
  },
  mrp: {
    fontSize: 9, color: C.mutedLight,
    textDecorationLine: 'line-through',
  },
});

// ═══════════════════════════════════════════════════════════════════════════
//  SEARCH MODAL — bottom-sheet, keyboard-aware (no KAV)
// ═══════════════════════════════════════════════════════════════════════════
function SearchModal({ visible, onClose, onProductPress, initialQuery }: {
  visible: boolean;
  onClose: () => void;
  onProductPress: (item: SearchResult) => void;
  initialQuery?: string;
}) {
  const insets = useSafeAreaInsets();

  const [query, setQuery]       = React.useState('');

  React.useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);
  const [results, setResults]   = React.useState<SearchResult[]>([]);
  const [loading, setLoading]   = React.useState(false);
  const [searched, setSearched] = React.useState(false);
  const [kbHeight, setKbHeight] = React.useState(0);

  const debRef   = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = React.useRef<TextInput>(null);
  const slideY   = React.useRef(new Animated.Value(SHEET_H)).current;

  React.useEffect(() => {
    const showEvt = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvt = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';
    const onShow  = Keyboard.addListener(showEvt, e => setKbHeight(e.endCoordinates.height));
    const onHide  = Keyboard.addListener(hideEvt, ()  => setKbHeight(0));
    return () => { onShow.remove(); onHide.remove(); };
  }, []);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 26,
        stiffness: 300,
      }).start(() => {
        setTimeout(() => inputRef.current?.focus(), 50);
      });
    } else {
      Keyboard.dismiss();
      Animated.timing(slideY, {
        toValue: SHEET_H,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setQuery('');
        setResults([]);
        setSearched(false);
      });
    }
  }, [visible]);

  React.useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    const term = query.trim();
    if (!term) { setResults([]); setSearched(false); setLoading(false); return; }
    debRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await authenticatedClient.get(
          `api/shop/sellableproductsearch/${encodeURIComponent(term)}/`,
        );
        setResults(res?.data?.results ?? []);
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [query]);


  const sheetContent = (
    <Animated.View style={[mod.sheet, { transform: [{ translateY: slideY }] }]}>
      <View style={mod.handle} />

      {/* Input row */}
      <View style={mod.inputRow}>
        <View style={mod.iconBubble}>
          <Ionicons name="search" size={16} color="#C41230" />
        </View>
        <TextInput
          ref={inputRef}
          style={mod.input}
          placeholder="Search fresh market…"
          placeholderTextColor={C.muted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          selectionColor="#C41230"
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={12} style={mod.iconBtn}>
            <Ionicons name="close-circle" size={20} color={C.muted} />
          </Pressable>
        ) : (
          <Pressable onPress={onClose} style={mod.cancelBtn}>
            <Text style={mod.cancelTxt}>Cancel</Text>
          </Pressable>
        )}
      </View>

      <View style={{ height: 1, backgroundColor: C.border }} />

      {/* Results area */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={mod.center}>
            <ActivityIndicator size="large" color="#C41230" />
            <Text style={{ marginTop: 12, color: C.muted, fontSize: 14 }}>Searching…</Text>
          </View>
        ) : searched && results.length === 0 ? (
          <View style={mod.center}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>🔍</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.black, marginBottom: 6 }}>
              No results for "{query}"
            </Text>
            <Text style={{ fontSize: 13, color: C.muted }}>Try a different keyword.</Text>
          </View>
        ) : results.length > 0 ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SRCH_GRID_PAD,
              paddingTop: 10,
              paddingBottom: kbHeight + insets.bottom + 24,
            }}
          >
            {/* Manual 3-column masonry — no FlatList numColumns quirks */}
            <View style={{ flexDirection: 'row', gap: SRCH_GRID_GAP, alignItems: 'flex-start' }}>
              {[0, 1, 2].map(ci => (
                <View key={ci} style={{ flex: 1, gap: SRCH_GRID_GAP }}>
                  {results
                    .filter((_, i) => i % 3 === ci)
                    .map(item => (
                      <SearchGridCard
                        key={item.id}
                        item={item}
                        onPress={() => { onClose(); onProductPress(item); }}
                      />
                    ))
                  }
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={mod.center}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>🛒</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 6 }}>
              What are you looking for?
            </Text>
            <Text style={{ fontSize: 13, color: C.muted, textAlign: 'center', maxWidth: 260 }}>
              Electronics, Fashion, Grocery, Beauty…
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={mod.modalRoot}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.65)' }]} />
        </TouchableWithoutFeedback>
        {sheetContent}
      </View>
    </Modal>
  );
}

const mod = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    height: SHEET_H,
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.28, shadowRadius: 18 },
      android: { elevation: 22 },
    }),
  },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  iconBubble: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF0F3', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  input:      { flex: 1, fontSize: 15, fontFamily: F.sans500, color: C.black, paddingVertical: Platform.OS === 'android' ? 8 : 0, minWidth: 0 },
  iconBtn:    { padding: 4 },
  cancelBtn:  { paddingHorizontal: 6, paddingVertical: 8 },
  cancelTxt:  { fontSize: 14, fontWeight: '700', color: '#C41230' },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0EDE8',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    marginVertical: 4,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  rowPressed: { backgroundColor: '#FFF5F7' },
  imgBox:    { width: 72, height: 72, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F5F3F0', flexShrink: 0 },
  img:       { width: 72, height: 72 },
  discBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: C.orange, borderBottomLeftRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
  discText:  { color: '#fff', fontSize: 9, fontWeight: '900' },
  rowMid:    { flex: 1, minWidth: 0, gap: 3 },
  rowName:   { fontSize: 13, fontWeight: '700', color: C.black, lineHeight: 18 },
  rowCat:    { fontSize: 11, color: C.muted, lineHeight: 15 },
  rowRight:  { width: 70, flexShrink: 0, alignItems: 'flex-end', justifyContent: 'center', gap: 2 },
  rowPrice:  { fontSize: 15, fontWeight: '900', color: C.orange },
  rowMrp:    { fontSize: 11, color: C.mutedLight, textDecorationLine: 'line-through' },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', marginTop: 2 },
  stockDot:  { width: 5, height: 5, borderRadius: 3 },
  stockTxt:  { fontSize: 9, fontWeight: '700' },
  separator: { height: 0 },
});

// ═══════════════════════════════════════════════════════════════════════════
//  EARLY TABLE SECTION
// ═══════════════════════════════════════════════════════════════════════════
const ET_ITEMS = [
  { id: 'et1', label: 'DIM SUM',     image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80', categoryId: 24638, categoryName: 'Momos Veg' },
  { id: 'et2', label: 'WOK NOODLES', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80', categoryId: 24633, categoryName: 'Noodles' },
  { id: 'et3', label: 'WONTON',      image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&q=80', categoryId: 24636, categoryName: 'Wonton Fried' },
  { id: 'et4', label: 'KUNG PAO',    image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&q=80', categoryId: 24628, categoryName: 'Starters Non-Veg' },
  { id: 'et5', label: 'FRIED RICE',  image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80', categoryId: 24634, categoryName: 'Fried Rice' },
];
const ET_PAD    = 10;
const ET_GAP    = 5;
const ET_CARD_W = Math.floor((SW - ET_PAD * 2 - ET_GAP * 2) / 3);
const ET_CARD_H = Math.round(ET_CARD_W * 1.42);
const ET_BLUE = '#FFD166';

function EarlyTableSection({ onPress }: { onPress: (categoryId: number, categoryName: string) => void }) {
  const titleFloat   = React.useRef(new Animated.Value(0)).current;
  const titleScale   = React.useRef(new Animated.Value(1)).current;
  const spin         = React.useRef(new Animated.Value(0)).current;
  const spinRev      = React.useRef(new Animated.Value(0)).current;
  const star1        = React.useRef(new Animated.Value(0.2)).current;
  const star2        = React.useRef(new Animated.Value(0.7)).current;
  const star3        = React.useRef(new Animated.Value(0.4)).current;
  const labelShimmer = React.useRef(new Animated.Value(0.55)).current;
  const arrowSlide   = React.useRef(new Animated.Value(0)).current;
  const tagSlide     = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(titleFloat, { toValue: -7,  duration: 1700, useNativeDriver: true }),
      Animated.timing(titleFloat, { toValue: 0,   duration: 1700, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(titleScale, { toValue: 1.04, duration: 2000, useNativeDriver: true }),
      Animated.timing(titleScale, { toValue: 1.00, duration: 2000, useNativeDriver: true }),
    ])).start();
    Animated.loop(
      Animated.timing(spin,    { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true }),
    ).start();
    Animated.loop(
      Animated.timing(spinRev, { toValue: 1, duration: 4500, easing: Easing.linear, useNativeDriver: true }),
    ).start();
    Animated.loop(Animated.sequence([
      Animated.timing(star1, { toValue: 1,   duration: 480, useNativeDriver: true }),
      Animated.timing(star1, { toValue: 0.1, duration: 480, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.delay(180),
      Animated.timing(star2, { toValue: 1,   duration: 480, useNativeDriver: true }),
      Animated.timing(star2, { toValue: 0.1, duration: 480, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.delay(360),
      Animated.timing(star3, { toValue: 1,   duration: 480, useNativeDriver: true }),
      Animated.timing(star3, { toValue: 0.1, duration: 480, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(labelShimmer, { toValue: 1,    duration: 900, useNativeDriver: true }),
      Animated.timing(labelShimmer, { toValue: 0.45, duration: 900, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(arrowSlide, { toValue: 5, duration: 450, useNativeDriver: true }),
      Animated.timing(arrowSlide, { toValue: 0, duration: 450, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(tagSlide, { toValue: 4, duration: 1100, useNativeDriver: true }),
      Animated.timing(tagSlide, { toValue: 0, duration: 1100, useNativeDriver: true }),
    ])).start();
  }, []);

  const spinDeg    = spin.interpolate({    inputRange: [0, 1], outputRange: ['0deg',   '360deg'] });
  const spinRevDeg = spinRev.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg']   });

  return (
    <View style={et.root}>
      <View style={et.headerRow}>
        <View style={et.titleLeft}>
          <View style={et.starRow}>
            <Animated.View style={{ opacity: star1 }}>
              <TextInput editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                value="✦" style={et.starGlyph} />
            </Animated.View>
            <Animated.View style={{ opacity: star2 }}>
              <TextInput editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                value="✦" style={[et.starGlyph, { color: ET_BLUE }]} />
            </Animated.View>
            <Animated.View style={{ opacity: star3 }}>
              <TextInput editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                value="✦" style={et.starGlyph} />
            </Animated.View>
          </View>
          <Animated.View style={{ transform: [{ translateY: titleFloat }, { scale: titleScale }] }}>
            <TextInput editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
              value="The Early" style={et.titleWhite} />
            <TextInput editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
              value="Table" style={et.titleBlue} />
          </Animated.View>
          <Animated.View style={{ transform: [{ translateX: tagSlide }], marginTop: 8 }}>
            <TextInput editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
              value="Order before 10 PM →" style={et.tagline} />
          </Animated.View>
        </View>
        <View style={et.brandWrap}>
          <Animated.View style={[et.brandRingWhite, { transform: [{ rotate: spinDeg }] }]} />
          <Animated.View style={[et.brandRingInner, { transform: [{ rotate: spinRevDeg }] }]} />
          <View style={et.brandInner}>
            <TextInput editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
              value="🥢" style={et.brandEmoji} />
            <TextInput editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
              value="CHINESE" style={et.brandLine1} />
            <View style={et.brandDivider} />
            <TextInput editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
              value="CORNER" style={et.brandLine2} />
          </View>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={et.scrollContent}
      >
        {ET_ITEMS.map(item => (
          <Pressable key={item.id} style={et.card} onPress={() => onPress(item.categoryId, item.categoryName)}>
            <ExpoImage
              source={{ uri: item.image }}
              style={et.cardImg}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={StyleSheet.absoluteFill}
            />
              <View style={et.cardBottom}>
              <Animated.View style={{ opacity: labelShimmer, flex: 1 }}>
                <TextInput editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                  value={item.label} style={et.cardLabel} />
              </Animated.View>
              <Animated.View style={{ transform: [{ translateX: arrowSlide }] }}>
                <TextInput editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                  value="»" style={et.cardArrowWhite} />
              </Animated.View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ height: 18 }} />
    </View>
  );
}

const et = StyleSheet.create({
  root: { backgroundColor: '#C41230', overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 20, paddingBottom: 14 },
  titleLeft: { flex: 1, flexDirection: 'column', alignItems: 'flex-start' },
  starRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  starGlyph: { fontSize: 15, color: '#FFFFFF', fontFamily: F.sans400, padding: 0, margin: 0, backgroundColor: 'transparent', height: 18, width: 18, textAlign: 'center' },
  titleWhite: { fontSize: 40, fontFamily: F.display900, color: '#FFFFFF', letterSpacing: -0.5, lineHeight: 46, padding: 0, margin: 0, backgroundColor: 'transparent' },
  titleBlue: { fontSize: 40, fontFamily: F.display900, color: ET_BLUE, letterSpacing: -0.5, lineHeight: 46, padding: 0, margin: 0, backgroundColor: 'transparent' },
  tagline: { fontSize: 11, fontFamily: F.sans700, color: 'rgba(255,255,255,0.65)', letterSpacing: 1, padding: 0, margin: 0, backgroundColor: 'transparent', height: 16 },
  brandWrap: { width: 102, height: 102, alignItems: 'center', justifyContent: 'center', marginLeft: 12, flexShrink: 0 },
  brandRingWhite: { position: 'absolute', width: 98, height: 98, borderRadius: 49, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.50)', borderStyle: 'dashed' },
  brandRingInner: { position: 'absolute', width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderStyle: 'dashed' },
  brandInner: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center', gap: 1 },
  brandDivider: { width: 28, height: 1, backgroundColor: 'rgba(255,255,255,0.40)', marginVertical: 1 },
  brandEmoji: { fontSize: 22, textAlign: 'center', padding: 0, margin: 0, backgroundColor: 'transparent', height: 26 },
  brandLine1: { fontSize: 7, fontFamily: F.sans900, color: '#FFFFFF', letterSpacing: 2, textAlign: 'center', padding: 0, margin: 0, backgroundColor: 'transparent', height: 10 },
  brandLine2: { fontSize: 7, fontFamily: F.sans900, color: 'rgba(255,255,255,0.65)', letterSpacing: 2, textAlign: 'center', padding: 0, margin: 0, backgroundColor: 'transparent', height: 10 },
  scrollContent: { paddingHorizontal: ET_PAD, gap: ET_GAP },
  card: { width: ET_CARD_W, height: ET_CARD_H, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1A0005' },
  cardImg: { width: '100%', height: '100%' },
  cardBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 8 },
  cardLabel: { fontSize: 11, fontFamily: F.sans800, color: '#FFFFFF', letterSpacing: 0.6, padding: 0, margin: 0, backgroundColor: 'transparent' },
  cardArrowWhite: { fontSize: 16, fontFamily: F.sans900, color: '#FFFFFF', padding: 0, margin: 0, backgroundColor: 'transparent', width: 20, textAlign: 'right' },
});

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 2 — HERO CAROUSEL
// ═══════════════════════════════════════════════════════════════════════════
const HERO_H      = 260;
const HERO_MARGIN = 0;
const HERO_W      = SW;
const HERO_STEP   = SW;
const STRIP_H     = 52;

function HeroCarousel({ slides, autoMs, onPress }: {
  slides: readonly HeroSlide[];
  autoMs: number;
  onPress: (route: string, params: Record<string, any>) => void;
}) {
  const scrollRef = React.useRef<ScrollView>(null);
  const idxRef    = React.useRef(0);
  const [idx, setIdx] = React.useState(0);
  const timerRef  = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = React.useCallback((n: number) => {
    const t = Math.max(0, Math.min(slides.length - 1, n));
    scrollRef.current?.scrollTo({ x: t * HERO_STEP, animated: true });
    idxRef.current = t;
    setIdx(t);
  }, [slides.length]);

  const resetTimer = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      goTo((idxRef.current + 1) % slides.length);
      resetTimer();
    }, autoMs);
  }, [goTo, autoMs, slides.length]);

  React.useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={HERO_STEP}
        snapToAlignment="start"
        contentContainerStyle={{ gap: 0 }}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => { if (timerRef.current) clearTimeout(timerRef.current); }}
        onMomentumScrollEnd={e => {
          const n = Math.round(e.nativeEvent.contentOffset.x / HERO_STEP);
          idxRef.current = n; setIdx(n); resetTimer();
        }}
      >
        {slides.map(slide => (
          <Pressable
            key={slide.id}
            style={hc.card}
            onPress={() => onPress(slide.route, slide.params as Record<string, string>)}
          >
            <LinearGradient
              colors={[slide.bgFrom, slide.bgTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={{ position: 'absolute', right: 0, top: 0, bottom: STRIP_H, width: '60%' }}
              pointerEvents="none"
            >
              <Image
                source={{ uri: slide.heroImageUri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
              <LinearGradient
                colors={[slide.bgFrom, slide.bgFrom + 'D0', slide.bgFrom + '00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.65, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
            <View
              style={{ position: 'absolute', left: 0, top: 0, bottom: STRIP_H, width: '55%', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6, justifyContent: 'flex-start' }}
              pointerEvents="none"
            >
              <Text style={[hc.brandLogo, { color: slide.brandLogoColor }]}>{slide.brandLogoText}</Text>
              <Text style={hc.title}>{slide.title}</Text>
              <Text style={hc.subtitle} numberOfLines={2}>{slide.subtitle}</Text>
              <View style={hc.priceBox}>
                <Text style={hc.priceTxt}>{slide.priceLabel}</Text>
              </View>
              <Text style={hc.dateTxt}>{slide.dateLabel}</Text>
            </View>
            {slide.partners.length > 0 && (
              <View style={hc.strip} pointerEvents="none">
                {slide.partners.map((p, pi) => (
                  <React.Fragment key={p.id}>
                    {pi > 0 && <View style={hc.stripDivider} />}
                    <View style={[hc.pill, p.highlight && hc.pillHL]}>
                      <Text style={hc.pillIcon}>{p.icon}</Text>
                      <Text style={[hc.pillTxt, p.highlight && hc.pillTxtHL]} numberOfLines={2}>{p.text}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const hc = StyleSheet.create({
  card: { width: HERO_W, height: HERO_H, borderRadius: 0, overflow: 'hidden', marginHorizontal: 0 },
  brandLogo: { fontSize: 17, fontFamily: F.sans900, letterSpacing: 2, marginBottom: 3, color: C.white },
  title:    { color: C.white, fontFamily: F.display900, fontSize: 22, lineHeight: 27, letterSpacing: -0.3 },
  subtitle: { color: 'rgba(255,255,255,0.60)', fontFamily: F.sans400, fontSize: 11, marginTop: 4, lineHeight: 16 },
  priceBox: { marginTop: 10, alignSelf: 'flex-start', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.65)', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6 },
  priceTxt: { color: C.white, fontFamily: F.sans800, fontSize: 12, letterSpacing: 0.5 },
  dateTxt:  { color: 'rgba(255,255,255,0.50)', fontFamily: F.sans400, fontSize: 10, marginTop: 7 },
  strip: { position: 'absolute', bottom: 0, left: 0, right: 0, height: STRIP_H, backgroundColor: 'rgba(0,0,0,0.45)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  stripDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.18)', marginHorizontal: 8 },
  pill:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, paddingVertical: 5 },
  pillHL:   { backgroundColor: 'rgba(196,18,48,0.25)', borderRadius: 6 },
  pillIcon: { fontSize: 14 },
  pillTxt:  { color: 'rgba(255,255,255,0.80)', fontFamily: F.sans600, fontSize: 9, lineHeight: 13, flex: 1 },
  pillTxtHL:{ color: '#FFC107' },
});

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 3 — CATEGORIES GRID
// ═══════════════════════════════════════════════════════════════════════════
const CAT_CIRCLE  = (SW - PAD * 2 - 24) / 4;
const CAT_IMG     = CAT_CIRCLE - 8;

export function PrimaryBannerSection({ items, onPress }) {
  return (
    <View style={cat.section}>
      <Text style={cat.heading}>Our Menu</Text>
      <Text style={cat.subheading}>Explore authentic Chinese cuisine</Text>
      <View style={cat.grid}>
        {items.map((item: any) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [cat.item, { opacity: pressed ? 0.75 : 1 }]}
            onPress={() => onPress(item.route, item.params)}
          >
            <View style={cat.circle}>
              <ExpoImage
                source={{ uri: item.image }}
                style={cat.img}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </View>
            <TextInput
              editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
              value={item.title}
              numberOfLines={1}
              style={cat.label}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function PrimaryBannerGrid({ items, onPress }: any) {
  return <PrimaryBannerSection items={items} onPress={onPress} />;
}

const cat = StyleSheet.create({
  section: { paddingTop: 18, paddingBottom: 16, paddingHorizontal: PAD, backgroundColor: C.white },
  heading: { fontSize: 20, fontFamily: F.display900, color: '#111111', marginBottom: 2, letterSpacing: 0.2 },
  subheading: { fontSize: 12, fontFamily: F.sans400, color: '#7A0018', marginBottom: 16, letterSpacing: 0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 20, justifyContent: 'space-between' },
  item: { width: CAT_CIRCLE, alignItems: 'center', gap: 7 },
  circle: { width: CAT_CIRCLE, height: CAT_CIRCLE, borderRadius: CAT_CIRCLE / 2, overflow: 'hidden', backgroundColor: '#FFE4E8', borderWidth: 2.5, borderColor: '#C41230' },
  img: { width: '100%', height: '100%' },
  label: { fontSize: 11, fontFamily: F.sans700, color: '#111111', textAlign: 'center', padding: 0, margin: 0, backgroundColor: 'transparent', width: CAT_CIRCLE, height: 15, letterSpacing: 0.3 },
});

const styles = StyleSheet.create({ sectionWrap: {}, header: {}, heading: {}, subheading: {}, grid: {}, card: {}, image: {}, badge: {}, badgeText: {}, dots: {}, dot: {}, dotActive: {}, info: {}, category: {}, title: {}, ctaRow: {}, ctaPill: {}, ctaTxt: {} });

// ═══════════════════════════════════════════════════════════════════════════
//  CHINESE HERO BANNER
// ═══════════════════════════════════════════════════════════════════════════
const REEL_IMAGES = [
  { id: 'r1', uri: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&q=85' },
  { id: 'r2', uri: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=85' },
  { id: 'r3', uri: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500&q=85' },
  { id: 'r4', uri: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&q=85' },
  { id: 'r5', uri: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=85' },
  { id: 'r6', uri: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=85' },
];
const REEL_DATA   = [...REEL_IMAGES, ...REEL_IMAGES, ...REEL_IMAGES];
const REEL_IMG_W  = 195;
const REEL_IMG_H  = 265;
const REEL_GAP    = 2;
const REEL_ITEM_W = REEL_IMG_W + REEL_GAP;
const REEL_LOOP_W = REEL_IMAGES.length * REEL_ITEM_W;
const REEL_ARC    = SW * 0.55;

function ChineseHeroBanner() {
  const router = useRouter();
  const scrollX = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -REEL_LOOP_W,
        duration: REEL_LOOP_W * 22,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={chb.root}>
      <View style={chb.badge}>
        <Ionicons name="shield-checkmark-outline" size={14} color="#C41230" />
        <TextInput
          editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
          value="Loved by 10,000+ Food Lovers"
          style={chb.badgeTxt}
        />
      </View>
      <TextInput
        editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
        multiline
        value={'Authentic Chinese\nFlavours at Your Door'}
        style={chb.headline}
      />
      <TextInput
        editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
        multiline
        value="From hand-folded dim sum to wok-tossed noodles, experience the true taste of China delivered fresh to your home."
        style={chb.subtitle}
      />
      <TouchableOpacity
        activeOpacity={0.82}
        style={chb.exploreBtn}
        onPress={() => router.push('/storefront/categories' as any)}
      >
        <TextInput
          editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
          value="Explore Menu"
          style={chb.exploreBtnTxt}
        />
        <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={chb.reelWrap}>
        <Animated.View
          style={[chb.reelTrack, { transform: [{ translateX: scrollX }] }]}
        >
          {REEL_DATA.map((img, i) => {
            const baseX = i * REEL_ITEM_W;
            const centerAt = -(baseX + REEL_GAP + REEL_IMG_W / 2 - SW / 2);
            const inputRange  = [centerAt - REEL_ARC, centerAt, centerAt + REEL_ARC];
            const rotateY = scrollX.interpolate({ inputRange, outputRange: ['-12deg', '0deg', '12deg'], extrapolate: 'clamp' });
            const translateY = scrollX.interpolate({ inputRange, outputRange: [14, 0, 14], extrapolate: 'clamp' });
            const scale = scrollX.interpolate({ inputRange, outputRange: [0.90, 1, 0.90], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange: [centerAt - REEL_ARC * 1.2, centerAt, centerAt + REEL_ARC * 1.2], outputRange: [0.65, 1, 0.65], extrapolate: 'clamp' });
            return (
              <Animated.View
                key={`${img.id}-${i}`}
                style={[chb.reelItem, { opacity, transform: [{ perspective: 900 }, { translateY }, { rotateY }, { scale }] }]}
              >
                <ExpoImage source={{ uri: img.uri }} style={chb.reelImg} contentFit="cover" cachePolicy="memory-disk" />
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>
    </View>
  );
}

const chb = StyleSheet.create({
  root: { backgroundColor: C.white, paddingTop: 28, paddingBottom: 0, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF0F3', borderRadius: 50, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 20, borderWidth: 1, borderColor: '#FFCDD5' },
  badgeTxt: { fontSize: 12, color: '#C41230', fontFamily: F.sans600, padding: 0, margin: 0, backgroundColor: 'transparent', height: 16 },
  headline: { fontSize: 28, fontFamily: F.display900, color: '#111111', textAlign: 'center', lineHeight: 34, paddingHorizontal: 20, padding: 0, margin: 0, backgroundColor: 'transparent', marginBottom: 12, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: '#666666', fontFamily: F.sans400, textAlign: 'center', lineHeight: 20, paddingHorizontal: 28, padding: 0, margin: 0, backgroundColor: 'transparent', marginBottom: 28 },
  exploreBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#C41230', borderRadius: 50, paddingHorizontal: 32, paddingVertical: 15, marginBottom: 32, ...Platform.select({ ios: { shadowColor: '#C41230', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 }, android: { elevation: 6 } }) },
  exploreBtnTxt: { fontSize: 15, fontFamily: F.sans800, color: '#FFFFFF', letterSpacing: 0.5, padding: 0, margin: 0, backgroundColor: 'transparent' },
  reelWrap: { width: SW, overflow: 'hidden', height: REEL_IMG_H + 60, paddingTop: 10 },
  reelTrack: { flexDirection: 'row', alignItems: 'flex-start', gap: REEL_GAP, paddingHorizontal: 0 },
  reelItem: { width: REEL_IMG_W, height: REEL_IMG_H, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.88)' },
  reelImg: { width: '100%', height: '100%' },
});

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 4 — SECONDARY BANNERS
// ═══════════════════════════════════════════════════════════════════════════
const SB_H = 112;

function SecondaryBannerList({ items, onPress }: {
  items: readonly SecondaryBanner[];
  onPress: (route: string, params: Record<string, any>) => void;
}) {
  return (
    <View style={{ paddingHorizontal: PAD, gap: 10 }}>
      {items.map(item => (
        <Pressable
          key={item.id}
          style={({ pressed }) => [sbn.card, { backgroundColor: '#FFF5F7', height: SB_H, opacity: pressed ? 0.93 : 1 }]}
          onPress={() => onPress(item.route, item.params as Record<string, string>)}
        >
          <View style={sbn.leftCol}>
            <Text style={[sbn.brandLogo, { color: item.brandLogoColor }]}>{item.brandLogoText}</Text>
            <View style={sbn.personWrap}>
              <Image source={{ uri: item.personImageUri }} style={sbn.personImg} contentFit="cover" />
            </View>
          </View>
          <View style={sbn.vLine} />
          <View style={sbn.rightCol}>
            <Text style={[sbn.productName, { color: item.textColor }]}>{item.productName}</Text>
            <Text style={[sbn.tagline, { color: item.textColor + 'AA' }]} numberOfLines={2}>{item.tagline}</Text>
            <View style={[sbn.pill, { backgroundColor: C.void }]}>
              <Text style={[sbn.pillTxt, { color: '#C41230' }]} numberOfLines={1}>{item.pillText}</Text>
            </View>
          </View>
          <Text style={sbn.arrow}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

const sbn = StyleSheet.create({
  card: { borderRadius: 12, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 }, android: { elevation: 3 } }) },
  leftCol:    { width: 100, height: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 5 },
  brandLogo:  { fontSize: 13, fontWeight: '900', letterSpacing: 0.4, color: C.void },
  personWrap: { width: 60, height: 60, borderRadius: 8, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.06)' },
  personImg:  { width: '100%', height: '100%' },
  vLine:      { width: 1, height: 60, backgroundColor: 'rgba(10,28,16,0.12)', marginHorizontal: 2 },
  rightCol:   { flex: 1, paddingHorizontal: 12, paddingVertical: 12, justifyContent: 'center', gap: 3 },
  productName:{ fontSize: 13, fontWeight: '900', letterSpacing: -0.2, lineHeight: 17, color: C.void },
  tagline:    { fontSize: 11, fontWeight: '500', lineHeight: 15, color: 'rgba(10,28,16,0.55)' },
  pill:       { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginTop: 3 },
  pillTxt:    { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  arrow:      { paddingRight: 12, fontSize: 22, color: 'rgba(10,28,16,0.30)', fontWeight: '300' },
});

// ═══════════════════════════════════════════════════════════════════════════
//  STATS SHOWCASE — animated count-up numbers with awards strip
// ═══════════════════════════════════════════════════════════════════════════

// Individual stat data
const STAT_ITEMS = [
  { id: 's1', target: 20,  suffix: 'K+',  label: 'App Downloads',    icon: '📲', unit: '' },
  { id: 's2', target: 50,  suffix: 'K+',  label: 'Orders Delivered', icon: '🛵', unit: '' },
  { id: 's3', target: 4.9, suffix: '★',   label: 'Average Rating',   icon: '⭐', unit: '', isDecimal: true },
  { id: 's4', target: 99,  suffix: '%',   label: 'On-time Delivery',  icon: '⚡', unit: '' },
] as const;

// Award chips shown in the scrolling strip below stats
const AWARD_ITEMS = [
  { id: 'a1', emoji: '🏆', text: 'Best Chinese App 2024' },
  { id: 'a2', emoji: '🌟', text: 'Top Rated Food Delivery' },
  { id: 'a3', emoji: '🥇', text: '#1 Authentic Cuisine' },
  { id: 'a4', emoji: '🎖️', text: 'Excellence in Service' },
  { id: 'a5', emoji: '🏅', text: 'Most Trusted Brand' },
  { id: 'a6', emoji: '✨', text: 'Editor\'s Choice 2024' },
];
// Duplicate for seamless loop
const AWARD_DATA  = [...AWARD_ITEMS, ...AWARD_ITEMS];
const AWARD_CHIP_W = 190;
const AWARD_GAP    = 10;
const AWARD_ITEM_W = AWARD_CHIP_W + AWARD_GAP;
const AWARD_LOOP_W = AWARD_ITEMS.length * AWARD_ITEM_W;

// Single animated counter
function AnimatedCounter({
  target,
  suffix,
  isDecimal,
  triggered,
  delay,
}: {
  target: number;
  suffix: string;
  isDecimal?: boolean;
  triggered: boolean;
  delay: number;
}) {
  const anim    = React.useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = React.useState(isDecimal ? '0.0' : '0');

  React.useEffect(() => {
    if (!triggered) return;
    const animation = Animated.timing(anim, {
      toValue: target,
      duration: 1800,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // must be false — we're driving a JS display value
    });
    const listener = anim.addListener(({ value }) => {
      if (isDecimal) {
        setDisplay(value.toFixed(1));
      } else {
        setDisplay(Math.floor(value).toString());
      }
    });
    animation.start();
    return () => {
      animation.stop();
      anim.removeListener(listener);
    };
  }, [triggered]);

  return (
    <TextInput
      editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
      value={`${display}${suffix}`}
      style={st.statNum}
    />
  );
}

function StatsShowcase() {
  // Trigger count-up once component is visible — uses a simple mount trigger
  const [triggered, setTriggered] = React.useState(false);
  const mountAnim  = React.useRef(new Animated.Value(0)).current;
  const awardsX    = React.useRef(new Animated.Value(0)).current;
  // Staggered card entrance
  const cardAnims  = React.useRef(STAT_ITEMS.map(() => new Animated.Value(0))).current;
  // Pulsing glow behind the section title
  const titleGlow  = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    // Small mount delay so the section renders before animation fires
    const t = setTimeout(() => {
      setTriggered(true);

      // Fade-in the whole section
      Animated.timing(mountAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

      // Stagger each stat card flying up from below
      const staggered = cardAnims.map((a, i) =>
        Animated.spring(a, {
          toValue: 1,
          delay: i * 120,
          damping: 16,
          stiffness: 200,
          useNativeDriver: true,
        })
      );
      Animated.parallel(staggered).start();

      // Title glow pulse loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(titleGlow, { toValue: 1,   duration: 1200, useNativeDriver: true }),
          Animated.timing(titleGlow, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
        ])
      ).start();

      // Awards belt — continuous left scroll
      Animated.loop(
        Animated.timing(awardsX, {
          toValue: -AWARD_LOOP_W,
          duration: AWARD_LOOP_W * 28,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }, 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[st.root, { opacity: mountAnim }]}>

      {/* ── Decorative top divider ── */}
      <View style={st.topDivider}>
        <View style={st.dividerLine} />
        <View style={st.dividerDiamond} />
        <View style={st.dividerLine} />
      </View>

      {/* ── Section headline ── */}
      <View style={st.titleRow}>
        <Animated.View style={[st.titleGlowDot, { opacity: titleGlow }]} />
        <TextInput
          editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
          value="Trusted by Thousands"
          style={st.titleMain}
        />
        <Animated.View style={[st.titleGlowDot, { opacity: titleGlow }]} />
      </View>
      <TextInput
        editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
        value="Numbers that speak for our love of food"
        style={st.titleSub}
      />

      {/* ── 2×2 stat grid ── */}
      <View style={st.grid}>
        {STAT_ITEMS.map((item, i) => {
          const cardTranslateY = cardAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [40, 0],
          });
          return (
            <Animated.View
              key={item.id}
              style={[
                st.card,
                // Alternate card accent — top-left vs top-right
                i % 2 === 0 ? st.cardLeft : st.cardRight,
                {
                  opacity: cardAnims[i],
                  transform: [{ translateY: cardTranslateY }],
                },
              ]}
            >
              {/* Icon bubble */}
              <View style={st.iconBubble}>
                <TextInput
                  editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                  value={item.icon}
                  style={st.iconEmoji}
                />
              </View>

              {/* Animated number */}
              <AnimatedCounter
                target={item.target}
                suffix={item.suffix}
                isDecimal={'isDecimal' in item && item.isDecimal}
                triggered={triggered}
                delay={i * 120 + 300}
              />

              {/* Label */}
              <TextInput
                editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                value={item.label}
                style={st.statLabel}
              />

              {/* Subtle bottom accent bar */}
              <View style={i % 2 === 0 ? st.accentBarRed : st.accentBarGold} />
            </Animated.View>
          );
        })}
      </View>

      {/* ── Divider label ── */}
      <View style={st.awardHeaderRow}>
        <View style={st.awardDivLine} />
        <TextInput
          editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
          value="🏆  OUR AWARDS"
          style={st.awardHeaderTxt}
        />
        <View style={st.awardDivLine} />
      </View>

      {/* ── Auto-scrolling award chips belt ── */}
      <View style={st.awardBelt}>
        <Animated.View style={[st.awardTrack, { transform: [{ translateX: awardsX }] }]}>
          {AWARD_DATA.map((award, i) => (
            <View key={`${award.id}-${i}`} style={st.awardChip}>
              <TextInput
                editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                value={award.emoji}
                style={st.awardChipEmoji}
              />
              <TextInput
                editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                value={award.text}
                style={st.awardChipTxt}
                numberOfLines={1}
              />
            </View>
          ))}
        </Animated.View>
      </View>

      {/* ── Bottom glow gradient ── */}
      <LinearGradient
        colors={['transparent', 'rgba(196,18,48,0.06)']}
        style={st.bottomGlow}
        pointerEvents="none"
      />

    </Animated.View>
  );
}

const st = StyleSheet.create({
  root: {
    backgroundColor: '#0C0C0C',
    paddingBottom: 32,
    overflow: 'hidden',
  },

  // ── Top decorative divider ──
  topDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    marginBottom: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(196,18,48,0.35)',
  },
  dividerDiamond: {
    width: 8, height: 8,
    borderWidth: 1.5,
    borderColor: '#C41230',
    transform: [{ rotate: '45deg' }],
  },

  // ── Title block ──
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 6,
    paddingHorizontal: PAD,
  },
  titleGlowDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: '#C41230',
  },
  titleMain: {
    fontSize: 22,
    fontFamily: F.display900,
    color: '#FFFFFF',
    letterSpacing: 0.3,
    padding: 0, margin: 0,
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
  titleSub: {
    fontSize: 12,
    fontFamily: F.sans400,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    padding: 0, margin: 0,
    backgroundColor: 'transparent',
    marginBottom: 24,
    letterSpacing: 0.3,
    paddingHorizontal: PAD,
  },

  // ── 2×2 stat grid ──
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PAD,
    gap: 10,
    marginBottom: 28,
  },
  card: {
    width: (SW - PAD * 2 - 10) / 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  // Left cards get a subtle red corner glow
  cardLeft: {
    borderTopColor: 'rgba(196,18,48,0.55)',
    borderTopWidth: 2,
  },
  // Right cards get a gold corner glow
  cardRight: {
    borderTopColor: 'rgba(255,209,102,0.55)',
    borderTopWidth: 2,
  },

  iconBubble: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(196,18,48,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(196,18,48,0.25)',
  },
  iconEmoji: {
    fontSize: 20, textAlign: 'center',
    padding: 0, margin: 0, backgroundColor: 'transparent',
    height: 24,
  },
  statNum: {
    fontSize: 32,
    fontFamily: F.display900,
    color: '#C41230',
    letterSpacing: -1,
    padding: 0, margin: 0,
    backgroundColor: 'transparent',
    marginBottom: 4,
    height: 38,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: F.sans600,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.4,
    padding: 0, margin: 0,
    backgroundColor: 'transparent',
    height: 15,
  },
  // Bottom accent bars
  accentBarRed: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 3,
    backgroundColor: '#C41230',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    opacity: 0.7,
  },
  accentBarGold: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 3,
    backgroundColor: '#FFD166',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    opacity: 0.7,
  },

  // ── Award divider row ──
  awardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    marginBottom: 14,
    gap: 10,
  },
  awardDivLine: {
    flex: 1, height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  awardHeaderTxt: {
    fontSize: 10,
    fontFamily: F.sans800,
    color: 'rgba(255,255,255,0.50)',
    letterSpacing: 2,
    padding: 0, margin: 0,
    backgroundColor: 'transparent',
  },

  // ── Award belt ──
  awardBelt: {
    overflow: 'hidden',
    height: 44,
    marginBottom: 4,
  },
  awardTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AWARD_GAP,
    paddingLeft: AWARD_GAP,
  },
  awardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    width: AWARD_CHIP_W,
    backgroundColor: '#1E0008',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(196,18,48,0.30)',
  },
  awardChipEmoji: {
    fontSize: 16,
    padding: 0, margin: 0, backgroundColor: 'transparent',
    width: 20, textAlign: 'center',
  },
  awardChipTxt: {
    flex: 1,
    fontSize: 11,
    fontFamily: F.sans700,
    color: 'rgba(255,255,255,0.80)',
    letterSpacing: 0.2,
    padding: 0, margin: 0,
    backgroundColor: 'transparent',
  },

  // ── Bottom gradient glow ──
  bottomGlow: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 60,
  },
});

// ═══════════════════════════════════════════════════════════════════════════
//  HOME GREETING — MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════

type HomeGreetingProps = {
  config?: typeof HOME_CONFIG;
  user?: any;
  /** Called when the location bar is tapped — parent owns the modal */
  onLocationPress?: () => void;
  onMenuPress?: () => void;
};

export function HomeGreeting({ config = HOME_CONFIG, onLocationPress, onMenuPress }: HomeGreetingProps) {
  const router = useRouter();
  const { deliveryLocation, setDeliveryLocation } = useCart();
  const [searchOpen,       setSearchOpen]       = React.useState(false);
  const [voiceOpen,        setVoiceOpen]        = React.useState(false);
  const [voiceInitQuery,   setVoiceInitQuery]   = React.useState('');

  // Auto-discover location on first mount
  React.useEffect(() => {
    if (deliveryLocation) return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [addr] = await Location.reverseGeocodeAsync(pos.coords);
        if (!addr) return;
        setDeliveryLocation({
          latitude:    pos.coords.latitude,
          longitude:   pos.coords.longitude,
          displayName: formatDisplayName(addr),
          city:        addr.city || addr.subregion || '',
          state:       addr.region || '',
          pincode:     addr.postalCode || '',
          fullAddress: formatFullAddress(addr),
        });
      } catch {}
    })();
  }, []);

  const nav = React.useCallback((route: string, params: Record<string, any>) => {
    router.push({ pathname: route as any, params });
  }, [router]);

  const onProductPress = React.useCallback((item: SearchResult) => {
    router.push(`/storefront/${item.slug || item.id}` as any);
  }, [router]);

  const handleVoiceResult = React.useCallback((text: string) => {
    setVoiceOpen(false);
    setVoiceInitQuery(text);
    setTimeout(() => setSearchOpen(true), 50);
  }, []);

  return (
    <View style={{ backgroundColor: '#C41230' }}>

      {/* ── 1. Search + Location ── */}
      {config.searchConfig.enabled && (
        <View style={{ overflow: 'hidden', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, backgroundColor: '#1A0005' }}>
          <ExpoImage
            source={{ uri: config.carouselConfig.slides[0]?.heroImageUri }}
            style={[StyleSheet.absoluteFill, { opacity: 0.45 }]}
            contentFit="cover"
            cachePolicy="disk"
          />
          <LinearGradient
            colors={['rgba(26,0,5,0.95)', 'rgba(26,0,5,0.85)', 'rgba(26,0,5,0.72)', 'rgba(26,0,5,0.82)']}
            locations={[0, 0.35, 0.65, 1]}
            style={StyleSheet.absoluteFill}
          />
          <LocationBar onPress={() => onLocationPress?.()} />
          <View style={hdr.promoBlock}>
            <View style={hdr.promoRow}>
              <TextInput
                editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                value="15%"
                style={hdr.promoPct}
              />
              <View style={hdr.promoRightCol}>
                <TextInput
                  editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                  value="EXTRA"
                  style={hdr.promoExtra}
                />
                <TextInput
                  editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                  value="DISCOUNT"
                  style={hdr.promoDiscount}
                />
              </View>
            </View>
            <TextInput
              editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
              value="Free delivery on your first Chinese order! 🥢"
              style={hdr.promoSub}
              numberOfLines={1}
            />
          </View>
          <SearchBar
            hints={config.searchConfig.hints}
            showVoice={config.searchConfig.showVoice}
            onOpen={() => setSearchOpen(true)}
            onVoicePress={() => setVoiceOpen(true)}
          />
          <VoiceSearchModal
            visible={voiceOpen}
            onClose={() => setVoiceOpen(false)}
            onResult={handleVoiceResult}
          />
          <SearchModal
            visible={searchOpen}
            onClose={() => { setSearchOpen(false); setVoiceInitQuery(''); }}
            onProductPress={onProductPress}
            initialQuery={voiceInitQuery}
          />
        </View>
      )}

      {/* ── 2. Early Table ── */}
      <EarlyTableSection onPress={(categoryId, categoryName) => nav('/storefront/categories', { categoryId, categoryName })} />

      {/* ── 3. Hero carousel ── */}
      {config.carouselConfig.enabled && (
        <View style={{ backgroundColor: C.white }} pointerEvents="box-none">
          <HeroCarousel
            slides={config.carouselConfig.slides}
            autoMs={config.carouselConfig.autoAdvanceMs}
            onPress={nav}
          />
        </View>
      )}

      {/* ── 4. Categories grid ── */}
      {config.primaryBanners.enabled && (
        <View style={{ backgroundColor: C.white }}>
          <PrimaryBannerSection
            items={config.primaryBanners.items}
            onPress={nav}
          />
        </View>
      )}

      {/* ── 5. Chinese hero banner ── */}
      <ChineseHeroBanner />

      {/* ── 6. Stats Showcase — count-up numbers + awards belt ── */}
      <StatsShowcase />

      <View style={{ height: SECTION_GAP * 2, backgroundColor: '#0C0C0C' }} pointerEvents="none" />
    </View>
  );
}

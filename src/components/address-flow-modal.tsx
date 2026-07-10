/**
 * AddressFlowModal
 *
 * Comprehensive delivery-address flow for the cart screen.
 *
 * Flow:
 *  1. Opens → fetches saved addresses (GET api/account/add_alternative/)
 *  2a. Addresses exist  → "list" screen: selectable cards + "Add New" button
 *  2b. No addresses     → directly skips to "form" screen
 *  3. "form" screen:
 *     - Mini-map pre-seeded from deliveryLocation (Zustand cart store)
 *     - Draggable pin + reverse geocode on release
 *     - Fields: addressLine1*, addressLine2, landmark, mobileNumber*,
 *               state (pre-filled), zipCode (pre-filled), countryRegion (India)
 *     - Save → POST api/account/add_alternative/ → back to list (auto-selected)
 *  4. "Deliver Here" → calls onSelect(addr) and closes
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Modal,
  FlatList,
  Pressable,
  ScrollView,
  TextInput as RNTextInput,
  Animated,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import type { Region } from 'react-native-maps';

// ── react-native-maps: guarded require so a missing/broken native binding
//    doesn't crash this module (and therefore cart.tsx) at load time.
//    Once the dev client is rebuilt with the correct pod, this always succeeds.
// ────────────────────────────────────────────────────────────────────────────
let MapView: any       = null;
let Marker: any        = null;
let PROVIDER_DEFAULT: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m          = require('react-native-maps');
  MapView          = m.default;
  Marker           = m.Marker;
  PROVIDER_DEFAULT = m.PROVIDER_DEFAULT;
} catch { /* native not ready — MapView stays null, fallback UI shown */ }
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useCart } from '@/lib/store/cart-store';
import { authenticatedClient } from '@/api/common/client';
import { showMessage } from 'react-native-flash-message';
import { F } from '@/lib/fonts';

const { height: SCREEN_H } = Dimensions.get('window');

// ── Design tokens ─────────────────────────────────────────────────────────────
const RED     = '#C41230';
const BLACK   = '#0C0C0C';
const DARK    = '#1C1C1C';
const SURFACE = '#242424';
const BORDER  = 'rgba(255,255,255,0.08)';
const MUTED   = 'rgba(255,255,255,0.45)';
const WHITE   = '#FFFFFF';
const RED_BG  = 'rgba(196,18,48,0.12)';
const RED_BD  = 'rgba(196,18,48,0.40)';

// ── Default India centre (used when no deliveryLocation set) ──────────────────
const INDIA_LAT = 20.5937;
const INDIA_LNG = 78.9629;

const MAP_H = 240;

// ── API Address shape (what the GET returns) ──────────────────────────────────
export interface SavedAddress {
  id?:            number;
  pk?:            number;
  // old-style fields
  label?:         string | null;
  address?:       string | null;
  value?:         string | null;
  phone_number?:  string | null;
  pincode?:       string | null;
  primary?:       boolean;
  verified?:      boolean;
  landmark?:      string | null;
  // new-style fields (from our POST)
  addressLine1?:  string | null;
  addressLine2?:  string | null;
  countryRegion?: string | null;
  mobileNumber?:  string | null;
  state?:         string | null;
  zipCode?:       string | null;
  latitude?:      number | null;
  longitude?:     number | null;
}

// What we hand back to the cart screen after selection ─────────────────────────
export interface SelectedDeliveryAddress {
  id?:           number;
  pk?:           number;
  displayLine:   string;   // primary display line
  subLine:       string;   // state + pincode
  addressLine1:  string;
  addressLine2:  string;
  landmark:      string;
  mobileNumber:  string;
  state:         string;
  zipCode:       string;
  countryRegion: string;
  latitude:      number | null;
  longitude:     number | null;
  primary?:      boolean;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  visible:  boolean;
  onClose:  () => void;
  onSelect: (addr: SelectedDeliveryAddress) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDisplayLine(a: SavedAddress): string {
  return (
    a.addressLine1 ??
    a.value ??
    a.address ??
    a.label ??
    ''
  );
}

function getSubLine(a: SavedAddress): string {
  const parts: string[] = [];
  if (a.state)               parts.push(a.state);
  if (a.zipCode || a.pincode) parts.push((a.zipCode ?? a.pincode)!);
  return parts.join(', ');
}

function toSelectedAddr(a: SavedAddress): SelectedDeliveryAddress {
  return {
    id:           a.id,
    pk:           a.pk,
    displayLine:  getDisplayLine(a),
    subLine:      getSubLine(a),
    addressLine1: a.addressLine1 ?? a.value ?? a.address ?? a.label ?? '',
    addressLine2: a.addressLine2 ?? '',
    landmark:     a.landmark ?? '',
    mobileNumber: a.mobileNumber ?? a.phone_number ?? '',
    state:        a.state ?? '',
    zipCode:      a.zipCode ?? a.pincode ?? '',
    countryRegion: a.countryRegion ?? 'India',
    latitude:     a.latitude ?? null,
    longitude:    a.longitude ?? null,
    primary:      a.primary,
  };
}

// ── Main component ────────────────────────────────────────────────────────────
export function AddressFlowModal({ visible, onClose, onSelect }: Props) {
  const insets          = useSafeAreaInsets();
  const { deliveryLocation } = useCart();

  // Sheet animation
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;

  // Flow state
  const [screen,     setScreen]     = useState<'list' | 'form'>('list');
  const [addresses,  setAddresses]  = useState<SavedAddress[]>([]);
  const [fetching,   setFetching]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form fields
  const [line1,    setLine1]    = useState('');
  const [line2,    setLine2]    = useState('');
  const [landmark, setLandmark] = useState('');
  const [phone,    setPhone]    = useState('');
  const [addrState, setAddrState] = useState('');
  const [pincode,  setPincode]  = useState('');
  const [country,  setCountry]  = useState('India');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Map / coordinates
  const [mapLat,    setMapLat]    = useState(deliveryLocation?.latitude  ?? INDIA_LAT);
  const [mapLng,    setMapLng]    = useState(deliveryLocation?.longitude ?? INDIA_LNG);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude:      deliveryLocation?.latitude  ?? INDIA_LAT,
    longitude:     deliveryLocation?.longitude ?? INDIA_LNG,
    latitudeDelta:  0.005,
    longitudeDelta: 0.005,
  });
  const [geocoding,  setGeocoding]  = useState(false);
  const [locating,   setLocating]   = useState(false);
  const geocodeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef        = useRef<MapView>(null);

  // Search
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults,   setShowResults]   = useState(false);
  const [searching,     setSearching]     = useState(false);

  // ── Open / close animation ──────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      // reset to list screen each open
      setScreen('list');
      setSelectedId(null);
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, tension: 65, friction: 12,
      }).start();
      fetchAddresses();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_H, duration: 220, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Sync map position when deliveryLocation changes
  useEffect(() => {
    if (deliveryLocation) {
      setMapLat(deliveryLocation.latitude);
      setMapLng(deliveryLocation.longitude);
      setAddrState(prev => prev || deliveryLocation.state  || '');
      setPincode(prev  => prev || deliveryLocation.pincode || '');
    }
  }, [deliveryLocation]);

  // ── Fetch saved addresses ───────────────────────────────────────────────────
  const fetchAddresses = useCallback(async () => {
    try {
      setFetching(true);
      const res = await authenticatedClient.get('api/account/add_alternative/');
      const raw: SavedAddress[] = res.data?.data ?? res.data ?? [];
      const valid = Array.isArray(raw)
        ? raw.filter(a => getDisplayLine(a).trim().length > 0)
        : [];
      setAddresses(valid);
      // If no addresses, jump straight to form
      if (valid.length === 0) openForm();
    } catch {
      showMessage({ message: 'Could not load saved addresses', type: 'warning' });
    } finally {
      setFetching(false);
    }
  }, []);

  // ── Open form (reset fields from deliveryLocation) ─────────────────────────
  function openForm() {
    const lat = deliveryLocation?.latitude  ?? INDIA_LAT;
    const lng = deliveryLocation?.longitude ?? INDIA_LNG;
    setLine1('');
    setLine2('');
    setLandmark('');
    setPhone('');
    setAddrState(deliveryLocation?.state   ?? '');
    setPincode(deliveryLocation?.pincode   ?? '');
    setCountry('India');
    setFieldErrors({});
    setMapLat(lat);
    setMapLng(lng);
    setMapRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.005, longitudeDelta: 0.005 });
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setScreen('form');
  }

  // ── Move map to new coords ─────────────────────────────────────────────────
  function flyTo(lat: number, lng: number, delta = 0.005) {
    const r: Region = { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta };
    setMapLat(lat);
    setMapLng(lng);
    setMapRegion(r);
    mapRef.current?.animateToRegion(r, 500);
  }

  // ── Zoom in / out ──────────────────────────────────────────────────────────
  function handleZoom(dir: 'in' | 'out') {
    const factor = dir === 'in' ? 0.4 : 2.2;
    const r: Region = {
      latitude:      mapLat,
      longitude:     mapLng,
      latitudeDelta:  mapRegion.latitudeDelta  * factor,
      longitudeDelta: mapRegion.longitudeDelta * factor,
    };
    setMapRegion(r);
    mapRef.current?.animateToRegion(r, 250);
  }

  // ── GPS: use device current position ──────────────────────────────────────
  async function handleGPSLocation() {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Enable location access in Settings.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      flyTo(pos.coords.latitude, pos.coords.longitude);
      scheduleReverseGeocode(pos.coords.latitude, pos.coords.longitude);
    } catch {
      showMessage({ message: 'Could not get GPS location', type: 'warning' });
    } finally {
      setLocating(false);
    }
  }

  // ── Nominatim search ───────────────────────────────────────────────────────
  function handleSearchChange(text: string) {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) { setShowResults(false); setSearchResults([]); return; }
    searchTimer.current = setTimeout(() => runSearch(text), 500);
  }

  async function runSearch(query: string) {
    try {
      setSearching(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'ChineseCornerApp/1.0' } },
      );
      const data: any[] = await res.json();
      setSearchResults(data);
      setShowResults(data.length > 0);
    } catch { /* silent */ }
    finally { setSearching(false); }
  }

  function handleSelectResult(result: any) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    flyTo(lat, lng, 0.008);
    scheduleReverseGeocode(lat, lng);

    // Auto-fill address fields from Nominatim address details
    const a = result.address ?? {};
    const street = [a.house_number, a.road].filter(Boolean).join(' ');
    const area   = a.suburb ?? a.neighbourhood ?? a.city_district ?? '';
    if (!line1)     setLine1(([street, area].filter(Boolean).join(', ') || result.display_name?.split(',')[0]) ?? '');
    if (!addrState && a.state)    setAddrState(a.state);
    if (!pincode   && a.postcode) setPincode(a.postcode);

    setSearchQuery(result.display_name?.split(',').slice(0, 2).join(',').trim() ?? '');
    setShowResults(false);
    Keyboard.dismiss();
  }

  // ── Reverse geocode after map move/drag ────────────────────────────────────
  function scheduleReverseGeocode(lat: number, lng: number) {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      try {
        setGeocoding(true);
        const [addr] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (addr) {
          if (!addrState && addr.region)     setAddrState(addr.region);
          if (!pincode   && addr.postalCode) setPincode(addr.postalCode);
          if (!line1)
            setLine1([addr.name, addr.street].filter(Boolean).join(', '));
        }
      } catch { /* silent */ } finally { setGeocoding(false); }
    }, 600);
  }

  // ── Validate + Save new address ─────────────────────────────────────────────
  async function handleSave() {
    const errors: Record<string, string> = {};
    if (!line1.trim())  errors.line1 = 'Address Line 1 is required';
    if (!phone.trim())  errors.phone = 'Mobile number is required';
    if (phone.trim().length < 10) errors.phone = 'Enter a valid 10-digit number';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSaving(true);

      const payload = {
        addressLine1:  line1.trim(),
        addressLine2:  line2.trim(),
        countryRegion: country.trim() || 'India',
        landmark:      landmark.trim(),
        latitude:      mapLat,
        longitude:     mapLng,
        mobileNumber:  phone.trim(),
        state:         addrState.trim(),
        zipCode:       pincode.trim(),
        new_address: {
          latitude:  mapLat,
          longitude: mapLng,
          pincode:   pincode.trim(),
          state:     addrState.trim(),
        },
      };

      const res = await authenticatedClient.post('api/account/add_alternative/', payload);

      // Try to get the newly created address id back from the response
      const newAddr: SavedAddress = {
        ...(res.data?.data ?? res.data ?? {}),
        addressLine1:  payload.addressLine1,
        addressLine2:  payload.addressLine2,
        countryRegion: payload.countryRegion,
        landmark:      payload.landmark,
        latitude:      payload.latitude,
        longitude:     payload.longitude,
        mobileNumber:  payload.mobileNumber,
        state:         payload.state,
        zipCode:       payload.zipCode,
      };

      showMessage({ message: 'Address saved!', type: 'success' });

      // Refresh list and auto-select the new address
      await fetchAddresses();
      setScreen('list');

      // Auto-select newly added (find by line1 match or last item)
      setAddresses(prev => {
        const match = prev.find(
          a => (a.addressLine1 ?? a.value ?? '') === payload.addressLine1
        );
        if (match) setSelectedId(match.id ?? match.pk ?? null);
        else if (prev.length > 0) {
          const last = prev[prev.length - 1];
          setSelectedId(last.id ?? last.pk ?? null);
        }
        return prev;
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Could not save address';
      showMessage({ message: msg, type: 'danger' });
    } finally {
      setSaving(false);
    }
  }

  // ── Confirm selection ───────────────────────────────────────────────────────
  function handleDeliverHere() {
    const addr = addresses.find(
      a => (a.id ?? a.pk) === selectedId
    );
    if (!addr) return;
    onSelect(toSelectedAddr(addr));
    onClose();
  }

  // ── Delete a saved address ──────────────────────────────────────────────────
  function handleDelete(addr: SavedAddress) {
    Alert.alert('Remove Address', 'Delete this saved address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await authenticatedClient.delete('api/account/add_alternative/', {
              data: { pk: addr.pk ?? addr.id },
            });
            setAddresses(prev => prev.filter(
              a => (a.id ?? a.pk) !== (addr.id ?? addr.pk)
            ));
            if (selectedId === (addr.id ?? addr.pk)) setSelectedId(null);
          } catch {
            showMessage({ message: 'Could not delete address', type: 'danger' });
          }
        },
      },
    ]);
  }

  // ── Back logic ──────────────────────────────────────────────────────────────
  function handleBack() {
    if (screen === 'form') {
      if (addresses.length > 0) {
        setScreen('list');
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  }

  // ── Render: Address card ────────────────────────────────────────────────────
  function renderAddressCard({ item }: { item: SavedAddress }) {
    const itemId   = item.id ?? item.pk ?? null;
    const selected = selectedId === itemId;
    const display  = getDisplayLine(item);
    const sub      = getSubLine(item);

    return (
      <Pressable
        style={[af.addrCard, selected && af.addrCardSelected]}
        onPress={() => setSelectedId(itemId)}
        activeOpacity={0.75}
      >
        {/* Selection indicator */}
        <View style={[af.addrRadio, selected && af.addrRadioOn]}>
          {selected && <View style={af.addrRadioDot} />}
        </View>

        {/* Content */}
        <View style={{ flex: 1, gap: 3 }}>
          {/* Badges row */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 2 }}>
            {item.primary && (
              <View style={af.badge}>
                <Text style={af.badgeTxt}>PRIMARY</Text>
              </View>
            )}
            {item.verified && (
              <View style={[af.badge, { backgroundColor: 'rgba(34,197,94,0.2)', borderColor: 'rgba(34,197,94,0.4)' }]}>
                <Text style={[af.badgeTxt, { color: '#22C55E' }]}>VERIFIED ✓</Text>
              </View>
            )}
          </View>

          {/* Main address line */}
          <Text style={af.addrLine} numberOfLines={2}>{display || '—'}</Text>

          {/* line2 / landmark */}
          {!!(item.addressLine2) && (
            <Text style={af.addrSub} numberOfLines={1}>{item.addressLine2}</Text>
          )}
          {!!(item.landmark) && (
            <Text style={af.addrSub} numberOfLines={1}>Near: {item.landmark}</Text>
          )}

          {/* State + pincode */}
          {!!sub && <Text style={af.addrSub}>{sub}</Text>}

          {/* Phone */}
          {!!(item.mobileNumber || item.phone_number) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <Ionicons name="call-outline" size={11} color={MUTED} />
              <Text style={af.addrPhone}>{item.mobileNumber ?? item.phone_number}</Text>
            </View>
          )}
        </View>

        {/* Delete */}
        <Pressable
          hitSlop={10}
          onPress={() => handleDelete(item)}
          style={{ paddingLeft: 8, paddingTop: 2 }}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </Pressable>
      </Pressable>
    );
  }

  // ── Render: List screen ─────────────────────────────────────────────────────
  function renderList() {
    if (fetching) {
      return (
        <View style={af.centered}>
          <ActivityIndicator color={RED} size="large" />
          <Text style={af.loadingTxt}>Fetching addresses…</Text>
        </View>
      );
    }

    return (
      <>
        <FlatList
          data={addresses}
          keyExtractor={(item, i) => String(item.id ?? item.pk ?? i)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={renderAddressCard}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={af.centered}>
              <Ionicons name="location-outline" size={48} color={MUTED} />
              <Text style={af.emptyTxt}>No saved addresses</Text>
            </View>
          }
        />

        {/* Sticky bottom buttons */}
        <View style={[af.listFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Deliver Here */}
          <Pressable
            style={[af.deliverBtn, !selectedId && af.deliverBtnDisabled]}
            onPress={handleDeliverHere}
            disabled={!selectedId}
            activeOpacity={0.85}
          >
            <Ionicons name="flash" size={18} color={WHITE} />
            <Text style={af.deliverBtnTxt}>Deliver Here</Text>
          </Pressable>

          {/* Add new address */}
          <Pressable
            style={af.addNewBtn}
            onPress={openForm}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={18} color={RED} />
            <Text style={af.addNewTxt}>Add New Address</Text>
          </Pressable>
        </View>
      </>
    );
  }

  // ── Render: Form screen ─────────────────────────────────────────────────────
  function renderForm() {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ═══════════════════════════════════════════════════════
              Map section: search bar + MapView + controls
          ═══════════════════════════════════════════════════════ */}
          <View style={af.mapSection}>

            {/* ── Search bar ── */}
            <View style={af.searchBar}>
              <Ionicons name="search" size={15} color={MUTED} />
              <RNTextInput
                style={af.searchInput}
                placeholder="Search area, street, city…"
                placeholderTextColor={MUTED}
                value={searchQuery}
                onChangeText={handleSearchChange}
                returnKeyType="search"
                onSubmitEditing={() => runSearch(searchQuery)}
              />
              {searching
                ? <ActivityIndicator size="small" color={RED} />
                : searchQuery.length > 0 && (
                    <Pressable hitSlop={8} onPress={() => { setSearchQuery(''); setShowResults(false); }}>
                      <Ionicons name="close-circle" size={16} color={MUTED} />
                    </Pressable>
                  )
              }
            </View>

            {/* ── Nominatim results dropdown ── */}
            {showResults && searchResults.length > 0 && (
              <View style={af.searchDropdown}>
                {searchResults.map((r: any, i: number) => (
                  <Pressable
                    key={i}
                    style={[af.searchResult, i < searchResults.length - 1 && af.searchResultBorder]}
                    onPress={() => handleSelectResult(r)}
                  >
                    <Ionicons name="location-outline" size={13} color={RED} style={{ flexShrink: 0, marginTop: 1 }} />
                    <Text style={af.searchResultTxt} numberOfLines={2}>{r.display_name}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* ── MapView (or fallback if native not ready) ── */}
            <View style={af.mapContainer}>
              {MapView ? (
                <>
                  <MapView
                    ref={mapRef}
                    style={af.map}
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
                      pinColor={RED}
                    />
                  </MapView>

                  {/* ── Zoom controls ── */}
                  <View style={af.zoomControls}>
                    <Pressable style={af.zoomBtn} onPress={() => handleZoom('in')} hitSlop={4}>
                      <Ionicons name="add" size={20} color={WHITE} />
                    </Pressable>
                    <View style={af.zoomDivider} />
                    <Pressable style={af.zoomBtn} onPress={() => handleZoom('out')} hitSlop={4}>
                      <Ionicons name="remove" size={20} color={WHITE} />
                    </Pressable>
                  </View>
                </>
              ) : (
                /* Native map not ready — GPS still works to update coords */
                <View style={af.mapFallback}>
                  <Ionicons name="map-outline" size={32} color={MUTED} />
                  <Text style={af.mapFallbackTitle}>Map requires a rebuild</Text>
                  <Text style={af.mapFallbackSub}>
                    Run: pod install → pnpm ios{'\n'}Use GPS below to set your location
                  </Text>
                </View>
              )}

              {/* ── GPS button (always visible) ── */}
              <Pressable
                style={[af.gpsBtn, locating && { opacity: 0.6 }]}
                onPress={handleGPSLocation}
                disabled={locating}
              >
                {locating
                  ? <ActivityIndicator size="small" color={WHITE} />
                  : <Ionicons name="navigate" size={17} color={WHITE} />}
              </Pressable>

              {/* ── Geocoding pill ── */}
              {geocoding && (
                <View style={af.geocodePill} pointerEvents="none">
                  <ActivityIndicator size="small" color={WHITE} />
                  <Text style={af.geocodePillTxt}>Finding address…</Text>
                </View>
              )}
            </View>

            {/* ── Coordinate strip ── */}
            <View style={af.coordRow}>
              <Ionicons name="location" size={12} color={RED} />
              <Text style={af.coordTxt}>{mapLat.toFixed(6)}, {mapLng.toFixed(6)}</Text>
            </View>
          </View>

          {/* ── Form fields ── */}
          <View style={af.formBody}>

            {/* Address Line 1 */}
            <View style={af.fieldWrap}>
              <Text style={af.fieldLabel}>Address Line 1 *</Text>
              <RNTextInput
                style={[af.input, !!fieldErrors.line1 && af.inputError]}
                placeholder="Flat / Building, Street, Colony"
                placeholderTextColor={MUTED}
                value={line1}
                onChangeText={v => { setLine1(v); setFieldErrors(p => ({ ...p, line1: '' })); }}
                returnKeyType="next"
              />
              {!!fieldErrors.line1 && <Text style={af.errorTxt}>{fieldErrors.line1}</Text>}
            </View>

            {/* Address Line 2 */}
            <View style={af.fieldWrap}>
              <Text style={af.fieldLabel}>Address Line 2</Text>
              <RNTextInput
                style={af.input}
                placeholder="Apartment / Floor / Wing (optional)"
                placeholderTextColor={MUTED}
                value={line2}
                onChangeText={setLine2}
                returnKeyType="next"
              />
            </View>

            {/* Landmark */}
            <View style={af.fieldWrap}>
              <Text style={af.fieldLabel}>Landmark</Text>
              <RNTextInput
                style={af.input}
                placeholder="Near school, hospital, etc."
                placeholderTextColor={MUTED}
                value={landmark}
                onChangeText={setLandmark}
                returnKeyType="next"
              />
            </View>

            {/* Mobile Number */}
            <View style={af.fieldWrap}>
              <Text style={af.fieldLabel}>Mobile Number *</Text>
              <RNTextInput
                style={[af.input, !!fieldErrors.phone && af.inputError]}
                placeholder="10-digit mobile number"
                placeholderTextColor={MUTED}
                value={phone}
                onChangeText={v => { setPhone(v); setFieldErrors(p => ({ ...p, phone: '' })); }}
                keyboardType="phone-pad"
                returnKeyType="next"
                maxLength={15}
              />
              {!!fieldErrors.phone && <Text style={af.errorTxt}>{fieldErrors.phone}</Text>}
            </View>

            {/* State + Pincode side by side */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[af.fieldWrap, { flex: 1 }]}>
                <Text style={af.fieldLabel}>State</Text>
                <RNTextInput
                  style={af.input}
                  placeholder="e.g. Uttarakhand"
                  placeholderTextColor={MUTED}
                  value={addrState}
                  onChangeText={setAddrState}
                  returnKeyType="next"
                />
              </View>
              <View style={[af.fieldWrap, { flex: 1 }]}>
                <Text style={af.fieldLabel}>Pincode</Text>
                <RNTextInput
                  style={af.input}
                  placeholder="e.g. 262308"
                  placeholderTextColor={MUTED}
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="numeric"
                  returnKeyType="next"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Country — read-only */}
            <View style={af.fieldWrap}>
              <Text style={af.fieldLabel}>Country</Text>
              <View style={[af.input, af.inputReadOnly]}>
                <Text style={{ color: MUTED, fontSize: 14 }}>{country}</Text>
              </View>
            </View>

            {/* Save button */}
            <Pressable
              style={[af.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color={WHITE} />
                : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color={WHITE} />
                    <Text style={af.saveBtnTxt}>Save Address</Text>
                  </>
                )
              }
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Root render ─────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleBack}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Pressable style={af.backdrop} onPress={handleBack} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          af.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle bar */}
        <View style={af.handle} />

        {/* ── Header ── */}
        <View style={af.header}>
          <Pressable onPress={handleBack} style={af.backBtn} hitSlop={12}>
            <Ionicons
              name={screen === 'form' && addresses.length > 0 ? 'arrow-back' : 'close'}
              size={22}
              color={WHITE}
            />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={af.headerTitle}>
              {screen === 'list' ? 'Delivery Address' : 'Add New Address'}
            </Text>
            {screen === 'form' && (
              <Text style={af.headerSub}>Fill in your delivery details</Text>
            )}
          </View>

          {screen === 'list' && (
            <Pressable
              style={af.addIconBtn}
              onPress={openForm}
              hitSlop={10}
              activeOpacity={0.75}
            >
              <Ionicons name="add" size={20} color={RED} />
            </Pressable>
          )}
        </View>

        {/* ── Orange separator ── */}
        <View style={af.headerLine} />

        {/* ── Content ── */}
        <View style={{ flex: 1 }}>
          {screen === 'list' ? renderList() : renderForm()}
        </View>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const af = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },

  sheet: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    height:            SCREEN_H * 0.88,
    backgroundColor:   BLACK,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    borderTopWidth:    2.5,
    borderTopColor:    RED,
    ...Platform.select({
      ios: {
        shadowColor:   RED,
        shadowOpacity: 0.25,
        shadowRadius:  20,
        shadowOffset:  { width: 0, height: -4 },
      },
    }),
    elevation: 24,
  },

  handle: {
    width:        40,
    height:       4,
    borderRadius: 2,
    backgroundColor: 'rgba(196,18,48,0.4)',
    alignSelf:    'center',
    marginTop:    12,
    marginBottom: 4,
  },

  // Header
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    paddingHorizontal: 18,
    paddingVertical:   14,
  },
  backBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: SURFACE,
    alignItems:      'center',
    justifyContent:  'center',
  },
  headerTitle: {
    fontFamily: F.sans800,
    fontSize:   17,
    color:      WHITE,
    letterSpacing: 0.2,
  },
  headerSub: {
    fontFamily: F.sans400,
    fontSize:   11,
    color:      MUTED,
    marginTop:  2,
  },
  addIconBtn: {
    width:           34,
    height:          34,
    borderRadius:    17,
    backgroundColor: RED_BG,
    borderWidth:     1,
    borderColor:     RED_BD,
    alignItems:      'center',
    justifyContent:  'center',
  },
  headerLine: {
    height:           2,
    backgroundColor:  RED,
    marginHorizontal: 0,
    opacity:          0.5,
  },

  // Loading / empty
  centered: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingTop:     48,
    gap:            12,
  },
  loadingTxt: { fontFamily: F.sans500, fontSize: 13, color: MUTED },
  emptyTxt:   { fontFamily: F.sans600, fontSize: 14, color: MUTED },

  // Address card
  addrCard: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             12,
    backgroundColor: DARK,
    borderRadius:    16,
    padding:         14,
    borderWidth:     1.5,
    borderColor:     BORDER,
  },
  addrCardSelected: {
    borderColor:     RED,
    backgroundColor: RED_BG,
  },

  addrRadio: {
    width:        22,
    height:       22,
    borderRadius: 11,
    borderWidth:  2,
    borderColor:  BORDER,
    alignItems:   'center',
    justifyContent: 'center',
    marginTop:    2,
    flexShrink:   0,
  },
  addrRadioOn:  { borderColor: RED },
  addrRadioDot: {
    width: 11, height: 11, borderRadius: 5.5, backgroundColor: RED,
  },

  badge: {
    backgroundColor:  RED_BG,
    borderWidth:      1,
    borderColor:      RED_BD,
    borderRadius:     5,
    paddingHorizontal: 7,
    paddingVertical:  2,
  },
  badgeTxt: {
    fontFamily:    F.sans800,
    fontSize:      8,
    color:         RED,
    letterSpacing: 1,
  },

  addrLine:  { fontFamily: F.sans700, fontSize: 13, color: WHITE,    lineHeight: 19 },
  addrSub:   { fontFamily: F.sans400, fontSize: 11, color: MUTED,    marginTop: 1 },
  addrPhone: { fontFamily: F.sans400, fontSize: 11, color: MUTED },

  // List footer
  listFooter: {
    paddingHorizontal: 16,
    paddingTop:        12,
    gap:               10,
    borderTopWidth:    1,
    borderTopColor:    BORDER,
    backgroundColor:   BLACK,
  },
  deliverBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    backgroundColor: RED,
    borderRadius:   14,
    paddingVertical: 15,
    ...Platform.select({
      ios: {
        shadowColor:   RED,
        shadowOpacity: 0.45,
        shadowRadius:  12,
        shadowOffset:  { width: 0, height: 4 },
      },
    }),
  },
  deliverBtnDisabled: { opacity: 0.35 },
  deliverBtnTxt: {
    fontFamily:    F.sans800,
    fontSize:      15,
    color:         WHITE,
    letterSpacing: 0.4,
  },

  addNewBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    backgroundColor: RED_BG,
    borderRadius:   14,
    paddingVertical: 13,
    borderWidth:    1.5,
    borderColor:    RED_BD,
  },
  addNewTxt: {
    fontFamily: F.sans700,
    fontSize:   14,
    color:      RED,
  },

  // ── Map section ───────────────────────────────────────────────────────────
  mapSection: { },

  // Search bar
  searchBar: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    marginHorizontal:  12,
    marginTop:         12,
    marginBottom:      4,
    backgroundColor:   DARK,
    borderRadius:      12,
    paddingHorizontal: 12,
    paddingVertical:   10,
    borderWidth:       1.5,
    borderColor:       BORDER,
  },
  searchInput: {
    flex:       1,
    fontSize:   13,
    fontFamily: F.sans500,
    color:      WHITE,
    padding:    0,
  },

  // Search dropdown
  searchDropdown: {
    marginHorizontal: 12,
    backgroundColor:  DARK,
    borderRadius:     12,
    borderWidth:      1.5,
    borderColor:      BORDER,
    overflow:         'hidden',
    zIndex:           99,
    marginBottom:     4,
  },
  searchResult: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    gap:               8,
    paddingHorizontal: 12,
    paddingVertical:   11,
  },
  searchResultBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  searchResultTxt: {
    flex:       1,
    fontFamily: F.sans500,
    fontSize:   12,
    color:      WHITE,
    lineHeight: 17,
  },

  // Map container
  mapContainer: {
    height:          MAP_H,
    marginHorizontal: 12,
    borderRadius:    14,
    overflow:        'hidden',
    position:        'relative',
  },
  map: { ...StyleSheet.absoluteFillObject },
  mapFallback: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: DARK,
  },
  mapFallbackTitle: { fontFamily: F.sans700, fontSize: 13, color: MUTED },
  mapFallbackSub:   { fontFamily: F.sans400, fontSize: 11, color: MUTED, textAlign: 'center', lineHeight: 17 },

  // Zoom controls — left side
  zoomControls: {
    position:         'absolute',
    left:             10,
    top:              10,
    backgroundColor:  'rgba(12,12,12,0.80)',
    borderRadius:     10,
    borderWidth:      1,
    borderColor:      'rgba(255,255,255,0.12)',
    overflow:         'hidden',
  },
  zoomBtn: {
    width:          38,
    height:         38,
    alignItems:     'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height:          1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  // GPS button — bottom right
  gpsBtn: {
    position:        'absolute',
    bottom:          10,
    right:           10,
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: RED,
    alignItems:      'center',
    justifyContent:  'center',
    ...Platform.select({
      ios: { shadowColor: RED, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
    }),
    elevation: 6,
  },

  // Geocoding pill — bottom centre
  geocodePill: {
    position:          'absolute',
    bottom:            10,
    alignSelf:         'center',
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   'rgba(12,12,12,0.80)',
    paddingHorizontal: 12,
    paddingVertical:   5,
    borderRadius:      20,
  },
  geocodePillTxt: { fontFamily: F.sans500, fontSize: 11, color: WHITE },

  // Coordinates strip
  coordRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 16,
    paddingVertical:   7,
    backgroundColor:   DARK,
    marginHorizontal:  12,
    borderRadius:      8,
    marginTop:         4,
    marginBottom:      4,
  },
  coordTxt: {
    fontFamily: F.sans400,
    fontSize:   11,
    color:      MUTED,
  },

  // Form
  formBody: {
    paddingHorizontal: 16,
    paddingTop:        16,
    gap:               4,
  },
  fieldWrap:  { marginBottom: 12 },
  fieldLabel: {
    fontFamily:    F.sans700,
    fontSize:      12,
    color:         MUTED,
    letterSpacing: 0.4,
    marginBottom:  6,
  },
  input: {
    backgroundColor:  DARK,
    borderRadius:     12,
    paddingHorizontal: 14,
    paddingVertical:  13,
    fontSize:         14,
    fontFamily:       F.sans500,
    color:            WHITE,
    borderWidth:      1.5,
    borderColor:      BORDER,
  },
  inputError:   { borderColor: '#EF4444' },
  inputReadOnly: {
    justifyContent: 'center',
    paddingVertical: 14,
  },
  errorTxt: {
    fontFamily: F.sans500,
    fontSize:   11,
    color:      '#EF4444',
    marginTop:  4,
  },

  saveBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    marginTop:       8,
    backgroundColor: RED,
    borderRadius:    14,
    paddingVertical: 16,
    ...Platform.select({
      ios: {
        shadowColor:   RED,
        shadowOpacity: 0.45,
        shadowRadius:  12,
        shadowOffset:  { width: 0, height: 4 },
      },
    }),
  },
  saveBtnTxt: {
    fontFamily:    F.sans800,
    fontSize:      15,
    color:         WHITE,
    letterSpacing: 0.4,
  },
});

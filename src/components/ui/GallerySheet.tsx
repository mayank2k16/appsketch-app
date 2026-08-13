import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import * as React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

const COLUMNS = 3;
const GAP = 2;
const PAGE = 90;

/**
 * In-app photo grid.
 *
 * Why not the system picker: `expo-image-picker`'s sheet is presented by iOS
 * outside our view hierarchy, and when anything about the presentation is off
 * (a missing usage string, a modal already on screen) it comes up with Cancel
 * and Add inert — the user can neither pick nor escape. That failure is not
 * observable or fixable from JS. This grid is ours: the ✕ and the ✓ are plain
 * `TouchableOpacity`s in our own tree, so they cannot be dead, and they can be
 * driven in the simulator like any other control.
 *
 * Selection is ordered — the badge shows 1, 2, 3 — because "which image is the
 * first reference" is meaningful to the agent.
 */
export function GallerySheet({
  visible,
  onClose,
  onConfirm,
  t,
  max = 3,
}: {
  visible: boolean;
  onClose: () => void;
  /** Local `file://` uris, in the order the user tapped them. */
  onConfirm: (uris: string[]) => void;
  t: AppColors;
  max?: number;
}) {
  const insets = useSafeAreaInsets();
  const [perm, setPerm] = React.useState<'unknown' | 'granted' | 'denied'>(
    'unknown'
  );
  const [assets, setAssets] = React.useState<MediaLibrary.Asset[]>([]);
  const [cursor, setCursor] = React.useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [picked, setPicked] = React.useState<string[]>([]);
  const [resolving, setResolving] = React.useState(false);

  const tile = (Dimensions.get('window').width - GAP * (COLUMNS - 1)) / COLUMNS;

  const load = React.useCallback(async (after?: string) => {
    setLoading(true);
    try {
      const page = await MediaLibrary.getAssetsAsync({
        first: PAGE,
        after,
        mediaType: [MediaLibrary.MediaType.photo],
        sortBy: [MediaLibrary.SortBy.creationTime],
      });
      setAssets((prev) => (after ? [...prev, ...page.assets] : page.assets));
      setCursor(page.endCursor);
      setHasMore(page.hasNextPage);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ask, then load — and reset the selection each time it opens so a cancelled
  // pick doesn't silently come back on the next attach.
  React.useEffect(() => {
    if (!visible) return;
    setPicked([]);
    let cancelled = false;
    (async () => {
      const res = await MediaLibrary.requestPermissionsAsync(false);
      if (cancelled) return;
      // `limited` (iOS "Selected Photos") is a grant: we simply see fewer
      // assets, which is the user's stated intent, not an error.
      const ok =
        res.granted ||
        res.status === 'granted' ||
        res.accessPrivileges === 'limited';
      setPerm(ok ? 'granted' : 'denied');
      if (ok) {
        setAssets([]);
        setCursor(undefined);
        setHasMore(true);
        await load(undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, load]);

  function toggle(id: string) {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= max) return prev;
      return [...prev, id];
    });
  }

  async function confirm() {
    if (picked.length === 0 || resolving) return;
    setResolving(true);
    try {
      // An iOS asset uri is `ph://<id>`, which nothing outside the Photos
      // framework can read — `getAssetInfoAsync` is what turns it into a real
      // file. Doing it here, once, on the few images actually chosen, keeps the
      // grid cheap and every consumer downstream uri-agnostic.
      const uris: string[] = [];
      for (const id of picked) {
        const asset = assets.find((a) => a.id === id);
        if (!asset) continue;
        try {
          const info = await MediaLibrary.getAssetInfoAsync(asset);
          uris.push(info.localUri || asset.uri);
        } catch {
          uris.push(asset.uri);
        }
      }
      onConfirm(uris);
      onClose();
    } finally {
      setResolving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={[s.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
        <View style={[s.header, { borderColor: t.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={s.headerBtn}>
            <Ionicons name="close" size={24} color={t.text} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.headerTitle, { color: t.text }]}>Photos</Text>
            <Text style={[s.headerSub, { color: t.textSub }]}>
              {picked.length > 0
                ? `${picked.length} of ${max} selected`
                : `Select up to ${max}`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={confirm}
            hitSlop={12}
            disabled={picked.length === 0 || resolving}
            style={[s.headerBtn, (picked.length === 0 || resolving) && s.dim]}
          >
            {resolving ? (
              <ActivityIndicator size="small" color={t.accent} />
            ) : (
              <Ionicons name="checkmark" size={26} color={t.accent} />
            )}
          </TouchableOpacity>
        </View>

        {perm === 'denied' ? (
          <View style={s.center}>
            <Ionicons name="images-outline" size={34} color={t.textMuted} />
            <Text style={[s.emptyText, { color: t.textSub }]}>
              Photo access is off. Enable it for this app in Settings to attach
              images.
            </Text>
          </View>
        ) : perm === 'unknown' || (loading && assets.length === 0) ? (
          <View style={s.center}>
            <ActivityIndicator color={t.accent} />
          </View>
        ) : assets.length === 0 ? (
          <View style={s.center}>
            <Ionicons name="images-outline" size={34} color={t.textMuted} />
            <Text style={[s.emptyText, { color: t.textSub }]}>
              No photos found on this device.
            </Text>
          </View>
        ) : (
          <FlatList
            data={assets}
            keyExtractor={(a) => a.id}
            numColumns={COLUMNS}
            initialNumToRender={PAGE / 3}
            windowSize={5}
            onEndReachedThreshold={0.6}
            onEndReached={() => {
              if (hasMore && !loading) void load(cursor);
            }}
            columnWrapperStyle={{ gap: GAP }}
            contentContainerStyle={{
              gap: GAP,
              paddingBottom: insets.bottom + 16,
            }}
            renderItem={({ item }) => {
              const order = picked.indexOf(item.id);
              const selected = order >= 0;
              return (
                <Pressable
                  onPress={() => toggle(item.id)}
                  style={{ width: tile, height: tile }}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={s.tileImg}
                    contentFit="cover"
                    recyclingKey={item.id}
                  />
                  {selected ? (
                    <View
                      style={[s.tileSelected, { borderColor: t.accent }]}
                      pointerEvents="none"
                    />
                  ) : null}
                  <View
                    style={[
                      s.badge,
                      selected
                        ? { backgroundColor: t.accent, borderColor: t.accent }
                        : { borderColor: '#FFFFFF' },
                    ]}
                    pointerEvents="none"
                  >
                    {selected ? (
                      <Text style={s.badgeText}>{order + 1}</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: { opacity: 0.35 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: F.sans600, fontSize: 16 },
  headerSub: { fontFamily: F.sans500, fontSize: 11, marginTop: 1 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 36,
  },
  emptyText: { fontFamily: F.sans400, fontSize: 13.5, textAlign: 'center' },

  tileImg: { width: '100%', height: '100%' },
  tileSelected: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: F.sans700,
    fontSize: 11,
  },
});

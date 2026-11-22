import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as React from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { toast } from '@/lib/toast';

import type { PageTheme } from './theme';

const ORANGE = '#EB4709';

const PICK: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.9,
  allowsEditing: true,
  aspect: [1, 1],
};

/** Camera or library; null when cancelled or refused. */
async function pickFrom(source: 'camera' | 'library'): Promise<string | null> {
  try {
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        toast.info('Allow camera access in Settings to take a photo.');
        return null;
      }
      const r = await ImagePicker.launchCameraAsync(PICK);
      return !r.canceled && r.assets[0] ? r.assets[0].uri : null;
    }
    const r = await ImagePicker.launchImageLibraryAsync(PICK);
    return !r.canceled && r.assets[0] ? r.assets[0].uri : null;
  } catch {
    // The simulator has no camera; some devices refuse too.
    toast.error(
      source === 'camera'
        ? "The camera isn't available here."
        : "Couldn't open your photos."
    );
    return null;
  }
}

/** "Take photo / Choose from library (/ Remove)": the iOS action sheet,
 *  an alert with the same choices on Android. */
function askSource(hasLogo: boolean, done: (choice: number) => void) {
  const options = ['Take photo', 'Choose from library'];
  if (hasLogo) options.push('Remove logo');
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Your logo',
        options: [...options, 'Cancel'],
        cancelButtonIndex: options.length,
        destructiveButtonIndex: hasLogo ? 2 : undefined,
      },
      done
    );
    return;
  }
  Alert.alert('Your logo', undefined, [
    ...options.map((text, i) => ({
      text,
      style: (i === 2 ? 'destructive' : 'default') as 'destructive' | 'default',
      onPress: () => done(i),
    })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}

/** The logo tile: an empty dashed square with a camera badge, or the
 *  picked logo with an edit badge. Tapping offers camera or library. */
export function LogoTile({
  logo,
  onChange,
  t,
}: {
  logo: string | null;
  onChange: (uri: string | null) => void;
  t: PageTheme;
}) {
  const open = () =>
    askSource(!!logo, async (i) => {
      if (i === 2) return onChange(null);
      if (i > 1) return;
      const uri = await pickFrom(i === 0 ? 'camera' : 'library');
      if (uri) onChange(uri);
    });
  return (
    <View style={s.row}>
      <PressableScale
        onPress={open}
        accessibilityLabel={logo ? 'Change logo' : 'Add logo'}
        style={[
          s.tile,
          logo ? s.tileFilled : s.tileEmpty,
          {
            borderColor: logo ? t.chipEdge : t.outline,
            backgroundColor: t.chip,
          },
        ]}
      >
        {logo ? (
          <Image source={{ uri: logo }} contentFit="cover" style={s.img} />
        ) : (
          <Ionicons name="image-outline" size={24} color={t.muted} />
        )}
        <View style={[s.badge, { borderColor: t.panel }]}>
          <Ionicons name={logo ? 'pencil' : 'camera'} size={12} color="#FFF" />
        </View>
      </PressableScale>
      <View style={s.text}>
        <Text style={[s.label, { color: t.ink }]}>
          Logo <Text style={[s.optional, { color: t.muted }]}>optional</Text>
        </Text>
        <Text style={[s.hint, { color: t.muted }]}>
          {logo
            ? 'Looks good. Tap to change or remove it.'
            : 'Snap it or pick one. It goes in the header, footer and icon.'}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tile: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileEmpty: { borderWidth: 1.5, borderStyle: 'dashed' },
  tileFilled: { borderWidth: 1 },
  img: { width: '100%', height: '100%', borderRadius: 19 },
  badge: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 3 },
  label: { fontFamily: F.sans700, fontSize: 14.5 },
  optional: { fontFamily: F.sans500, fontSize: 12.5 },
  hint: { fontFamily: F.sans400, fontSize: 12.5, lineHeight: 17 },
});

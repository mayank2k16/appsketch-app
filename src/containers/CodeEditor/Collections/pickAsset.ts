import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

/** Where the bytes come from. The web CMS has exactly one source (a file
 * input); a phone has three, and only offering the photo library means the
 * common case — "shoot the product, put it in the CMS" — takes a detour
 * through the camera app and back. */
export type AssetSource = 'camera' | 'library' | 'files';

export type PickedAsset = { uri: string; name: string; type: string };

/** Mirrors `_ASSET_EXT` in `builder/agent/coder/visual_edit.py` — the upload
 * endpoint rejects anything else, so the OS picker should not offer it. */
const ACCEPTED_MIME = ['image/*', 'video/*'];

function nameFor(uri: string, fallbackExt: string): string {
  const tail = uri.split('/').pop() || '';
  return tail.includes('.') ? tail : `upload-${Date.now()}.${fallbackExt}`;
}

/**
 * Ask the OS for one asset. Resolves to `null` when the user cancels, and
 * THROWS with a human sentence when permission is refused — the caller shows
 * it, because "nothing happened" is the worst possible answer to a tap.
 */
export async function pickAsset(
  source: AssetSource
): Promise<PickedAsset | null> {
  if (source === 'files') {
    const res = await DocumentPicker.getDocumentAsync({
      type: ACCEPTED_MIME,
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets?.[0]) return null;
    const a = res.assets[0];
    return {
      uri: a.uri,
      name: a.name || nameFor(a.uri, 'jpg'),
      type: a.mimeType || 'application/octet-stream',
    };
  }

  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      throw new Error(
        'Camera access is off for AppSketch — turn it on in Settings to shoot a photo here.'
      );
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.[0]) return null;
    const a = res.assets[0];
    return {
      uri: a.uri,
      name: a.fileName || nameFor(a.uri, 'jpg'),
      type: a.mimeType || 'image/jpeg',
    };
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error(
      'Photo access is off for AppSketch — turn it on in Settings to pick from your library.'
    );
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    quality: 0.8,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  return {
    uri: a.uri,
    name: a.fileName || nameFor(a.uri, 'jpg'),
    type: a.mimeType || 'image/jpeg',
  };
}

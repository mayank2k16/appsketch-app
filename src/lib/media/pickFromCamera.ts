import * as ImagePicker from 'expo-image-picker';

import { toast } from '@/lib/toast';

/**
 * Opens the camera directly when permission is already granted; asks first
 * when it isn't (`requestCameraPermissionsAsync` no-ops to an instant grant
 * on repeat calls, so this one call covers both cases). Resolves to a local
 * file uri, or `null` if the user cancels, has no camera, or refuses access.
 */
export async function pickImageFromCamera(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    toast.error(
      'Camera access is off for AppSketch — turn it on in Settings to take a photo.'
    );
    return null;
  }
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: 'images',
    quality: 0.8,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  return res.assets[0].uri;
}

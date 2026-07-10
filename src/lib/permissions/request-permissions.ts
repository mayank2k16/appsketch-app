import * as Camera from 'expo-camera';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type {
  PermissionStatus,
  RequestPermissionsResult,
} from './index';

function mapExpoStatus(
  status: string | null | undefined
): PermissionStatus {
  if (!status) return 'undetermined';
  switch (status) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'denied';
    case 'undetermined':
      return 'undetermined';
    case 'blocked':
      return 'blocked';
    default:
      return 'undetermined';
  }
}

/**
 * Request location permission (foreground).
 * Handles: granted, denied, undetermined, blocked (iOS: can't ask again).
 */
async function requestLocation(): Promise<PermissionStatus> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return mapExpoStatus(status);
  } catch {
    return 'denied';
  }
}

/**
 * Request camera permission.
 */
async function requestCamera(): Promise<PermissionStatus> {
  try {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return mapExpoStatus(status);
  } catch {
    return 'denied';
  }
}

/**
 * Request notification permission.
 * On Android 13+, runtime permission required.
 * On iOS, returns existing status if already asked.
 */
async function requestNotifications(): Promise<PermissionStatus> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();

    if (existing === 'granted') {
      return 'granted';
    }

    if (existing === 'denied') {
      if (Platform.OS === 'ios') {
        return 'blocked';
      }
      return 'denied';
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return mapExpoStatus(status);
  } catch {
    return 'denied';
  }
}

/**
 * Request all permissions in parallel on app start.
 * Each permission is requested independently; failures don't block others.
 */
export async function requestAllPermissions(): Promise<RequestPermissionsResult> {
  const [location, camera, notifications] = await Promise.all([
    requestLocation(),
    requestCamera(),
    requestNotifications(),
  ]);

  return { location, camera, notifications };
}

/**
 * Centralized app permissions: location, camera, notifications.
 * Handles all permission states (granted, denied, undetermined, blocked).
 */

export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'blocked';

export type PermissionsState = {
  location: PermissionStatus;
  camera: PermissionStatus;
  notifications: PermissionStatus;
};

export type RequestPermissionsResult = {
  location: PermissionStatus;
  camera: PermissionStatus;
  notifications: PermissionStatus;
};

export { requestAllPermissions } from './request-permissions';

# Permissions & Push Notifications Setup

## Overview

The app automatically requests the following permissions on startup:

- **Location** (foreground) – for nearby stores and delivery
- **Camera** – for barcode scanning and product photos
- **Notifications** – for order updates and offers

Permission states (granted, denied, undetermined, blocked) are handled automatically. If the user denies, the app continues normally; you can prompt again later from settings screens.

## Push Notifications (Firebase / Expo)

Notifications use **Expo Push Notifications**, which work with **Firebase Cloud Messaging (FCM)** on Android.

### 1. Install dependencies

```bash
pnpm add expo-location expo-camera expo-notifications expo-device
```

Then run `npx expo prebuild` to regenerate native projects.

### 2. Firebase setup for Android

1. Create a [Firebase project](https://console.firebase.google.com/)
2. Add an Android app with your package ID (e.g. `com.obytes.development`)
3. Download `google-services.json` and place it in the project root
4. In `app.config.ts`, uncomment:
   ```ts
   googleServicesFile: './google-services.json',
   ```

### 3. FCM credentials for EAS

1. In Firebase Console → Project Settings → Service Accounts
2. Create a service account key (JSON) for FCM HTTP v1
3. Run: `eas credentials`
4. Select Android → production → Google Service Account
5. Upload the JSON key

### 4. Deep linking from notifications

When sending a push notification, include a `route` or `screen` in the data payload:

```json
{
  "data": {
    "route": "cart"
  }
}
```

Supported routes: `home`, `storefront`, `cart`, `wishlist`, `explore`, `profile`, `orders`, `order-success`, `categories`, `login`, `product` (use `id` for product ID).

Example for a product:

```json
{
  "data": {
    "route": "product",
    "id": "123"
  }
}
```

### 5. Sending notifications

- **Expo Push API**: Use the Expo Push Token (logged in dev) with [Expo’s push API](https://docs.expo.dev/push-notifications/sending-notifications/)
- **Firebase Console**: Create a Cloud Messaging campaign and target devices by FCM token

## Push token

The Expo Push Token is obtained on startup. In development, it’s logged. To send it to your backend:

```ts
import { getExpoPushToken } from '@/lib/notifications';

const token = await getExpoPushToken();
if (token) {
  await api.post('/users/me/push-token', { token });
}
```

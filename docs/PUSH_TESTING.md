# Push notifications (parent app)

## What is implemented

- **Permissions**: `expo-notifications` requests notification permission when obtaining an Expo push token (`getExpoPushTokenOrNull` in `lib/pushNotifications.ts`). Android uses channel `default` (“School updates”).
- **Registration**: After login, the app POSTs to `/api/v1/parents/device` with `Authorization: Bearer <JWT>` (same as other parent calls). Token refresh uses `addPushTokenListener` → new Expo token → same endpoint. **401** clears push registration state (`pushRegistered`) without logging you out.
- **Foreground**: In-app toast + inbox refresh via `GET /api/v1/parents/notifications`.
- **Background / quit**: Notification tap runs navigation from `data.type` (`driver_trip_start`, `driver_assigned`, `trip_start_reminder`, `bus_approaching` → **Track** tab; unknown → **Alerts**).

## Expo Go vs development / production builds

| Environment | Remote Expo push token | Notes |
|-------------|------------------------|--------|
| **Expo Go** | Not supported (SDK 53+ may throw when loading native push APIs). | Use the in-app **Alerts** list from the API; enable push from **Profile → Push notifications** after installing a dev build. |
| **Development build** (`expo run:ios` / `run:android` or EAS `development`) | Supported on a **physical device**. | Set `EXPO_PUBLIC_API_URL` to your machine’s LAN IP when testing on a phone. |
| **Preview / production (EAS)** | Supported. | Configure EAS credentials and ensure `extra.eas.projectId` matches your Expo project (see `app.config.js`). |

## Manual checks

1. Sign in as a parent; confirm device row appears (or updates) server-side for your Expo push token.
2. Trigger a backend event that sends push (trip/driver/bus ETA). Confirm lock-screen/system notification and that **Alerts** list updates when the app is open.
3. Tap the notification from background or quit state: app should open on **Track** or **Alerts** per `data.type`.

## Server requirements

- Backend must accept `POST /api/v1/parents/device` with parent JWT and persist `expoPushToken`.
- Expo push from the server uses `EXPO_ACCESS_TOKEN` if set (see backend `expoPush.service.ts`).

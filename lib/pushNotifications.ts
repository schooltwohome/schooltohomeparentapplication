import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";

/**
 * Remote push via `expo-notifications` is not available in Expo Go (SDK 53+ on Android
 * throws on load). Use a dev build / production app for push; in-app notification list
 * still works via the API.
 */
export function canLoadExpoNotifications(): boolean {
  return Constants.appOwnership !== "expo";
}

function resolveProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  return (
    extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig
      ?.projectId
  );
}

async function loadNotificationsModule(): Promise<
  typeof import("expo-notifications") | null
> {
  if (!canLoadExpoNotifications()) {
    return null;
  }
  try {
    return await import("expo-notifications");
  } catch {
    return null;
  }
}

/**
 * Requests permission and returns an Expo push token, or null if unavailable.
 * Returns null in Expo Go (use a development build for real push tokens).
 */
export async function getExpoPushTokenOrNull(): Promise<string | null> {
  if (!canLoadExpoNotifications()) {
    return null;
  }
  if (!Device.isDevice) {
    return null;
  }

  const Notifications = await loadNotificationsModule();
  if (!Notifications) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "School updates",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0F172A",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  const projectId = resolveProjectId();
  try {
    const tokenRes = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    return tokenRes.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Refreshes the in-app notification list when a push arrives (foreground).
 * No-op in Expo Go.
 */
export type PushPermissionStatus =
  | "granted"
  | "denied"
  | "undetermined"
  | "unavailable";

/** Current OS permission for alerts (does not prompt). Expo Go → unavailable. */
export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  if (!canLoadExpoNotifications()) return "unavailable";
  const Notifications = await loadNotificationsModule();
  if (!Notifications) return "unavailable";
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

/** Prompts the system permission dialog when possible. */
export async function requestPushPermissionFromUser(): Promise<boolean> {
  if (!canLoadExpoNotifications()) return false;
  const Notifications = await loadNotificationsModule();
  if (!Notifications) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export function subscribeToForegroundNotifications(
  onNotification: () => void
): () => void {
  if (!canLoadExpoNotifications()) {
    return () => {};
  }

  let cancelled = false;
  let removeListener: (() => void) | undefined;

  void (async () => {
    const Notifications = await loadNotificationsModule();
    if (!Notifications || cancelled) return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const sub = Notifications.addNotificationReceivedListener(() => {
      if (!cancelled) onNotification();
    });
    if (cancelled) {
      sub.remove();
      return;
    }
    removeListener = () => sub.remove();
  })();

  return () => {
    cancelled = true;
    removeListener?.();
  };
}

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchNotifications,
  registerPushDeviceThunk,
  setPendingPushNavigation,
} from "../store/slices/notificationsSlice";
import { targetFromPushData } from "../lib/pushNavigation";
import {
  canLoadExpoNotifications,
  getExpoPushTokenOrNull,
  subscribeToExpoPushTokenRefreshes,
  subscribeToForegroundPush,
} from "../lib/pushNotifications";
import { store } from "../store/store";

type ToastState = {
  title: string;
  body: string;
  data: Record<string, unknown>;
};

/**
 * Push permission + token registration, foreground toast, notification open → navigation,
 * and OS token rotation. Loads `expo-notifications` dynamically so Expo Go stays usable.
 */
export default function PushNotificationRoot() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const authToken = useAppSelector((s) => s.auth.token);
  const pushRegistered = useAppSelector((s) => s.notifications.pushRegistered);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledNotificationIds = useRef(new Set<string>());

  const clearToastTimer = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  };

  const showToast = useCallback((payload: ToastState) => {
    clearToastTimer();
    setToast(payload);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4500);
  }, []);

  const applyOpenedNotification = useCallback(
    (data: Record<string, unknown> | undefined) => {
      const nav = targetFromPushData(data);
      dispatch(setPendingPushNavigation(nav));
      if (authToken) {
        router.replace("/home");
      }
    },
    [authToken, dispatch, router]
  );

  const handleNotificationOpened = useCallback(
    (identifier: string, data: Record<string, unknown> | undefined) => {
      if (handledNotificationIds.current.has(identifier)) return;
      handledNotificationIds.current.add(identifier);
      if (handledNotificationIds.current.size > 50) {
        handledNotificationIds.current.clear();
      }
      applyOpenedNotification(data);
    },
    [applyOpenedNotification]
  );

  /** Session present and not yet marked registered: obtain Expo token and POST /parents/device */
  useEffect(() => {
    if (!authToken || pushRegistered) return;
    let cancelled = false;
    void (async () => {
      const expoToken = await getExpoPushTokenOrNull();
      if (cancelled || !expoToken) return;
      await dispatch(registerPushDeviceThunk(expoToken));
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken, pushRegistered, dispatch]);

  /** Native push token rotation → new Expo token → backend. */
  useEffect(() => {
    if (!authToken) return () => {};
    return subscribeToExpoPushTokenRefreshes((expoPushToken) => {
      void dispatch(registerPushDeviceThunk(expoPushToken));
    });
  }, [authToken, dispatch]);

  /** Foreground: sync inbox + toast (tap uses payload `data` for routing). */
  useEffect(() => {
    return subscribeToForegroundPush({
      onListRefresh: () => {
        store.dispatch(fetchNotifications());
      },
      onForeground: ({ title, body, data }) => {
        if (!title && !body) return;
        showToast({
          title: title || "School update",
          body: body || "",
          data,
        });
      },
    });
  }, [showToast]);

  /** Cold start + background tap: navigate from `data.type`. */
  useEffect(() => {
    if (!canLoadExpoNotifications()) return () => {};

    let cancelled = false;
    let removeOpened: (() => void) | undefined;

    void (async () => {
      const Notifications = await import("expo-notifications");
      if (cancelled) return;

      const last = await Notifications.getLastNotificationResponseAsync();
      if (last?.notification) {
        handleNotificationOpened(
          last.notification.request.identifier,
          last.notification.request.content.data as Record<string, unknown>
        );
      }

      const sub = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          handleNotificationOpened(
            response.notification.request.identifier,
            response.notification.request.content.data as Record<string, unknown>
          );
        }
      );
      removeOpened = () => sub.remove();
    })();

    return () => {
      cancelled = true;
      removeOpened?.();
    };
  }, [handleNotificationOpened]);

  const onToastPress = useCallback(() => {
    clearToastTimer();
    if (toast) {
      dispatch(setPendingPushNavigation(targetFromPushData(toast.data)));
      if (authToken) router.replace("/home");
    }
    setToast(null);
  }, [authToken, dispatch, router, toast]);

  if (!toast) return null;

  return (
    <View style={styles.toastWrap} pointerEvents="box-none">
      <Pressable
        onPress={onToastPress}
        style={({ pressed }) => [
          styles.toastInner,
          pressed && styles.toastPressed,
        ]}
      >
        <Text style={styles.toastTitle} numberOfLines={2}>
          {toast.title}
        </Text>
        {toast.body ? (
          <Text style={styles.toastBody} numberOfLines={3}>
            {toast.body}
          </Text>
        ) : null}
        <Text style={styles.toastHint}>Tap to open</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toastWrap: {
    position: "absolute",
    top: 52,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 20,
  },
  toastInner: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  toastPressed: {
    opacity: 0.92,
  },
  toastTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
  },
  toastBody: {
    color: "#E2E8F0",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  toastHint: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 8,
  },
});

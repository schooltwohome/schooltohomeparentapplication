import React, { useCallback } from "react";
import { View, StyleSheet, ScrollView, Text, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import AlertsHeader from "./AlertsHeader";
import NotificationItem from "./NotificationItem";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchNotifications,
  markNotificationReadThunk,
  markAllNotificationsReadThunk,
} from "../../../store/slices/notificationsSlice";

export default function AlertsScreen() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const notifications = useAppSelector((s) => s.notifications.items);
  const loading = useAppSelector((s) => s.notifications.loading);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        dispatch(fetchNotifications());
      }
    }, [token, dispatch])
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    if (!unreadCount) return;
    await dispatch(markAllNotificationsReadThunk());
  };

  const handleNotificationPress = (id: string) => {
    dispatch(markNotificationReadThunk(id));
  };

  return (
    <View style={styles.container}>
      <AlertsHeader
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
      />

      {loading && notifications.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <Text style={styles.empty}>
              No notifications yet. When your school sends updates, they will
              appear here and as push alerts (if enabled).
            </Text>
          ) : (
            notifications.map((item) => (
              <NotificationItem
                key={item.id}
                id={item.id}
                title={item.title}
                message={item.message}
                time={item.time}
                type={item.type}
                isRead={item.isRead}
                onPress={() => handleNotificationPress(item.id)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 120,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 22,
    textAlign: "center",
    marginTop: 32,
    paddingHorizontal: 16,
  },
});

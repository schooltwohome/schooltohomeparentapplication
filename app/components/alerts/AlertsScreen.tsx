import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "expo-router";
import AlertsHeader from "./AlertsHeader";
import NotificationItem from "./NotificationItem";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchNotifications,
  markNotificationReadThunk,
  markAllNotificationsReadThunk,
} from "../../../store/slices/notificationsSlice";
import {
  notificationCategory,
  type NotificationCategoryFilter,
} from "../../../lib/notificationUi";

export default function AlertsScreen() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const notifications = useAppSelector((s) => s.notifications.items);
  const loading = useAppSelector((s) => s.notifications.loading);
  const [categoryFilter, setCategoryFilter] =
    useState<NotificationCategoryFilter>("all");

  const filteredNotifications = useMemo(() => {
    if (categoryFilter === "all") return notifications;
    return notifications.filter((n) => {
      const cat = notificationCategory(n.eventType, n.title, n.message);
      if (cat === "other") return categoryFilter === "all";
      return cat === categoryFilter;
    });
  }, [notifications, categoryFilter]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        dispatch(fetchNotifications());
      }
    }, [token, dispatch])
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const FILTER_CHIPS: {
    id: NotificationCategoryFilter;
    label: string;
  }[] = [
    { id: "all", label: "All" },
    { id: "trip", label: "Trip" },
    { id: "attendance", label: "Present" },
    { id: "stops", label: "Stops" },
  ];

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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterScrollContent}
      >
        {FILTER_CHIPS.map((chip) => {
          const selected = categoryFilter === chip.id;
          return (
            <TouchableOpacity
              key={chip.id}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
              onPress={() => setCategoryFilter(chip.id)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                style={[styles.filterChipText, selected && styles.filterChipTextSelected]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
          ) : filteredNotifications.length === 0 ? (
            <Text style={styles.empty}>
              No notifications in this category. Try another filter or “All”.
            </Text>
          ) : (
            filteredNotifications.map((item) => (
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
  filterScroll: {
    maxHeight: 44,
    marginBottom: 4,
  },
  filterScrollContent: {
    paddingHorizontal: 24,
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  filterChipTextSelected: {
    color: "#4F46E5",
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

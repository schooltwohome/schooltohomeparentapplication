import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Bell } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setPendingPushNavigation } from "../../../store/slices/notificationsSlice";

interface HomeHeaderProps {
  greeting: string;
  userName: string;
  hasLiveTripFromTracking: boolean;
}

export default function HomeHeader({
  greeting,
  userName,
  hasLiveTripFromTracking: _hasLiveTripFromTracking,
}: HomeHeaderProps) {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.notifications.items);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.isRead).length,
    [items]
  );

  const displayCount = unreadCount > 9 ? "9+" : unreadCount.toString();

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.subGreeting}>{userName}</Text>
      </View>
      <TouchableOpacity
        style={styles.notificationBtn}
        onPress={() => {
          // Open the full notifications history screen from the bell.
          dispatch(setPendingPushNavigation({ tab: "alerts" }));
        }}
      >
        <Bell size={24} color="#0F172A" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{displayCount}</Text>
          </View>
        )}
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  subGreeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 4,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
});

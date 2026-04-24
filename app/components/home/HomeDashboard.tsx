import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import BusStatusCard from "./BusStatusCard";
import ChildStatusCard from "./ChildStatusCard";
import ActivityTimeline from "./ActivityTimeline";
import { useAppSelector } from "../../../store/hooks";
import {
  inferActivityType,
  isStaleTripStartNotification,
} from "../../../lib/notificationUi";

type Props = {
  onOpenTrack?: () => void;
  /** From parent tracking snapshot — hides stale “trip starting” when no active trip. */
  hasLiveTripFromTracking: boolean;
};

export default function HomeDashboard({
  onOpenTrack,
  hasLiveTripFromTracking,
}: Props) {
  const children = useAppSelector((s) => s.auth.children);
  const notificationItems = useAppSelector((s) => s.notifications.items);
  const loading = useAppSelector((s) => s.notifications.loading);

  const homeCardNotification = useMemo(() => {
    for (const n of notificationItems) {
      if (isStaleTripStartNotification(n.title, hasLiveTripFromTracking))
        continue;
      return n;
    }
    return null;
  }, [notificationItems, hasLiveTripFromTracking]);

  const activities = useMemo(() => {
    return notificationItems
      .filter(
        (n) => !isStaleTripStartNotification(n.title, hasLiveTripFromTracking)
      )
      .slice(0, 10)
      .map((n) => ({
        id: n.id,
        title: n.title,
        time: n.time,
        type: inferActivityType(n.title, n.message),
        description: n.message,
      }));
  }, [notificationItems, hasLiveTripFromTracking]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {homeCardNotification ? (
        <BusStatusCard
          route={homeCardNotification.title}
          distance={
            homeCardNotification.message.length > 100
              ? `${homeCardNotification.message.slice(0, 100)}…`
              : homeCardNotification.message
          }
          eta={homeCardNotification.time}
          onTrackPress={onOpenTrack}
        />
      ) : (
        <View style={styles.noBusCard}>
          <Text style={styles.noBusTitle}>
            {loading
              ? "Loading updates…"
              : notificationItems.length > 0
                ? "No active bus trip"
                : "No notifications yet"}
          </Text>
          <Text style={styles.noBusSub}>
            {notificationItems.length > 0
              ? "When a driver starts a trip for your route, live updates will appear here again."
              : "When your school sends alerts (bus ETA, delays, arrivals), they will show here."}
          </Text>
        </View>
      )}

      {children.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No linked children yet</Text>
          <Text style={styles.emptySub}>
            When your school links students to your account, they will appear here.
          </Text>
        </View>
      ) : (
        children.map((c) => (
          <ChildStatusCard
            key={c.id}
            name={c.name}
            className={c.grade ? `Grade ${c.grade}` : "—"}
            isOnBus={false}
          />
        ))
      )}

      <ActivityTimeline activities={activities} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  noBusCard: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  noBusTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  noBusSub: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  emptyBox: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
});

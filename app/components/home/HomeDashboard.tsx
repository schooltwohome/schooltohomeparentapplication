import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import BusStatusCard from "./BusStatusCard";
import ChildStatusCard from "./ChildStatusCard";
import ActivityTimeline from "./ActivityTimeline";
import { useAppSelector } from "../../../store/hooks";
import { inferActivityType } from "../../../lib/notificationUi";

type Props = {
  onOpenTrack?: () => void;
};

export default function HomeDashboard({ onOpenTrack }: Props) {
  const children = useAppSelector((s) => s.auth.children);
  const notificationItems = useAppSelector((s) => s.notifications.items);
  const loading = useAppSelector((s) => s.notifications.loading);

  const latest = notificationItems[0];

  const activities = useMemo(() => {
    return notificationItems.slice(0, 10).map((n) => ({
      id: n.id,
      title: n.title,
      time: n.time,
      type: inferActivityType(n.title, n.message),
      description: n.message,
    }));
  }, [notificationItems]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {latest ? (
        <BusStatusCard
          route={latest.title}
          distance={
            latest.message.length > 100
              ? `${latest.message.slice(0, 100)}…`
              : latest.message
          }
          eta={latest.time}
          onTrackPress={onOpenTrack}
        />
      ) : (
        <View style={styles.noBusCard}>
          <Text style={styles.noBusTitle}>
            {loading ? "Loading updates…" : "No notifications yet"}
          </Text>
          <Text style={styles.noBusSub}>
            When your school sends alerts (bus ETA, delays, arrivals), they will
            show here.
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

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Activity, Clock, Navigation, Users } from "lucide-react-native";
import type { TrackingSegment } from "../../../../services/parentApi";

function formatStatus(segment: TrackingSegment | null): string {
  const s = segment?.tripStatus;
  if (!s) return "—";
  if (s === "on_going") return "En route";
  if (s === "scheduled") return "Scheduled";
  if (s === "completed") return "Done";
  if (s === "cancelled") return "Off";
  return s.replace(/_/g, " ");
}

type Props = {
  segment: TrackingSegment | null;
  linkedChildrenCount: number;
};

export default function RideStatsRow({ segment, linkedChildrenCount }: Props) {
  const dist =
    segment?.distanceToPickupKm != null
      ? segment.distanceToPickupKm.toFixed(1)
      : "—";
  const eta =
    segment?.etaMinutes != null && segment.etaMinutes > 0
      ? String(segment.etaMinutes)
      : "—";
  const speed =
    segment?.speedKmh != null && segment.speedKmh > 0
      ? `${Math.round(segment.speedKmh)}`
      : "—";

  return (
    <View style={styles.container}>
      <View style={styles.statBox}>
        <Activity size={20} color="#10B981" />
        <Text style={styles.statValue} numberOfLines={2}>
          {formatStatus(segment)}
        </Text>
        <Text style={styles.statLabel}>Trip</Text>
      </View>

      <View style={styles.statBox}>
        <Navigation size={20} color="#64748B" />
        <Text style={styles.statValue}>{dist}</Text>
        <Text style={styles.statLabel}>km to stop</Text>
        {speed !== "—" ? (
          <Text style={styles.micro}>{speed} km/h</Text>
        ) : null}
      </View>

      <View style={styles.statBox}>
        <Clock size={20} color="#F59E0B" />
        <Text style={styles.statValue}>{eta}</Text>
        <Text style={styles.statLabel}>min ETA</Text>
      </View>

      <View style={styles.statBox}>
        <Users size={20} color="#8B5CF6" />
        <Text style={styles.statValue}>
          {linkedChildrenCount > 0 ? String(linkedChildrenCount) : "—"}
        </Text>
        <Text style={styles.statLabel}>linked</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 8,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    textAlign: "center",
  },
  micro: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 4,
  },
});

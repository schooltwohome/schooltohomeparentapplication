import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Activity, Clock, Navigation, Users } from "lucide-react-native";
import type { TrackingSegment } from "../../../../services/parentApi";
import { normalizeTripStatus } from "../../../../types/tracking";

function formatStatus(segment: TrackingSegment | null): string {
  if (!segment) return "—";
  if (segment.hasReachedPickup) return "Arrived";
  const status = normalizeTripStatus(segment.tripStatus);
  if (status === "started") return "En route";
  if (status === "returning") return "Returning";
  if (status === "reached_school") return "At school";
  if (status === "completed") return "Completed";
  return "Not started";
}

type Props = {
  segment: TrackingSegment | null;
};

export default function RideStatsRow({ segment }: Props) {
  const status = formatStatus(segment);
  const hasArrived =
    segment?.hasReachedPickup === true ||
    (typeof segment?.distanceToPickupKm === "number" && segment.distanceToPickupKm <= 0.05);

  const distValue = hasArrived
    ? "0.0"
    : segment?.distanceToPickupKm != null && Number.isFinite(segment.distanceToPickupKm)
      ? segment.distanceToPickupKm.toFixed(1)
      : "—";
  const etaValue = hasArrived
    ? "Arrived"
    : segment?.etaMinutes != null && Number.isFinite(segment.etaMinutes) && segment.etaMinutes >= 0
      ? String(segment.etaMinutes)
      : "—";
  const speedValue =
    segment?.speedKmh != null && Number.isFinite(segment.speedKmh)
      ? `${Math.max(0, Math.round(segment.speedKmh))}`
      : "—";

  return (
    <View style={styles.container}>
      <View style={styles.statBox}>
        <Activity size={20} color="#10B981" />
        <Text style={styles.statValue} numberOfLines={2}>
          {status}
        </Text>
        <Text style={styles.statLabel}>Trip</Text>
      </View>

      <View style={styles.statBox}>
        <Navigation size={20} color="#64748B" />
        <Text style={styles.statValue}>{distValue}</Text>
        <Text style={styles.statLabel}>km to stop</Text>
      </View>

      <View style={styles.statBox}>
        <Clock size={20} color="#F59E0B" />
        <Text style={styles.statValue}>{etaValue}</Text>
        <Text style={styles.statLabel}>{etaValue === "Arrived" ? "Status" : "min ETA"}</Text>
      </View>

      <View style={styles.statBox}>
        <Users size={20} color="#8B5CF6" />
        <Text style={styles.statValue}>
          {speedValue === "—" ? "—" : `${speedValue} km/h`}
        </Text>
        <Text style={styles.statLabel}>Speed</Text>
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
});

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MapPin } from "lucide-react-native";
import type { TrackingSegment } from "../../../../services/parentApi";

type Props = { segment: TrackingSegment | null };

export default function UpcomingStops({ segment }: Props) {
  const stops = useMemo(() => {
    const list = segment?.routeStops ?? [];
    const pickupName = segment?.pickupStop?.name?.trim();
    return list.map((s) => ({
      id: s.id,
      name: s.stopName,
      isPickup: pickupName ? s.stopName === pickupName : false,
    }));
  }, [segment]);

  if (!stops.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Route stops</Text>
        <Text style={styles.empty}>
          No ordered stops returned for this route. Your school may still be configuring
          the route.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Route stops</Text>
      {segment?.studentName ? (
        <Text style={styles.sub}>
          Showing order for {segment.studentName}
          {segment.pickupStop ? ` · Your stop: ${segment.pickupStop.name}` : ""}
        </Text>
      ) : null}

      <View style={styles.timelineContainer}>
        {stops.map((stop, index) => {
          const isLast = index === stops.length - 1;
          const highlight = stop.isPickup;
          return (
            <View key={stop.id} style={styles.stopRow}>
              <View style={styles.graphicColumn}>
                <View style={[styles.dot, highlight && styles.dotNext]}>
                  {highlight ? <View style={styles.innerDot} /> : null}
                </View>
                {!isLast ? <View style={styles.line} /> : null}
              </View>

              <View style={styles.infoColumn}>
                <View style={styles.titleRow}>
                  <Text
                    style={[styles.stopName, highlight && styles.stopNameHighlight]}
                  >
                    {stop.name}
                  </Text>
                  {highlight ? (
                    <View style={styles.nextBadge}>
                      <Text style={styles.nextBadgeText}>Your stop</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.orderLabel}>Order #{index + 1}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
    lineHeight: 18,
  },
  empty: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  stopRow: {
    flexDirection: "row",
    minHeight: 56,
  },
  graphicColumn: {
    alignItems: "center",
    width: 24,
    marginRight: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  dotNext: {
    backgroundColor: "#3B82F6",
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: 2,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },
  infoColumn: {
    flex: 1,
    paddingBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  stopName: {
    fontSize: 16,
    color: "#475569",
    fontWeight: "500",
    flex: 1,
  },
  stopNameHighlight: {
    fontWeight: "700",
    color: "#1E293B",
  },
  nextBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  nextBadgeText: {
    fontSize: 10,
    color: "#2563EB",
    fontWeight: "700",
  },
  orderLabel: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
  },
});

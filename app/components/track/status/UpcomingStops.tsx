import React, { useMemo } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import type { TrackingSegment } from "../../../../services/parentApi";

type Props = { segment: TrackingSegment | null };
type StopVisualState = "PASSED" | "NEXT" | "AHEAD";

export default function UpcomingStops({ segment }: Props) {
  const stops = useMemo(() => {
    const list = [...(segment?.routeStops ?? [])].sort((a, b) => a.stopOrder - b.stopOrder);
    const pickupName = segment?.pickupStop?.name?.trim();
    const pickupId = segment?.pickupStopId?.trim();
    const completedStopIds = new Set(segment?.completedStopIds ?? []);
    return list.map((s, index) => {
      const isParentStop = pickupId
        ? s.id === pickupId
        : pickupName
          ? s.stopName === pickupName
          : false;
      const visualState: StopVisualState = completedStopIds.has(s.id)
        ? "PASSED"
        : isParentStop
          ? "NEXT"
          : "AHEAD";
      return {
        id: s.id,
        order: index + 1,
        name: s.stopName,
        isPickup: isParentStop,
        visualState,
      };
    });
  }, [segment]);

  const coveredConnectorIndex = useMemo(() => {
    if (!stops.length) return -1;
    const completedStopIds = new Set(segment?.completedStopIds ?? []);
    let maxCovered = -1;
    for (let i = 0; i < stops.length - 1; i += 1) {
      if (completedStopIds.has(stops[i + 1].id)) {
        maxCovered = i;
      }
    }
    const nextStopId = segment?.nextStopId;
    if (nextStopId) {
      const nextIdx = stops.findIndex((stop) => stop.id === nextStopId);
      if (nextIdx > 0) {
        maxCovered = Math.max(maxCovered, nextIdx - 1);
      }
    }
    return maxCovered;
  }, [segment, stops]);

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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stripContent}
      >
        {stops.map((stop, index) => {
          const isLast = index === stops.length - 1;
          const connectorCovered = index <= coveredConnectorIndex;
          const statusText = stop.visualState === "PASSED" ? "Passed" : stop.visualState === "NEXT" ? "Next" : "Ahead";
          return (
            <View key={stop.id} style={styles.stopItem}>
              <View style={styles.progressRow}>
                <View style={[styles.dot, stop.visualState === "PASSED" && styles.dotPassed, stop.visualState === "NEXT" && styles.dotNext, stop.visualState === "AHEAD" && styles.dotAhead]} />
                {!isLast ? (
                  <View
                    style={[
                      styles.connector,
                      connectorCovered ? styles.connectorCovered : styles.connectorRemaining,
                    ]}
                  />
                ) : null}
              </View>
              <Text style={styles.orderLabel}>#{stop.order}</Text>
              <Text style={styles.stopName} numberOfLines={1}>{stop.name}</Text>
              <Text style={styles.statusLabel}>{statusText}</Text>
              {stop.isPickup ? <Text style={styles.yourStopText}>Your stop</Text> : null}
            </View>
          );
        })}
      </ScrollView>
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
  stripContent: {
    paddingVertical: 6,
    paddingRight: 14,
  },
  stopItem: {
    width: 88,
    marginRight: 8,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 24,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  dotPassed: {
    backgroundColor: "#1A73E8",
    borderColor: "#1A73E8",
  },
  dotNext: {
    backgroundColor: "#FFFFFF",
    borderColor: "#1A73E8",
  },
  dotAhead: {
    backgroundColor: "#FFFFFF",
    borderColor: "#9E9E9E",
  },
  connector: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    marginLeft: 6,
    marginRight: 2,
  },
  connectorCovered: {
    backgroundColor: "#1A73E8",
  },
  connectorRemaining: {
    backgroundColor: "#BDBDBD",
  },
  stopName: {
    marginTop: 4,
    fontSize: 12,
    color: "#1E293B",
    fontWeight: "600",
  },
  orderLabel: {
    marginTop: 6,
    fontSize: 10,
    color: "#94A3B8",
  },
  statusLabel: {
    marginTop: 2,
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  yourStopText: {
    marginTop: 3,
    fontSize: 10,
    color: "#1A73E8",
    fontWeight: "700",
  },
});

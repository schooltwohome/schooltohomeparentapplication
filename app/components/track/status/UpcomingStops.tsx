import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MapPin } from "lucide-react-native";

interface Stop {
  id: string;
  name: string;
  time: string;
  isNext?: boolean;
}

const DUMMY_STOPS: Stop[] = [
  { id: "1", name: "Oak Street Stop", time: "8:12 AM", isNext: true },
  { id: "2", name: "Your Stop - Maple Ave", time: "8:18 AM" },
  { id: "3", name: "Pine Road Stop", time: "8:25 AM" },
];

export default function UpcomingStops() {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Upcoming Stops</Text>
      
      <View style={styles.timelineContainer}>
        {DUMMY_STOPS.map((stop, index) => {
          const isLast = index === DUMMY_STOPS.length - 1;
          return (
            <View key={stop.id} style={styles.stopRow}>
              {/* Timeline Graphic */}
              <View style={styles.graphicColumn}>
                <View style={[styles.dot, stop.isNext && styles.dotNext]}>
                  {stop.isNext && <View style={styles.innerDot} />}
                </View>
                {!isLast && <View style={styles.line} />}
              </View>

              {/* Stop Info */}
              <View style={styles.infoColumn}>
                <View style={styles.titleRow}>
                  <Text style={[styles.stopName, stop.isNext && styles.stopNamelight]}>
                    {stop.name}
                  </Text>
                  {stop.isNext && (
                    <View style={styles.nextBadge}>
                      <Text style={styles.nextBadgeText}>Next</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.stopTime}>{stop.time}</Text>
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
    marginBottom: 16,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  stopRow: {
    flexDirection: "row",
    minHeight: 60,
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
    paddingBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stopName: {
    fontSize: 16,
    color: "#475569",
    fontWeight: "500",
  },
  stopNamelight: {
    fontWeight: "700",
    color: "#1E293B",
  },
  nextBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  nextBadgeText: {
    fontSize: 10,
    color: "#2563EB",
    fontWeight: "700",
  },
  stopTime: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
  },
});

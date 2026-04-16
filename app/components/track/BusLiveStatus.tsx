import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Clock, Navigation } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BusLiveStatus() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Route 12 - Morning Trip</Text>
          <Text style={styles.subtitle}>En route to School</Text>
        </View>
        <View style={styles.etaContainer}>
          <Text style={styles.etaValue}>10</Text>
          <Text style={styles.etaUnit}>min</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Navigation size={20} color="#64748B" />
          <View style={styles.statTextContainer}>
             <Text style={styles.statLabel}>Next Stop</Text>
             <Text style={styles.statValue}>Stop #4</Text>
          </View>
        </View>
        
        <View style={styles.statItem}>
          <Clock size={20} color="#64748B" />
          <View style={styles.statTextContainer}>
             <Text style={styles.statLabel}>Speed</Text>
             <Text style={styles.statValue}>35 km/h</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  etaContainer: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: "center",
  },
  etaValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#16A34A",
  },
  etaUnit: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16A34A",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statTextContainer: {
    marginLeft: 12,
  },
  statLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
});

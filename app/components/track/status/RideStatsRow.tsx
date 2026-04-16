import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Activity, Clock, Navigation, Users } from "lucide-react-native";

export default function RideStatsRow() {
  return (
    <View style={styles.container}>
      <View style={styles.statBox}>
        <Activity size={20} color="#10B981" />
        <Text style={styles.statValue}>En Route</Text>
        <Text style={styles.statLabel}>Status</Text>
      </View>
      
      <View style={styles.statBox}>
        <Navigation size={20} color="#64748B" />
        <Text style={styles.statValue}>2.5</Text>
        <Text style={styles.statLabel}>km away</Text>
      </View>

      <View style={styles.statBox}>
        <Clock size={20} color="#F59E0B" />
        <Text style={styles.statValue}>8</Text>
        <Text style={styles.statLabel}>mins ETA</Text>
      </View>

      <View style={styles.statBox}>
        <Users size={20} color="#8B5CF6" />
        <Text style={styles.statValue}>25</Text>
        <Text style={styles.statLabel}>students</Text>
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
    fontSize: 15,
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

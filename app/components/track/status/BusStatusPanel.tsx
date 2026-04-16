import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DriverProfile from "./DriverProfile";
import RideStatsRow from "./RideStatsRow";
import UpcomingStops from "./UpcomingStops";

export default function BusStatusPanel() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Drag Indicator Handle */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <DriverProfile />
        <RideStatsRow />
        <UpcomingStops />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "45%", // Takes up almost half the screen
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
});

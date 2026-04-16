import React from "react";
import { View, StyleSheet } from "react-native";
import LiveMap from "./LiveMap";
import BusLiveStatus from "./BusLiveStatus";

export default function TrackScreen() {
  return (
    <View style={styles.container}>
      <LiveMap />
      <BusLiveStatus />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});

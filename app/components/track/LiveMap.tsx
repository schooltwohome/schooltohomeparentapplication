import React, { useMemo } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { TrackingSegment } from "../../../services/parentApi";

type Coord = { latitude: number; longitude: number };

function toMapsQuery(coord: Coord) {
  return `${coord.latitude},${coord.longitude}`;
}

async function openGoogleMapsSearch(coord: Coord, label?: string) {
  const query = encodeURIComponent(label ? `${label} (${toMapsQuery(coord)})` : toMapsQuery(coord));
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  await Linking.openURL(url);
}

async function openGoogleMapsDirections(from: Coord, to: Coord) {
  const origin = encodeURIComponent(toMapsQuery(from));
  const destination = encodeURIComponent(toMapsQuery(to));
  const travelmode = "driving";
  const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${travelmode}`;
  await Linking.openURL(url);
}

type Props = {
  segment: TrackingSegment | null;
  userLocation: Coord | null;
};

export default function LiveMap({ segment, userLocation }: Props) {
  const busCoord: Coord | null =
    segment?.latitude != null &&
    segment?.longitude != null &&
    Number.isFinite(segment.latitude) &&
    Number.isFinite(segment.longitude)
      ? { latitude: segment.latitude, longitude: segment.longitude }
      : null;

  const pickupCoord: Coord | null =
    segment?.pickupStop &&
    Number.isFinite(segment.pickupStop.latitude) &&
    Number.isFinite(segment.pickupStop.longitude)
      ? {
          latitude: segment.pickupStop.latitude,
          longitude: segment.pickupStop.longitude,
        }
      : null;

  const safeUserLocation: Coord | null =
    userLocation &&
    Number.isFinite(userLocation.latitude) &&
    Number.isFinite(userLocation.longitude)
      ? userLocation
      : null;

  const hasAnyPoint = !!(busCoord || pickupCoord || safeUserLocation);

  if (!hasAnyPoint) {
    return (
      <View style={[styles.container, styles.emptyWrap]}>
        <Text style={styles.emptyTitle}>No live position yet</Text>
        <Text style={styles.emptySub}>
          When the school assigns a route and the bus shares GPS, the map will show
          the bus and your child&apos;s stop here.
        </Text>
      </View>
    );
  }

  const primaryCoord = busCoord || pickupCoord || safeUserLocation;
  const primaryLabel = useMemo(() => {
    if (busCoord) return "School bus";
    if (pickupCoord) return segment?.pickupStop?.name ?? "Pickup stop";
    return "Your location";
  }, [busCoord, pickupCoord, segment?.pickupStop?.name]);

  return (
    <View style={[styles.container, styles.card]}>
      <Text style={styles.title}>Live map</Text>
      <Text style={styles.subTitle}>
        {Platform.OS === "android"
          ? "This opens Google Maps for live location and directions."
          : "This opens Maps for live location and directions."}
      </Text>

      {primaryCoord ? (
        <Pressable
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => openGoogleMapsSearch(primaryCoord, primaryLabel)}
        >
          <Text style={styles.btnPrimaryText}>Open {primaryLabel} in Google Maps</Text>
        </Pressable>
      ) : null}

      {safeUserLocation && pickupCoord ? (
        <Pressable style={styles.btn} onPress={() => openGoogleMapsDirections(safeUserLocation, pickupCoord)}>
          <Text style={styles.btnText}>Directions: You → Pickup stop</Text>
        </Pressable>
      ) : null}

      {safeUserLocation && busCoord ? (
        <Pressable style={styles.btn} onPress={() => openGoogleMapsDirections(safeUserLocation, busCoord)}>
          <Text style={styles.btnText}>Directions: You → Bus</Text>
        </Pressable>
      ) : null}

      {pickupCoord ? (
        <Pressable
          style={styles.btn}
          onPress={() => openGoogleMapsSearch(pickupCoord, segment?.pickupStop?.name ?? "Pickup stop")}
        >
          <Text style={styles.btnText}>Open pickup stop</Text>
        </Pressable>
      ) : null}

      {busCoord ? (
        <Pressable style={styles.btn} onPress={() => openGoogleMapsSearch(busCoord, "School bus")}>
          <Text style={styles.btnText}>Open bus location</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: "#EEF2FF",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  subTitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 14,
  },
  emptyWrap: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    backgroundColor: "#EEF2FF",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  btn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  btnText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 14,
  },
  btnPrimary: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  btnPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
});

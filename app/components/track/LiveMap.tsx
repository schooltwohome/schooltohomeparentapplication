import React, { useMemo } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import type { TrackingSegment } from "../../../services/parentApi";

type Coord = { latitude: number; longitude: number };

function buildRegion(points: Coord[]): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} {
  if (points.length === 0) {
    return {
      latitude: 20.5937,
      longitude: 78.9629,
      latitudeDelta: 8,
      longitudeDelta: 8,
    };
  }
  if (points.length === 1) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    };
  }
  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const midLat = (minLat + maxLat) / 2;
  const midLon = (minLon + maxLon) / 2;
  const latDelta = Math.max(0.04, (maxLat - minLat) * 2.2);
  const lonDelta = Math.max(0.04, (maxLon - minLon) * 2.2);
  return {
    latitude: midLat,
    longitude: midLon,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
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

  const region = useMemo(() => {
    const pts: Coord[] = [];
    if (busCoord) pts.push(busCoord);
    if (pickupCoord) pts.push(pickupCoord);
    if (userLocation) pts.push(userLocation);
    return buildRegion(pts);
  }, [busCoord, pickupCoord, userLocation]);

  const lineCoords = useMemo(() => {
    if (busCoord && pickupCoord) return [busCoord, pickupCoord];
    return [];
  }, [busCoord, pickupCoord]);

  const hasAnyPoint = !!(busCoord || pickupCoord || userLocation);

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

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={region}>
        {lineCoords.length === 2 ? (
          <Polyline
            coordinates={lineCoords}
            strokeColor="#3B82F6"
            strokeWidth={3}
          />
        ) : null}

        {pickupCoord ? (
          <Marker
            coordinate={pickupCoord}
            title={segment?.pickupStop?.name ?? "Pickup stop"}
            pinColor="#6366F1"
            tracksViewChanges={false}
          />
        ) : null}

        {busCoord ? (
          <Marker coordinate={busCoord} title="School bus" pinColor="#F59E0B" tracksViewChanges={false} />
        ) : null}

        {userLocation ? (
          <Marker coordinate={userLocation} title="You" pinColor="#0F172A" tracksViewChanges={false} />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  map: {
    width: "100%",
    height: "100%",
  },
});

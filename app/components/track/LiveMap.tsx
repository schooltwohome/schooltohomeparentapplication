import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import type { TrackingSegment } from "../../../services/parentApi";

type Coord = { latitude: number; longitude: number };

function isValidCoord(coord: Coord): boolean {
  return (
    Number.isFinite(coord.latitude) &&
    Number.isFinite(coord.longitude) &&
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180
  );
}

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
  const pickupStop = segment?.pickupStop ?? null;

  const busCoord = useMemo<Coord | null>(() => {
    if (segment?.latitude == null || segment?.longitude == null) return null;
    const candidate = {
      latitude: segment.latitude,
      longitude: segment.longitude,
    };
    return isValidCoord(candidate) ? candidate : null;
  }, [segment?.latitude, segment?.longitude]);

  const pickupCoord = useMemo<Coord | null>(() => {
    if (!pickupStop) return null;
    const candidate = {
      latitude: pickupStop.latitude,
      longitude: pickupStop.longitude,
    };
    return isValidCoord(candidate) ? candidate : null;
  }, [pickupStop, pickupStop?.latitude, pickupStop?.longitude]);

  const safeUserLocation = useMemo<Coord | null>(() => {
    if (!userLocation) return null;
    return isValidCoord(userLocation) ? userLocation : null;
  }, [userLocation]);
  const isArrivingNow =
    segment?.distanceToPickupKm != null && segment.distanceToPickupKm <= 0.1;

  const region = useMemo(() => {
    const pts: Coord[] = [];
    if (busCoord) pts.push(busCoord);
    if (pickupCoord) pts.push(pickupCoord);
    if (safeUserLocation) pts.push(safeUserLocation);
    return buildRegion(pts);
  }, [busCoord, pickupCoord, safeUserLocation]);

  const lineCoords = useMemo(() => {
    if (busCoord && pickupCoord) return [busCoord, pickupCoord];
    return [];
  }, [busCoord, pickupCoord]);

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

  return (
    <View style={styles.container}>
      {isArrivingNow ? (
        <View style={styles.arrivingBadge}>
          <Text style={styles.arrivingText}>Arriving now</Text>
        </View>
      ) : null}
      <MapView provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={region}>
        {lineCoords.length === 2 ? (
          <Polyline coordinates={lineCoords} strokeColor="#3B82F6" strokeWidth={3} />
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

        {safeUserLocation ? (
          <Marker coordinate={safeUserLocation} title="You" pinColor="#0F172A" tracksViewChanges={false} />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  arrivingBadge: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    zIndex: 2,
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  arrivingText: {
    color: "#92400E",
    fontWeight: "700",
    fontSize: 12,
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
});

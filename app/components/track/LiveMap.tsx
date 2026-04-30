/**
 * Parent Track map: live bus, route path, and stop states.
 *
 * Polylines:
 * 1) Full route — straight segments through all route stops that have coordinates (by stopOrder).
 * 2) Bus → next — dashed line from live bus to the next stop when both exist (distinct stroke).
 * Road-snapped paths can be added later; straight lines avoid misleading bus→pickup-only.
 */
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { TrackingSegment } from "../../../services/parentApi";
import {
  buildBusToNextLeg,
  buildRouteContextPolyline,
  collectFitCoordinates,
  type MapCoord,
} from "./trackMapGeometry";

function isValidCoord(coord: MapCoord): boolean {
  return (
    Number.isFinite(coord.latitude) &&
    Number.isFinite(coord.longitude) &&
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180
  );
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function buildRegion(points: MapCoord[]): {
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
  userLocation: MapCoord | null;
  isLocationStale: boolean;
  staleLabel: string | null;
};

type StopStyle = "reached" | "next" | "pickup" | "upcoming";

function resolveStopStyle(
  stopId: string,
  segment: TrackingSegment
): StopStyle {
  const completed = new Set(segment.completedStopIds ?? []);
  if (completed.has(stopId)) return "reached";
  if (stopId === segment.nextStopId) {
    if (segment.pickupStopId && stopId === segment.pickupStopId) return "pickup";
    return "next";
  }
  if (segment.pickupStopId && stopId === segment.pickupStopId) return "pickup";
  return "upcoming";
}

export default function LiveMap({ segment, userLocation, isLocationStale, staleLabel }: Props) {
  const pickupStop = segment?.pickupStop ?? null;
  const lastKnownBusCoordRef = useRef<MapCoord | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const liveBusCoord = useMemo<MapCoord | null>(() => {
    const latitude = toFiniteNumber(segment?.latitude);
    const longitude = toFiniteNumber(segment?.longitude);
    if (latitude == null || longitude == null) return null;
    const candidate = { latitude, longitude };
    return isValidCoord(candidate) ? candidate : null;
  }, [segment?.latitude, segment?.longitude]);

  useEffect(() => {
    if (liveBusCoord) {
      lastKnownBusCoordRef.current = liveBusCoord;
    }
  }, [liveBusCoord]);

  const busCoord = useMemo<MapCoord | null>(() => {
    if (liveBusCoord) return liveBusCoord;
    if (isLocationStale) return lastKnownBusCoordRef.current;
    return null;
  }, [isLocationStale, liveBusCoord]);

  const pickupCoord = useMemo<MapCoord | null>(() => {
    const latitude = toFiniteNumber(pickupStop?.latitude);
    const longitude = toFiniteNumber(pickupStop?.longitude);
    if (latitude == null || longitude == null) return null;
    const candidate = { latitude, longitude };
    return isValidCoord(candidate) ? candidate : null;
  }, [pickupStop?.latitude, pickupStop?.longitude]);

  const safeUserLocation = useMemo<MapCoord | null>(() => {
    if (!userLocation) return null;
    return isValidCoord(userLocation) ? userLocation : null;
  }, [userLocation]);

  const routeContextCoords = useMemo(() => buildRouteContextPolyline(segment), [segment]);

  const busToNextCoords = useMemo(
    () => buildBusToNextLeg(busCoord, segment),
    [busCoord, segment]
  );

  const isArrivingNow = useMemo(
    () => segment?.distanceToPickupKm != null && segment.distanceToPickupKm <= 0.1,
    [segment?.distanceToPickupKm]
  );

  const sortedStopsWithCoords = useMemo(() => {
    const list = segment?.routeStops ?? [];
    const sorted = [...list].sort((a, b) => a.stopOrder - b.stopOrder);
    return sorted.filter((s) => {
      const la =
        typeof s.latitude === "number"
          ? s.latitude
          : s.latitude != null
            ? Number(s.latitude)
            : NaN;
      const lo =
        typeof s.longitude === "number"
          ? s.longitude
          : s.longitude != null
            ? Number(s.longitude)
            : NaN;
      return isValidCoord({ latitude: la, longitude: lo });
    });
  }, [segment?.routeStops]);

  const region = useMemo(() => {
    const pts = collectFitCoordinates({
      bus: busCoord,
      parent: safeUserLocation,
      pickup: pickupCoord,
      routeContext: routeContextCoords,
    });
    return buildRegion(pts);
  }, [busCoord, pickupCoord, safeUserLocation, routeContextCoords]);

  const hasAnyPoint = useMemo(() => {
    if (busCoord || pickupCoord || safeUserLocation) return true;
    return sortedStopsWithCoords.length > 0;
  }, [busCoord, pickupCoord, safeUserLocation, sortedStopsWithCoords.length]);

  const fitMapToPoints = useCallback(() => {
    if (!hasAnyPoint) return;
    const coords = collectFitCoordinates({
      bus: busCoord,
      parent: safeUserLocation,
      pickup: pickupCoord,
      routeContext: routeContextCoords,
    });
    if (coords.length === 0) return;
    const map = mapRef.current;
    if (!map) return;
    if (coords.length === 1) {
      map.animateToRegion(buildRegion(coords), 350);
      return;
    }
    map.fitToCoordinates(coords, {
      edgePadding: { top: 72, right: 28, bottom: 96, left: 28 },
      animated: true,
    });
  }, [hasAnyPoint, busCoord, pickupCoord, safeUserLocation, routeContextCoords]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      fitMapToPoints();
    });
    return () => cancelAnimationFrame(id);
  }, [fitMapToPoints]);

  useEffect(() => {
    if (!__DEV__) return;
    console.log("[LiveMap] bus marker evaluation", {
      latitude: segment?.latitude ?? null,
      longitude: segment?.longitude ?? null,
      liveBusCoord: !!liveBusCoord,
      usingStaleFallback: !liveBusCoord && !!busCoord,
      shouldRenderBusMarker: !!busCoord,
    });
  }, [busCoord, liveBusCoord, segment?.latitude, segment?.longitude]);

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
      {isLocationStale && staleLabel ? (
        <View style={styles.staleBadge}>
          <Text style={styles.staleText}>{staleLabel}</Text>
        </View>
      ) : null}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        onMapReady={fitMapToPoints}
      >
        {routeContextCoords.length >= 2 ? (
          <Polyline
            coordinates={routeContextCoords}
            strokeColor="#3B82F6"
            strokeWidth={3}
          />
        ) : null}

        {busToNextCoords.length === 2 ? (
          <Polyline
            coordinates={busToNextCoords}
            strokeColor="#F59E0B"
            strokeWidth={2}
            lineDashPattern={Platform.OS === "ios" ? [10, 8] : undefined}
          />
        ) : null}

        {pickupCoord &&
        segment?.pickupStopId &&
        !sortedStopsWithCoords.some((s) => s.id === segment.pickupStopId) ? (
          <Marker
            coordinate={pickupCoord}
            title={segment.pickupStop?.name ?? "Your stop"}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <StopMarkerDot style="pickup" />
          </Marker>
        ) : null}

        {segment
          ? sortedStopsWithCoords.map((s) => {
              const la =
                typeof s.latitude === "number"
                  ? s.latitude
                  : Number(s.latitude ?? NaN);
              const lo =
                typeof s.longitude === "number"
                  ? s.longitude
                  : Number(s.longitude ?? NaN);
              const coordinate = { latitude: la, longitude: lo };
              const style = resolveStopStyle(s.id, segment);
              const title =
                style === "pickup" && segment.pickupStop?.name
                  ? `${s.stopName} · Your stop`
                  : s.stopName;
              return (
                <Marker
                  key={s.id}
                  coordinate={coordinate}
                  title={title}
                  tracksViewChanges={false}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <StopMarkerDot style={style} />
                </Marker>
              );
            })
          : null}

        {busCoord ? (
          <Marker
            coordinate={busCoord}
            title={isLocationStale ? "School bus (updating)" : "School bus"}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={[
                styles.busMarkerOuter,
                isLocationStale && styles.busMarkerOuterStale,
              ]}
            >
              <MaterialCommunityIcons
                name="bus"
                size={22}
                color={isLocationStale ? "#64748B" : "#FFFFFF"}
              />
            </View>
          </Marker>
        ) : null}

        {safeUserLocation ? (
          <Marker
            coordinate={safeUserLocation}
            title="You"
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.youMarkerOuter}>
              <MaterialCommunityIcons name="account" size={18} color="#FFFFFF" />
            </View>
          </Marker>
        ) : null}
      </MapView>
    </View>
  );
}

function StopMarkerDot({ style }: { style: StopStyle }) {
  const colors = {
    reached: { bg: "#22C55E", ring: "#DCFCE7" },
    next: { bg: "#2563EB", ring: "#DBEAFE" },
    pickup: { bg: "#7C3AED", ring: "#EDE9FE" },
    upcoming: { bg: "#94A3B8", ring: "#F1F5F9" },
  };
  const c = colors[style];
  return (
    <View style={[styles.stopRing, { borderColor: c.ring, backgroundColor: c.ring }]}>
      <View style={[styles.stopDot, { backgroundColor: c.bg }]} />
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
  busMarkerOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  busMarkerOuterStale: {
    backgroundColor: "#94A3B8",
  },
  youMarkerOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  stopRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  staleBadge: {
    position: "absolute",
    top: 44,
    alignSelf: "center",
    zIndex: 2,
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  staleText: {
    color: "#1D4ED8",
    fontWeight: "600",
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

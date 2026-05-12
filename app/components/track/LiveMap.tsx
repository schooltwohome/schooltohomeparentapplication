/**
 * Parent Track map: live animated bus, route polylines (completed/remaining), stop markers,
 * follow mode camera, and the FloatingInfoCard overlay.
 *
 * Polylines:
 * 1) completedPolyline — muted grey; stops already visited.
 * 2) remainingPolyline — primary blue; stops ahead.
 * 3) busToNextLeg     — dashed amber; live bus → next stop.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import type { TrackingSegment } from "../../../services/parentApi";
import {
  collectFitCoordinates,
  type MapCoord,
} from "./trackMapGeometry";
import { polylineLengthMeters, etaMinutes as calcEtaMinutes } from "../../../lib/geo";
import { useAnimatedBusMarker } from "../../_hooks/useAnimatedBusMarker";
import { useRoutePolyline, useRoadSnappedPolyline } from "../../_hooks/useRoutePolyline";
import BusMarker from "./BusMarker";
import FloatingInfoCard from "./FloatingInfoCard";
import { DARK_MAP_STYLE } from "./mapStyles";
import { normalizeTripStatus } from "../../../types/tracking";

const DEVIATION_THRESHOLD_METERS = 150;

/** Dynamic zoom level based on bus speed — closer zoom when moving slowly or stopped. */
function speedZoom(speedKmh: number | null | undefined): number {
  const s = typeof speedKmh === "number" && Number.isFinite(speedKmh) ? speedKmh : 0;
  if (s > 50) return 13;
  if (s > 20) return 15;
  if (s > 5) return 17;
  return 18;
}

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
    return { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 8, longitudeDelta: 8 };
  }
  if (points.length === 1) {
    return { latitude: points[0].latitude, longitude: points[0].longitude, latitudeDelta: 0.06, longitudeDelta: 0.06 };
  }
  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const midLon = (Math.min(...lons) + Math.max(...lons)) / 2;
  const latDelta = Math.max(0.04, (Math.max(...lats) - Math.min(...lats)) * 2.2);
  const lonDelta = Math.max(0.04, (Math.max(...lons) - Math.min(...lons)) * 2.2);
  return { latitude: midLat, longitude: midLon, latitudeDelta: latDelta, longitudeDelta: lonDelta };
}

type Props = {
  segment: TrackingSegment | null;
  userLocation: MapCoord | null;
  isLocationStale: boolean;
  staleLabel: string | null;
};

type StopStyle = "reached" | "next" | "pickup" | "upcoming";

function resolveStopStyle(stopId: string, segment: TrackingSegment): StopStyle {
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const mapRef = useRef<MapView | null>(null);
  const lastKnownBusCoordRef = useRef<MapCoord | null>(null);

  // Follow-mode: camera centres on bus on each update until the user pans manually.
  const [followMode, setFollowMode] = useState(true);
  const userPannedRef = useRef(false);
  // Guard against onRegionChangeComplete firing for our own programmatic animateToRegion calls.
  const isProgrammaticMoveRef = useRef(false);
  // Auto-resume follow mode 5 s after the user stops panning.
  const autoResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const liveBusCoord = useMemo<MapCoord | null>(() => {
    const latitude = toFiniteNumber(segment?.latitude);
    const longitude = toFiniteNumber(segment?.longitude);
    if (latitude == null || longitude == null) return null;
    const c = { latitude, longitude };
    return isValidCoord(c) ? c : null;
  }, [segment?.latitude, segment?.longitude]);

  useEffect(() => {
    if (liveBusCoord) lastKnownBusCoordRef.current = liveBusCoord;
  }, [liveBusCoord]);

  const busCoord = useMemo<MapCoord | null>(() => {
    if (liveBusCoord) return liveBusCoord;
    if (isLocationStale) return lastKnownBusCoordRef.current;
    return null;
  }, [isLocationStale, liveBusCoord]);

  const pickupCoord = useMemo<MapCoord | null>(() => {
    const la = toFiniteNumber(segment?.pickupStop?.latitude);
    const lo = toFiniteNumber(segment?.pickupStop?.longitude);
    if (la == null || lo == null) return null;
    const c = { latitude: la, longitude: lo };
    return isValidCoord(c) ? c : null;
  }, [segment?.pickupStop?.latitude, segment?.pickupStop?.longitude]);

  const safeUserLocation = useMemo<MapCoord | null>(
    () => (userLocation && isValidCoord(userLocation) ? userLocation : null),
    [userLocation]
  );

  const sortedStopsWithCoords = useMemo(() => {
    const list = segment?.routeStops ?? [];
    return [...list]
      .sort((a, b) => a.stopOrder - b.stopOrder)
      .filter((s) => {
        const la = typeof s.latitude === "number" ? s.latitude : Number(s.latitude ?? NaN);
        const lo = typeof s.longitude === "number" ? s.longitude : Number(s.longitude ?? NaN);
        return isValidCoord({ latitude: la, longitude: lo });
      });
  }, [segment?.routeStops]);

  const hasAnyPoint = useMemo(
    () => !!(busCoord || pickupCoord || safeUserLocation || sortedStopsWithCoords.length),
    [busCoord, pickupCoord, safeUserLocation, sortedStopsWithCoords.length]
  );

  // Google Maps API key — reads from app.config.js extra (set GOOGLE_MAPS_API_KEY in .env),
  // with fallback to EXPO_PUBLIC_GOOGLE_MAPS_API_KEY for bare workflow compatibility.
  const googleMapsApiKey = useMemo(() => {
    const extra = Constants.expoConfig?.extra as { googleMapsApiKey?: string } | undefined;
    return (
      extra?.googleMapsApiKey?.trim() ||
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
      ""
    );
  }, []);

  // Convert sortedStopsWithCoords to MapCoord[] for the road-snapped polyline call.
  const stopMapCoords = useMemo(
    () =>
      sortedStopsWithCoords.map((s) => ({
        latitude: typeof s.latitude === "number" ? s.latitude : Number(s.latitude ?? NaN),
        longitude: typeof s.longitude === "number" ? s.longitude : Number(s.longitude ?? NaN),
      })),
    [sortedStopsWithCoords]
  );

  // Build remaining stop coords for rerouting: stops not yet completed, in order.
  const remainingStopCoords = useMemo(() => {
    if (!segment) return stopMapCoords;
    const completedIds = new Set(segment.completedStopIds ?? []);
    return sortedStopsWithCoords
      .filter((s) => !completedIds.has(s.id))
      .map((s) => ({
        latitude: typeof s.latitude === "number" ? s.latitude : Number(s.latitude ?? NaN),
        longitude: typeof s.longitude === "number" ? s.longitude : Number(s.longitude ?? NaN),
      }));
  }, [segment, sortedStopsWithCoords, stopMapCoords]);

  // Road-snapped driving polyline — re-fetches automatically when the bus deviates.
  const roadPolyline = useRoadSnappedPolyline(
    stopMapCoords,
    googleMapsApiKey,
    busCoord,
    remainingStopCoords
  );

  // True once the road-following route has been fetched and is ready to render.
  const hasRoadPolyline = roadPolyline.length >= 2;

  // True while we have stops to draw a route for but the road fetch hasn't resolved yet.
  const isRoadPolylineLoading = stopMapCoords.length >= 2 && !hasRoadPolyline && !!googleMapsApiKey;

  // Animated bus marker state (AnimatedRegion + rotation).
  const markerState = useAnimatedBusMarker(busCoord);

  // Polyline splits (completed / remaining / bus-to-next) + deviation distance.
  const { completedPolyline, remainingPolyline, busToNextLeg, deviationFromRoute } =
    useRoutePolyline(segment, busCoord, roadPolyline);

  const liveRemainingKm = useMemo(
    () => polylineLengthMeters(remainingPolyline) / 1000,
    [remainingPolyline]
  );

  // Only compute a client-side ETA when the road polyline has loaded and the
  // remaining path is positive. Without the road polyline, `remainingPolyline`
  // is empty (length = 0) which would produce a misleading "0 min" ETA.
  // Passing null lets FloatingInfoCard fall back to the backend's etaMinutes.
  const liveEtaMinutes = useMemo(
    () =>
      hasRoadPolyline && liveRemainingKm > 0
        ? calcEtaMinutes(liveRemainingKm, segment?.speedKmh ?? 0)
        : null,
    [hasRoadPolyline, liveRemainingKm, segment?.speedKmh]
  );

  const isOffRoute = useMemo(() => {
    if (
      deviationFromRoute === null ||
      deviationFromRoute <= DEVIATION_THRESHOLD_METERS
    ) {
      return false;
    }
    const status = normalizeTripStatus(segment?.tripStatus);
    return status === "started" || status === "returning";
  }, [deviationFromRoute, segment?.tripStatus]);

  const nextStopName = useMemo(() => {
    if (!segment) return null;
    const nextStop = segment.routeStops?.find((s) => s.id === segment.nextStopId);
    return nextStop?.stopName ?? segment.pickupStop?.name ?? null;
  }, [segment]);

  const fitMapToPoints = useCallback(() => {
    if (!hasAnyPoint) return;
    const coords = collectFitCoordinates({
      bus: busCoord,
      parent: safeUserLocation,
      pickup: pickupCoord,
      routeContext: remainingPolyline,
    });
    if (!coords.length) return;
    const map = mapRef.current;
    if (!map) return;
    if (coords.length === 1) {
      isProgrammaticMoveRef.current = true;
      map.animateToRegion(buildRegion(coords), 350);
    } else {
      isProgrammaticMoveRef.current = true;
      map.fitToCoordinates(coords, {
        edgePadding: { top: 72, right: 28, bottom: 200, left: 28 },
        animated: true,
      });
    }
  }, [hasAnyPoint, busCoord, pickupCoord, safeUserLocation, remainingPolyline]);

  // Initial fit.
  useEffect(() => {
    const id = requestAnimationFrame(fitMapToPoints);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow mode: animate camera to bus with navigation tilt on each new coordinate.
  useEffect(() => {
    if (!followMode || !busCoord || userPannedRef.current) return;
    isProgrammaticMoveRef.current = true;
    mapRef.current?.animateCamera(
      {
        center: busCoord,
        pitch: 50,
        heading: markerState.bearingDegRef.current,
        zoom: speedZoom(segment?.speedKmh),
        altitude: undefined,
      },
      { duration: 600 }
    );
  }, [followMode, busCoord, markerState.bearingDegRef, segment?.speedKmh]);

  const handleRegionChangeComplete = useCallback(() => {
    if (isProgrammaticMoveRef.current) {
      // This fired because of our own animateToRegion — reset the guard after the
      // animation settle window and do NOT disable follow mode.
      setTimeout(() => {
        isProgrammaticMoveRef.current = false;
      }, 600);
      return;
    }
    userPannedRef.current = true;
    setFollowMode(false);

    // Auto-resume: re-enable follow mode 5 s after the user's last manual pan.
    // Each new pan cancels the previous timer so the countdown resets on every touch.
    if (autoResumeTimerRef.current !== null) {
      clearTimeout(autoResumeTimerRef.current);
    }
    autoResumeTimerRef.current = setTimeout(() => {
      autoResumeTimerRef.current = null;
      userPannedRef.current = false;
      setFollowMode(true);
    }, 5_000);
  }, []);

  const handleFollowToggle = useCallback(() => {
    // Cancel any pending auto-resume timer — the user is taking manual control.
    if (autoResumeTimerRef.current !== null) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
    userPannedRef.current = false;
    setFollowMode(true);
    // Snap back to navigation camera immediately on FAB press.
    if (busCoord) {
      isProgrammaticMoveRef.current = true;
      mapRef.current?.animateCamera(
        {
          center: busCoord,
          pitch: 50,
          heading: markerState.bearingDegRef.current,
          zoom: speedZoom(segment?.speedKmh),
          altitude: undefined,
        },
        { duration: 600 }
      );
    }
  }, [busCoord, markerState.bearingDegRef, segment?.speedKmh]);

  // Clear the auto-resume timer when the component unmounts to avoid state updates on an
  // unmounted component and prevent potential memory leaks.
  useEffect(() => {
    return () => {
      if (autoResumeTimerRef.current !== null) {
        clearTimeout(autoResumeTimerRef.current);
      }
    };
  }, []);

  if (!hasAnyPoint) {
    return (
      <View style={[styles.container, styles.emptyWrap]}>
        <Text style={styles.emptyTitle}>No live position yet</Text>
        <Text style={styles.emptySub}>
          When the school assigns a route and the bus shares GPS, the map will show the bus
          and your child&apos;s stop here.
        </Text>
      </View>
    );
  }

  const initialRegion = buildRegion(
    collectFitCoordinates({
      bus: busCoord,
      parent: safeUserLocation,
      pickup: pickupCoord,
      routeContext: remainingPolyline,
    })
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        customMapStyle={isDark ? DARK_MAP_STYLE : []}
        onMapReady={() => {
          isProgrammaticMoveRef.current = false;
          fitMapToPoints();
        }}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {/* ── Completed route segment — only rendered once the road-snapped route has loaded ── */}
        {/* Casing (border underneath for road-like contrast) */}
        {hasRoadPolyline && completedPolyline.length >= 2 ? (
          <Polyline
            coordinates={completedPolyline}
            strokeColor="#CBD5E1"
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}
        {/* Main completed line — muted to show already-traveled road */}
        {hasRoadPolyline && completedPolyline.length >= 2 ? (
          <Polyline
            coordinates={completedPolyline}
            strokeColor="#94A3B8"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}

        {/* ── Remaining route segment — only rendered once the road-snapped route has loaded ── */}
        {/* Casing — dark border makes the blue pop on any map style */}
        {hasRoadPolyline && remainingPolyline.length >= 2 ? (
          <Polyline
            coordinates={remainingPolyline}
            strokeColor="#1E40AF"
            strokeWidth={8}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}
        {/* Main remaining line — bright Uber-style blue */}
        {hasRoadPolyline && remainingPolyline.length >= 2 ? (
          <Polyline
            coordinates={remainingPolyline}
            strokeColor="#3B82F6"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}

        {/* Pickup stop (if not already in routeStops list) */}
        {pickupCoord &&
        segment?.pickupStopId &&
        !sortedStopsWithCoords.some((s) => s.id === segment.pickupStopId) ? (
          <Marker
            coordinate={pickupCoord}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0 }}
          >
            <View style={styles.stopLabelWrap}>
              <StopMarkerDot style="pickup" />
              <View style={styles.stopLabelPill}>
                <Text style={styles.stopLabelText} numberOfLines={1}>
                  {segment.pickupStop?.name ?? "Your stop"}
                </Text>
              </View>
            </View>
          </Marker>
        ) : null}

        {/* Route stop markers */}
        {segment
          ? sortedStopsWithCoords.map((s) => {
              const la =
                typeof s.latitude === "number" ? s.latitude : Number(s.latitude ?? NaN);
              const lo =
                typeof s.longitude === "number" ? s.longitude : Number(s.longitude ?? NaN);
              const style = resolveStopStyle(s.id, segment);
              const displayName =
                style === "pickup" && segment.pickupStop?.name
                  ? `${s.stopName} · Your stop`
                  : s.stopName;
              return (
                <Marker
                  key={s.id}
                  coordinate={{ latitude: la, longitude: lo }}
                  tracksViewChanges={false}
                  anchor={{ x: 0.5, y: 0 }}
                >
                  <View style={styles.stopLabelWrap}>
                    <StopMarkerDot style={style} />
                    <View style={[styles.stopLabelPill, style === "reached" && styles.stopLabelPillReached]}>
                      <Text style={styles.stopLabelText} numberOfLines={1}>{displayName}</Text>
                    </View>
                  </View>
                </Marker>
              );
            })
          : null}

        {/* Animated + rotating bus marker */}
        {busCoord ? (
          <BusMarker
            markerState={markerState}
            title={isLocationStale ? "School bus (updating)" : "School bus"}
            isStale={isLocationStale}
          />
        ) : null}

        {/* Parent / user location marker */}
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

      {/* Road route loading chip — shown while Directions API fetch is in-flight */}
      {isRoadPolylineLoading ? (
        <View style={styles.routeLoadingChip} pointerEvents="none">
          <ActivityIndicator size="small" color="#3B82F6" style={{ marginRight: 6 }} />
          <Text style={styles.routeLoadingText}>Loading road route…</Text>
        </View>
      ) : null}

      {/* Destination chip — Uber-style top bar showing next stop */}
      {nextStopName ? (
        <View style={styles.destChip} pointerEvents="none">
          <MaterialCommunityIcons name="map-marker" size={14} color="#2563EB" />
          <Text style={styles.destChipText} numberOfLines={1}>
            {nextStopName}
          </Text>
        </View>
      ) : null}

      {/* Follow-mode FAB — shown only when follow mode is off */}
      {!followMode ? (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={handleFollowToggle}
          accessibilityLabel="Follow bus"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#0F172A" />
        </Pressable>
      ) : null}

      {/* Off-route warning chip — shown when bus deviates > 150 m during an active trip */}
      {isOffRoute ? (
        <View style={styles.offRouteChip} pointerEvents="none">
          <Text style={styles.offRouteChipText}>Bus off route</Text>
        </View>
      ) : null}

      {/* Floating info card — positioned above the FAB area */}
      <FloatingInfoCard
        segment={segment}
        isStale={isLocationStale}
        staleLabel={staleLabel}
        liveEtaMinutes={liveEtaMinutes}
        liveRemainingKm={liveRemainingKm}
      />
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
  stopLabelWrap: {
    alignItems: "center",
  },
  stopLabelPill: {
    marginTop: 3,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    maxWidth: 82,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.2)",
  },
  stopLabelPillReached: {
    borderColor: "rgba(34,197,94,0.2)",
  },
  stopLabelText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 190,
    right: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  fabPressed: {
    backgroundColor: "#F1F5F9",
  },
  offRouteChip: {
    position: "absolute",
    bottom: 210,
    alignSelf: "center",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  offRouteChipText: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    fontWeight: "700",
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  routeLoadingChip: {
    position: "absolute",
    bottom: 220,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  routeLoadingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  destChip: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  destChipText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
});

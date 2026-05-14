/**
 * Parent Track map: live animated bus, route polylines (completed/remaining), stop markers,
 * follow mode camera, and the FloatingInfoCard overlay.
 *
 * Polylines:
 * 1) coveredPolyline   — blue; route already covered.
 * 2) remainingPolyline — grey; route still ahead.
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
  Pressable,
  StyleSheet,
  Text,
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
import { useAnimatedBusMarker } from "../../_hooks/useAnimatedBusMarker";
import { useRoutePolyline, useRoadSnappedPolyline } from "../../_hooks/useRoutePolyline";
import { LIGHT_MAP_STYLE } from "./mapStyles";
import { normalizeTripStatus, type GeoPoint } from "../../../types/tracking";

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
  /** True when a trip is active but no GPS coordinates have been received yet. */
  gpsUnavailable?: boolean;
};

type StopStyle = "PASSED" | "NEXT" | "AHEAD";

function resolveStopStyle(stopId: string, segment: TrackingSegment): StopStyle {
  const completed = new Set(segment.completedStopIds ?? []);
  if (completed.has(stopId)) return "PASSED";
  const pickupName = segment.pickupStop?.name?.trim();
  const isParentStop =
    (segment.pickupStopId && stopId === segment.pickupStopId) ||
    (!segment.pickupStopId && pickupName && segment.routeStops?.find((s) => s.id === stopId)?.stopName === pickupName);
  if (isParentStop) return "NEXT";
  return "AHEAD";
}

/** Maps the raw trip-status string to a short, human-readable label for the marker callout. */
function busStatusLabel(tripStatus: string | null | undefined): string {
  const s = normalizeTripStatus(tripStatus);
  switch (s) {
    case "started":    return "On the way";
    case "returning":  return "Returning";
    case "completed":  return "Trip completed";
    case "reached_school": return "At school";
    default:           return "Not started";
  }
}

export default function LiveMap({ segment, userLocation, isLocationStale, gpsUnavailable = false }: Props) {
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

  const busCoord = useMemo<GeoPoint | null>(() => {
    const base: MapCoord | null = liveBusCoord ?? (isLocationStale ? lastKnownBusCoordRef.current : null);
    if (!base) return null;
    const h = toFiniteNumber(segment?.heading);
    return h != null ? { ...base, heading: h } : base;
  }, [isLocationStale, liveBusCoord, segment?.heading]);

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

  // Smooth bus marker coordinate + stable heading.
  const markerState = useAnimatedBusMarker(busCoord);

  // Polyline splits (completed / remaining / bus-to-next) + deviation distance.
  const { coveredPolyline, remainingPolyline, busToNextLeg, deviationFromRoute } =
    useRoutePolyline(segment, busCoord, roadPolyline);

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

  const liveStatus = useMemo(() => {
    const lastFixMs = segment?.lastFixAt ? Date.parse(segment.lastFixAt) : NaN;
    const ageSec = Number.isFinite(lastFixMs)
      ? Math.max(0, Math.floor((Date.now() - lastFixMs) / 1000))
      : null;
    const isLive = !isLocationStale && ageSec != null && ageSec <= 30;
    if (isLive) {
      return { label: "Live", tone: "live" as const };
    }
    if (ageSec != null) {
      const mins = Math.max(1, Math.floor(ageSec / 60));
      return { label: `Last seen ${mins} min ago`, tone: "stale" as const };
    }
    return { label: "Signal unavailable", tone: "stale" as const };
  }, [segment?.lastFixAt, isLocationStale]);

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
        edgePadding: { top: 72, right: 28, bottom: 240, left: 28 },
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
        heading: markerState.busHeading,
        zoom: speedZoom(segment?.speedKmh),
        altitude: undefined,
      },
      { duration: 600 }
    );
  }, [followMode, busCoord, markerState.busHeading, segment?.speedKmh]);

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
          heading: markerState.busHeading,
          zoom: speedZoom(segment?.speedKmh),
          altitude: undefined,
        },
        { duration: 600 }
      );
    }
  }, [busCoord, markerState.busHeading, segment?.speedKmh]);

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
        customMapStyle={LIGHT_MAP_STYLE}
        onMapReady={() => {
          isProgrammaticMoveRef.current = false;
          fitMapToPoints();
        }}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {/* ── Completed route segment (always split by progress) ── */}
        {/* Casing (border underneath for road-like contrast) */}
        {coveredPolyline.length >= 2 ? (
          <Polyline
            coordinates={coveredPolyline}
            strokeColor="#DDE6F8"
            strokeWidth={7}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}
        {coveredPolyline.length >= 2 ? (
          <Polyline
            coordinates={coveredPolyline}
            strokeColor="#1A73E8"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}

        {/* ── Remaining route segment (always split by progress) ── */}
        {remainingPolyline.length >= 2 ? (
          <Polyline
            coordinates={remainingPolyline}
            strokeColor="#ECECEC"
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}
        {remainingPolyline.length >= 2 ? (
          <Polyline
            coordinates={remainingPolyline}
            strokeColor="#BDBDBD"
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}

        {/* Current leg hint from live bus position to next stop */}
        {busToNextLeg.length >= 2 ? (
          <Polyline
            coordinates={busToNextLeg}
            strokeColor="#F59E0B"
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
            lineDashPattern={[8, 6]}
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
              <StopMarkerDot style="NEXT" />
              <StopLabel text={segment.pickupStop?.name ?? "Your stop"} stopStyle="NEXT" />
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
                style === "NEXT" && segment.pickupStop?.name
                  ? `${s.stopName} · Your stop`
                  : style === "PASSED"
                  ? `✓ ${s.stopName}`
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
                    <StopLabel text={displayName} stopStyle={style} />
                  </View>
                </Marker>
              );
            })
          : null}

        {/* Live bus marker: AnimatedRegion keeps updates smooth and avoids stale marker frames. */}
        {busCoord ? (
          <Marker
            coordinate={markerState.coordinate}
            tracksViewChanges
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            rotation={markerState.busHeading}
            zIndex={1200}
            title={segment?.busNumber ? `Bus ${segment.busNumber}` : "School bus"}
            description={busStatusLabel(segment?.tripStatus)}
          >
            <View style={styles.busMarkerWrap}>
              <View
                style={[
                  styles.busMarkerPin,
                  isLocationStale ? styles.busMarkerPinStale : styles.busMarkerPinLive,
                ]}
              >
                <MaterialCommunityIcons name="bus-school" size={18} color="#FFFFFF" />
              </View>
              {segment?.busNumber ? (
                <View style={styles.busMarkerBadge}>
                  <Text style={styles.busMarkerBadgeText} numberOfLines={1}>
                    {segment.busNumber}
                  </Text>
                </View>
              ) : null}
            </View>
          </Marker>
        ) : null}

        {/* Parent / user location marker */}
        {safeUserLocation ? (
          <Marker
            coordinate={safeUserLocation}
            title="You"
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.youMarkerContainer}>
              <View style={styles.youMarkerPulse} />
              <View style={styles.youMarkerOuter}>
                <MaterialCommunityIcons name="account" size={18} color="#FFFFFF" />
              </View>
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
          <View style={styles.destChipIconWrap}>
            <MaterialCommunityIcons name="bus" size={15} color="#FFFFFF" />
          </View>
          <View style={styles.destChipTextWrap}>
            <Text style={styles.destChipLabel}>Next stop</Text>
            <Text style={styles.destChipText} numberOfLines={1}>
              {nextStopName}
            </Text>
          </View>
          {segment?.busNumber ? (
            <View style={styles.busNumberBadge}>
              <Text style={styles.busNumberText}>{segment.busNumber}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Live freshness indicator for parents: green when GPS is fresh, amber when stale. */}
      <View style={styles.liveStatusChip} pointerEvents="none">
        <View
          style={[
            styles.liveStatusDot,
            liveStatus.tone === "live" ? styles.liveStatusDotLive : styles.liveStatusDotStale,
          ]}
        />
        <Text style={styles.liveStatusText}>{liveStatus.label}</Text>
      </View>

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
          <View style={styles.offRouteChipInner}>
            <MaterialCommunityIcons name="alert-circle" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
            <Text style={styles.offRouteChipText}>Bus off route</Text>
          </View>
        </View>
      ) : null}

      {/* GPS unavailable chip — shown when trip is active but bus coordinates are not yet available */}
      {gpsUnavailable ? (
        <View style={styles.noGpsChip} pointerEvents="none">
          <View style={styles.noGpsChipInner}>
            <MaterialCommunityIcons name="crosshairs-off" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
            <Text style={styles.noGpsChipText}>Waiting for bus GPS signal…</Text>
          </View>
        </View>
      ) : null}

    </View>
  );
}

function StopMarkerDot({ style }: { style: StopStyle }) {
  if (style === "PASSED") {
    return <View style={[styles.stopRing, { borderColor: "#1A73E8", backgroundColor: "#1A73E8" }]} />;
  }

  const borderColor = style === "NEXT" ? "#1A73E8" : "#9E9E9E";
  return (
    <View style={[styles.stopRing, { borderColor, backgroundColor: "#FFFFFF" }]} />
  );
}

function StopLabel({ text, stopStyle }: { text: string; stopStyle: StopStyle }) {
  const stripeColors: Record<StopStyle, string> = {
    PASSED: "#1A73E8",
    NEXT: "#1A73E8",
    AHEAD: "#9E9E9E",
  };
  return (
    <View style={styles.stopLabelPill}>
      <View style={[styles.stopLabelStripe, { backgroundColor: stripeColors[stopStyle] }]} />
      <Text style={styles.stopLabelText} numberOfLines={1}>{text}</Text>
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
  youMarkerContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  youMarkerPulse: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3B82F6",
    opacity: 0.22,
  },
  youMarkerOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  busMarkerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  busMarkerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.26,
    shadowRadius: 4,
    elevation: 7,
  },
  busMarkerPinLive: {
    backgroundColor: "#2563EB",
  },
  busMarkerPinStale: {
    backgroundColor: "#64748B",
  },
  busMarkerBadge: {
    marginTop: 4,
    maxWidth: 70,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  busMarkerBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0F172A",
  },
  stopRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stopLabelWrap: {
    alignItems: "center",
  },
  stopLabelPill: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 8,
    overflow: "hidden",
    maxWidth: 96,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stopLabelStripe: {
    width: 3,
    alignSelf: "stretch",
  },
  stopLabelText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1E293B",
    paddingHorizontal: 5,
    paddingVertical: 3,
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
  offRouteChipInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  offRouteChipText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
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
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  destChipIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  destChipTextWrap: {
    flex: 1,
  },
  destChipLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  destChipText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  busNumberBadge: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  busNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  noGpsChip: {
    position: "absolute",
    bottom: 210,
    alignSelf: "center",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  noGpsChipInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#64748B",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  noGpsChipText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  liveStatusChip: {
    position: "absolute",
    top: 84,
    left: 16,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.88)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  liveStatusDotLive: {
    backgroundColor: "#22C55E",
  },
  liveStatusDotStale: {
    backgroundColor: "#F59E0B",
  },
  liveStatusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});

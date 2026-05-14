import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Alert, AppState, View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import * as Location from "expo-location";
import { Bell } from "lucide-react-native";
import LiveMap from "./LiveMap";
import BusStatusPanel from "./status/BusStatusPanel";
import PermissionPrompt from "./PermissionPrompt";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getParentTracking,
  type TrackingSegment,
} from "../../../services/parentApi";
import {
  useParentTrackingRealtime,
  type LiveLocationPush,
  type BusArrivingPush,
} from "../../_hooks/useParentTrackingRealtime";
import { normalizeTripStatus } from "../../../types/tracking";
import { setPendingPushNavigation } from "../../../store/slices/notificationsSlice";

/** UI poll interval. GPS freshness (`locationAgeSeconds`) depends on driver uploads + backend persistence, not this interval. */
const POLL_MS = 15000;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export default function TrackScreen() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const unreadCount = useAppSelector((s) => s.notifications.items.filter((n) => !n.isRead).length);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [segments, setSegments] = useState<TrackingSegment[]>([]);
  const [liveOverride, setLiveOverride] = useState<LiveLocationPush | null>(null);
  const activeTripIdRef = useRef<string | null>(null);
  const [trackLoading, setTrackLoading] = useState(true);
  const [trackError, setTrackError] = useState<string | null>(null);
  const refreshSeqRef = useRef(0);
  const alertedTripIdRef = useRef<string | null>(null);
  // Deduplicate socket-based arriving alerts: key = tripId-stopId
  const alertedArrivingKeysRef = useRef<Set<string>>(new Set());

  const primarySegment = useMemo(() => {
    if (!segments.length) return null;
    const withGps = segments.find(
      (s) =>
        isFiniteNumber(s.latitude) &&
        isFiniteNumber(s.longitude)
    );
    return withGps ?? segments[0];
  }, [segments]);

  // Clear liveOverride whenever the active trip changes so stale socket coordinates
  // from a previous trip never bleed into the next one's display.
  useEffect(() => {
    const currentTripId = primarySegment?.tripId ?? null;
    if (currentTripId !== activeTripIdRef.current) {
      activeTripIdRef.current = currentTripId;
      setLiveOverride(null);
    }
  }, [primarySegment?.tripId]);

  // Merge socket coordinate push into the segment so the marker moves before the next HTTP poll.
  const effectivePrimarySegment = useMemo<TrackingSegment | null>(() => {
    if (!primarySegment) return null;
    if (!liveOverride) return primarySegment;
    if (String(liveOverride.busId) !== String(primarySegment.busId ?? "")) return primarySegment;
    if (
      liveOverride.tripId &&
      primarySegment.tripId &&
      String(liveOverride.tripId) !== String(primarySegment.tripId)
    ) {
      // Guard against stale pushes from a previous trip on the same bus.
      return primarySegment;
    }
    const segTs = primarySegment.lastFixAt ? Date.parse(primarySegment.lastFixAt) : 0;
    if (liveOverride.ts <= segTs) return primarySegment;
    return {
      ...primarySegment,
      latitude: liveOverride.latitude,
      longitude: liveOverride.longitude,
      heading: liveOverride.heading ?? primarySegment.heading,
      speedKmh:
        liveOverride.speedKmh != null ? liveOverride.speedKmh : primarySegment.speedKmh,
      lastFixAt: new Date(liveOverride.ts).toISOString(),
    };
  }, [primarySegment, liveOverride]);

  const freshnessUi = useMemo(() => {
    if (!effectivePrimarySegment) {
      return {
        isStale: false,
        staleLabel: null as string | null,
      };
    }
    const ageFromFix = effectivePrimarySegment.lastFixAt
      ? Math.max(0, Math.floor((Date.now() - Date.parse(effectivePrimarySegment.lastFixAt)) / 1000))
      : null;
    const reportedAge = effectivePrimarySegment.locationAgeSeconds;
    const age =
      typeof ageFromFix === "number" && Number.isFinite(ageFromFix)
        ? ageFromFix
        : reportedAge;
    const isStale =
      (effectivePrimarySegment.isLocationStale === true && (age == null || age > 30)) ||
      (typeof age === "number" && Number.isFinite(age) && age > 30);
    if (!isStale || (typeof age === "number" && age <= 30)) {
      return { isStale: false, staleLabel: null as string | null };
    }
    if (typeof age === "number" && Number.isFinite(age)) {
      const lastSeen =
        effectivePrimarySegment.lastFixAt != null
          ? new Date(effectivePrimarySegment.lastFixAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })
          : null;
      return {
        isStale: true,
        staleLabel: lastSeen
          ? `Location updating... Last seen at ${lastSeen} (${age}s ago)`
          : `Location updating... Last updated ${age}s ago`,
      };
    }
    return { isStale: true, staleLabel: "Location updating..." };
  }, [effectivePrimarySegment]);

  // True when the trip is active but we have never received GPS coordinates.
  // Different from "stale" (which means coordinates were received but are old).
  // Used to show "GPS signal not yet available" banners in the UI.
  const gpsUnavailable = useMemo(() => {
    if (!effectivePrimarySegment) return false;
    const hasCoords =
      isFiniteNumber(effectivePrimarySegment.latitude) &&
      isFiniteNumber(effectivePrimarySegment.longitude);
    if (hasCoords) return false;
    const status = normalizeTripStatus(effectivePrimarySegment.tripStatus);
    return status === "started" || status === "returning";
  }, [effectivePrimarySegment]);

  const staleMinutesInfo = useMemo(() => {
    const age = effectivePrimarySegment?.lastFixAt
      ? Math.max(0, Math.floor((Date.now() - Date.parse(effectivePrimarySegment.lastFixAt)) / 1000))
      : effectivePrimarySegment?.locationAgeSeconds;
    const shouldShow =
      trackLoading === false &&
      trackError === null &&
      effectivePrimarySegment != null &&
      typeof age === "number" &&
      Number.isFinite(age) &&
      age > 60;
    if (!shouldShow || typeof age !== "number") return null;
    return Math.round(age / 60);
  }, [
    effectivePrimarySegment,
    effectivePrimarySegment?.lastFixAt,
    effectivePrimarySegment?.locationAgeSeconds,
    trackError,
    trackLoading,
  ]);

  const liveStatusMessage = useMemo(() => {
    if (!effectivePrimarySegment) return null;

    const pickupName = effectivePrimarySegment.pickupStop?.name ?? "your stop";
    const hasArrived =
      effectivePrimarySegment.hasReachedPickup === true ||
      (typeof effectivePrimarySegment.distanceToPickupKm === "number" &&
        effectivePrimarySegment.distanceToPickupKm <= 0.05);

    if (hasArrived) {
      return {
        tone: "success" as const,
        text: `Bus has arrived at ${pickupName}.`,
      };
    }

    const speed = effectivePrimarySegment.speedKmh;
    if (typeof speed === "number" && Number.isFinite(speed)) {
      const roundedSpeed = Math.max(0, Math.round(speed));
      if (roundedSpeed <= 1) {
        return {
          tone: "info" as const,
          text: "Bus is currently stopped.",
        };
      }
      return {
        tone: "info" as const,
        text: `Bus speed is ${roundedSpeed} km/h.`,
      };
    }

    return null;
  }, [effectivePrimarySegment]);

  const loadTracking = useCallback(async () => {
    if (!token) {
      setSegments([]);
      setTrackLoading(false);
      return;
    }
    const requestSeq = ++refreshSeqRef.current;
    try {
      setTrackError(null);
      const data = await getParentTracking(token);
      if (requestSeq !== refreshSeqRef.current) return;
      const nextSegments = data.segments ?? [];
      if (__DEV__) {
        console.log("[TrackScreen] fetched tracking segments:", nextSegments.length);
      }
      setSegments(nextSegments);

      // FIX 10: Arrival alert — fire once per trip when bus is within 500 m of pickup.
      const arrivingSeg = nextSegments.find((seg) => {
        const status = normalizeTripStatus(seg.tripStatus);
        return (
          typeof seg.distanceToPickupKm === "number" &&
          seg.distanceToPickupKm <= 0.5 &&
          seg.distanceToPickupKm > 0 &&
          seg.hasReachedPickup === false &&
          (status === "started" || status === "returning")
        );
      });
      if (arrivingSeg?.tripId && arrivingSeg.tripId !== alertedTripIdRef.current) {
        alertedTripIdRef.current = arrivingSeg.tripId;
        Alert.alert(
          "Bus Arriving Soon",
          "Your child's bus is less than 500m away. Please be ready at the stop."
        );
      }
    } catch (e: unknown) {
      if (requestSeq !== refreshSeqRef.current) return;
      setTrackError(e instanceof Error ? e.message : "Could not load tracking");
      setSegments([]);
    } finally {
      if (requestSeq !== refreshSeqRef.current) return;
      setTrackLoading(false);
    }
  }, [token]);

  const liveBusIds = useMemo(() => {
    const ids = new Set<string>();
    for (const seg of segments) {
      if (seg.busId) ids.add(seg.busId);
    }
    return [...ids];
  }, [segments]);

  const handleArrivingPush = useCallback((data: BusArrivingPush) => {
    const key = `${data.tripId}-${data.stopId}`;
    if (alertedArrivingKeysRef.current.has(key)) return;
    alertedArrivingKeysRef.current.add(key);
    Alert.alert(
      "Bus Arriving Soon",
      `${data.studentName}'s bus is about ${data.etaMinutes} min away from ${data.stopName}. Please be ready at the stop.`
    );
  }, []);

  const handleRealtimeUnauthorized = useCallback(() => {
    setTrackError("Live tracking session expired. Please sign in again.");
  }, []);

  useParentTrackingRealtime(
    token,
    liveBusIds,
    loadTracking,
    // Keep realtime socket alive while app is open; avoids losing updates when navigating tabs/screens.
    Boolean(token && hasPermission === true),
    setLiveOverride,
    handleArrivingPush,
    handleRealtimeUnauthorized
  );

  useEffect(() => {
    if (!__DEV__) return;
    const selected = primarySegment;
    console.log("[TrackScreen] selected primary segment", {
      segmentCount: segments.length,
      studentUuid: selected?.studentUuid ?? null,
      busId: selected?.busId ?? null,
      tripStatus: selected?.tripStatus ?? null,
      latitude: selected?.latitude ?? null,
      longitude: selected?.longitude ?? null,
      hasValidBusCoord:
        isFiniteNumber(selected?.latitude) && isFiniteNumber(selected?.longitude),
    });
  }, [segments.length, primarySegment]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === "granted") {
        setHasPermission(true);
      } else {
        setHasPermission(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!token || hasPermission !== true) return;
    loadTracking();
    const id = setInterval(loadTracking, POLL_MS);
    return () => clearInterval(id);
  }, [token, hasPermission, loadTracking]);

  useEffect(() => {
    if (!token || hasPermission !== true) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        // Recovery path: force a fresh snapshot after foreground resume.
        void loadTracking();
      }
    });
    return () => sub.remove();
  }, [token, hasPermission, loadTracking]);

  useEffect(() => {
    if (hasPermission !== true) return;
    let cancelled = false;
    (async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasPermission]);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === "granted");
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <PermissionPrompt
        onGrantPermission={handleRequestPermission}
        isLoading={isLoading}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bellWrap}>
        <TouchableOpacity
          style={styles.bellButton}
          onPress={() => dispatch(setPendingPushNavigation({ tab: "alerts" }))}
          activeOpacity={0.85}
        >
          <Bell size={18} color="#0F172A" />
          {unreadCount > 0 ? (
            <Text style={styles.bellCount}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
          ) : null}
        </TouchableOpacity>
      </View>
      {trackError ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{trackError}</Text>
        </View>
      ) : null}
      {staleMinutesInfo !== null ? (
        <View style={styles.infoWrap}>
          <Text style={styles.infoText}>
            Bus location is {staleMinutesInfo} minutes old. Updates resume when the driver is online.
          </Text>
        </View>
      ) : null}
      {liveStatusMessage ? (
        <View
          style={[
            styles.statusWrap,
            liveStatusMessage.tone === "success" ? styles.statusWrapSuccess : styles.statusWrapInfo,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              liveStatusMessage.tone === "success" ? styles.statusTextSuccess : styles.statusTextInfo,
            ]}
          >
            {liveStatusMessage.text}
          </Text>
        </View>
      ) : null}
      <LiveMap
        segment={effectivePrimarySegment}
        userLocation={userLocation}
        isLocationStale={freshnessUi.isStale}
        gpsUnavailable={gpsUnavailable}
      />
      <BusStatusPanel
        segment={effectivePrimarySegment}
        allSegments={segments}
        loading={trackLoading}
        staleLabel={freshnessUi.staleLabel}
        userLocation={userLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  banner: {
    backgroundColor: "#FEF2F2",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA",
  },
  bannerText: {
    color: "#B91C1C",
    fontSize: 13,
    textAlign: "center",
  },
  infoWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  infoText: {
    color: "#475569",
    fontSize: 12,
    textAlign: "center",
  },
  statusWrap: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusWrapInfo: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  statusWrapSuccess: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  statusTextInfo: {
    color: "#1D4ED8",
  },
  statusTextSuccess: {
    color: "#15803D",
  },
  bellWrap: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 30,
  },
  bellButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  bellCount: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 12,
  },
});

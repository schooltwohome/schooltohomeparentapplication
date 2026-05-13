import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Alert, View, StyleSheet, Text, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import LiveMap from "./LiveMap";
import BusStatusPanel from "./status/BusStatusPanel";
import PermissionPrompt from "./PermissionPrompt";
import { useAppSelector } from "../../../store/hooks";
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

/** UI poll interval. GPS freshness (`locationAgeSeconds`) depends on driver uploads + backend persistence, not this interval. */
const POLL_MS = 15000;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export default function TrackScreen() {
  const token = useAppSelector((s) => s.auth.token);
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
  const [screenFocused, setScreenFocused] = useState(true);
  const refreshSeqRef = useRef(0);
  const alertedTripIdRef = useRef<string | null>(null);
  // Deduplicate socket-based arriving alerts: key = tripId-stopId
  const alertedArrivingKeysRef = useRef<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, [])
  );

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
    if (liveOverride.busId !== primarySegment.busId) return primarySegment;
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
    if (!primarySegment) {
      return {
        isStale: false,
        staleLabel: null as string | null,
      };
    }
    const age = primarySegment.locationAgeSeconds;
    const isStale = primarySegment.isLocationStale === true;
    if (!isStale) {
      return { isStale: false, staleLabel: null as string | null };
    }
    if (typeof age === "number" && Number.isFinite(age)) {
      return { isStale: true, staleLabel: `Location updating... Last updated ${age}s ago` };
    }
    return { isStale: true, staleLabel: "Location updating..." };
  }, [primarySegment]);

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
    const age = primarySegment?.locationAgeSeconds;
    const shouldShow =
      trackLoading === false &&
      trackError === null &&
      primarySegment?.isLocationStale === true &&
      typeof age === "number" &&
      Number.isFinite(age) &&
      age > 60;
    if (!shouldShow || typeof age !== "number") return null;
    return Math.round(age / 60);
  }, [
    primarySegment?.isLocationStale,
    primarySegment?.locationAgeSeconds,
    trackError,
    trackLoading,
  ]);

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

  useParentTrackingRealtime(
    token,
    liveBusIds,
    loadTracking,
    Boolean(token && hasPermission === true && screenFocused),
    setLiveOverride,
    handleArrivingPush
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
      <LiveMap
        segment={effectivePrimarySegment}
        userLocation={userLocation}
        isLocationStale={freshnessUi.isStale}
        staleLabel={freshnessUi.staleLabel}
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
});

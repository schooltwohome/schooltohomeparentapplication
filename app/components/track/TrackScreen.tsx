import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
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
import { useParentTrackingRealtime } from "../../hooks/useParentTrackingRealtime";

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
  const [trackLoading, setTrackLoading] = useState(true);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [screenFocused, setScreenFocused] = useState(true);

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

  const loadTracking = useCallback(async () => {
    if (!token) {
      setSegments([]);
      setTrackLoading(false);
      return;
    }
    try {
      setTrackError(null);
      const data = await getParentTracking(token);
      const nextSegments = data.segments ?? [];
      if (__DEV__) {
        console.log("[TrackScreen] fetched tracking segments:", nextSegments.length);
      }
      setSegments(nextSegments);
    } catch (e: unknown) {
      setTrackError(e instanceof Error ? e.message : "Could not load tracking");
      setSegments([]);
    } finally {
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

  useParentTrackingRealtime(
    token,
    liveBusIds,
    loadTracking,
    Boolean(token && hasPermission === true && screenFocused)
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
      <LiveMap
        segment={primarySegment}
        userLocation={userLocation}
        isLocationStale={freshnessUi.isStale}
        staleLabel={freshnessUi.staleLabel}
      />
      <BusStatusPanel
        segment={primarySegment}
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
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
} from "react-native";
import Constants from "expo-constants";
import type { TrackingSegment } from "../../../services/parentApi";
import {
  fetchWalkingDirections,
  type DirectionsSummary,
} from "../../../lib/googleDirections";
import { coordFromStopRow } from "./trackMapGeometry";

type Coord = { latitude: number; longitude: number };

function destCoord(segment: TrackingSegment | null, mode: "next" | "pickup"): Coord | null {
  if (!segment) return null;
  if (mode === "pickup" && segment.pickupStop) {
    return {
      latitude: segment.pickupStop.latitude,
      longitude: segment.pickupStop.longitude,
    };
  }
  const nextId = segment.nextStopId;
  if (!nextId) return segment.pickupStop ? destCoord(segment, "pickup") : null;
  const sorted = [...(segment.routeStops ?? [])].sort((a, b) => a.stopOrder - b.stopOrder);
  const row = sorted.find((s) => s.id === nextId);
  if (!row) return null;
  return coordFromStopRow(row);
}

type Props = {
  segment: TrackingSegment | null;
  userLocation: Coord | null;
};

const CACHE_TTL_MS = 90_000;

export default function ParentDirectionsCard({ segment, userLocation }: Props) {
  const [mode, setMode] = useState<"next" | "pickup">("next");
  const [result, setResult] = useState<DirectionsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<{
    key: string;
    at: number;
    data: DirectionsSummary | null;
  } | null>(null);

  const apiKey = useMemo(() => {
    const extra = Constants.expoConfig?.extra as { googleMapsApiKey?: string } | undefined;
    return (
      extra?.googleMapsApiKey?.trim() ||
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
      ""
    );
  }, []);

  const destination = useMemo(() => destCoord(segment, mode), [segment, mode]);

  const load = useCallback(async () => {
    if (!userLocation || !destination || !apiKey) {
      setResult(null);
      setError(null);
      return;
    }
    const key = [
      userLocation.latitude.toFixed(5),
      userLocation.longitude.toFixed(5),
      destination.latitude.toFixed(5),
      destination.longitude.toFixed(5),
      mode,
    ].join("|");
    const now = Date.now();
    if (cacheRef.current && cacheRef.current.key === key && now - cacheRef.current.at < CACHE_TTL_MS) {
      setResult(cacheRef.current.data);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchWalkingDirections(userLocation, destination, apiKey);
      cacheRef.current = { key, at: Date.now(), data };
      setResult(data);
      if (!data) {
        setError("Could not load walking directions. Try again or open in Maps.");
      }
    } catch {
      setError("Could not load walking directions.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [userLocation, destination, apiKey, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  const openExternalMaps = useCallback(() => {
    if (!userLocation || !destination) return;
    const o = `${userLocation.latitude},${userLocation.longitude}`;
    const d = `${destination.latitude},${destination.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      o
    )}&destination=${encodeURIComponent(d)}&travelmode=walking`;
    void Linking.openURL(url);
  }, [userLocation, destination]);

  if (!segment || !userLocation) {
    return null;
  }

  const showPickupToggle =
    segment.pickupStop &&
    segment.nextStopId &&
    segment.pickupStopId &&
    segment.nextStopId !== segment.pickupStopId;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Walk to bus route</Text>
      <Text style={styles.hint}>
        Turn-by-turn in Google Maps; summary below uses walking directions from your location.
      </Text>

      {showPickupToggle ? (
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "next" && styles.toggleBtnOn]}
            onPress={() => setMode("next")}
          >
            <Text style={[styles.toggleText, mode === "next" && styles.toggleTextOn]}>Next stop</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "pickup" && styles.toggleBtnOn]}
            onPress={() => setMode("pickup")}
          >
            <Text style={[styles.toggleText, mode === "pickup" && styles.toggleTextOn]}>Your pickup</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity style={styles.mapsBtn} onPress={openExternalMaps} disabled={!destination}>
        <Text style={styles.mapsBtnText}>
          {Platform.OS === "ios" ? "Open in Apple / Google Maps" : "Open in Google Maps"}
        </Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#0F172A" />
          <Text style={styles.loadingText}>Loading walking route…</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.err}>{error}</Text> : null}

      {result && !error ? (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLine}>
            {result.durationText} · {result.distanceText}
          </Text>
          {result.steps.length > 0 ? (
            <ScrollView style={styles.stepsScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {result.steps.map((step, i) => (
                <View key={`${i}-${step.htmlInstructions.slice(0, 24)}`} style={styles.stepRow}>
                  <Text style={styles.stepIdx}>{i + 1}.</Text>
                  <Text style={styles.stepText}>{step.htmlInstructions}</Text>
                  <Text style={styles.stepMeta}>
                    {step.distanceText}
                    {step.durationText ? ` · ${step.durationText}` : ""}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.fallbackSteps}>Follow the blue route on the map in Maps.</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12,
    lineHeight: 17,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  toggleBtnOn: {
    backgroundColor: "#DBEAFE",
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  toggleTextOn: {
    color: "#1D4ED8",
  },
  mapsBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  mapsBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
  },
  err: {
    color: "#B91C1C",
    fontSize: 13,
    marginBottom: 8,
  },
  summaryBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
  },
  summaryLine: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 8,
  },
  stepsScroll: {
    maxHeight: 200,
  },
  stepRow: {
    marginBottom: 10,
  },
  stepIdx: {
    fontWeight: "700",
    color: "#334155",
    fontSize: 13,
  },
  stepText: {
    fontSize: 13,
    color: "#1E293B",
    lineHeight: 18,
  },
  stepMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  fallbackSteps: {
    fontSize: 13,
    color: "#64748B",
  },
});

import React, { useEffect, useRef } from "react";
import {
  Animated,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { TrackingSegment } from "../../../services/parentApi";
import { normalizeTripStatus, TRIP_STATUS_LABEL } from "../../../types/tracking";

type Props = {
  segment: TrackingSegment | null;
  isStale: boolean;
  staleLabel: string | null;
  liveEtaMinutes?: number | null;
  liveRemainingKm?: number | null;
};

const STATUS_COLOR: Record<string, string> = {
  not_started: "#64748B",
  started: "#2563EB",
  reached_school: "#16A34A",
  returning: "#D97706",
  completed: "#16A34A",
};

/**
 * A bottom-anchored floating card that shows live trip info: ETA, next stop, status, driver contact.
 * Slides in from below on mount using a spring animation — no third-party sheet library needed.
 */
export default function FloatingInfoCard({ segment, isStale, staleLabel, liveEtaMinutes, liveRemainingKm }: Props) {
  const slideAnim = useRef(new Animated.Value(120)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  if (!segment) return null;

  const tripStatus = normalizeTripStatus(segment.tripStatus);
  const statusColor = STATUS_COLOR[tripStatus] ?? "#64748B";
  const statusLabel = TRIP_STATUS_LABEL[tripStatus];

  // Prefer live-computed ETA (updates on every GPS fix via socket) over the polled API value
  const etaMinutes = liveEtaMinutes != null ? liveEtaMinutes : segment.etaMinutes;
  const speedKmh =
    typeof segment.speedKmh === "number" && Number.isFinite(segment.speedKmh)
      ? Math.round(segment.speedKmh)
      : null;

  const isArrivingNow =
    typeof segment.distanceToPickupKm === "number" &&
    segment.distanceToPickupKm <= 0.1;

  const nextStopName =
    segment.routeStops?.find((s) => s.id === segment.nextStopId)?.stopName ??
    segment.pickupStop?.name ??
    null;

  const handleCallDriver = () => {
    const phone = segment.driverPhone;
    if (!phone) return;
    const url = `tel:${phone.replace(/\s/g, "")}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Animated.View
      style={[styles.card, { transform: [{ translateY: slideAnim }] }]}
      pointerEvents="box-none"
    >
      {isStale && staleLabel ? (
        <View style={styles.staleBanner}>
          <Text style={styles.staleBannerText}>{staleLabel}</Text>
        </View>
      ) : null}

      <View style={styles.topRow}>
        {/* Left: ETA block */}
        <View style={styles.etaBlock}>
          {isArrivingNow ? (
            <Text style={styles.arrivingLabel}>Arriving now</Text>
          ) : etaMinutes != null ? (
            <View style={styles.etaInner}>
              <Text style={styles.etaNumber}>{etaMinutes}</Text>
              <Text style={styles.etaUnit}> min</Text>
            </View>
          ) : (
            <Text style={styles.etaUnknown}>ETA —</Text>
          )}

          {liveRemainingKm != null && liveRemainingKm > 0 ? (
            <Text style={styles.distanceText}>
              {liveRemainingKm >= 1
                ? `${liveRemainingKm.toFixed(1)} km remaining`
                : `${Math.round(liveRemainingKm * 1000)} m remaining`}
            </Text>
          ) : null}

          {/* Next stop name — Uber-style below ETA */}
          {nextStopName ? (
            <Text style={styles.nextStopName} numberOfLines={1}>
              {nextStopName}
            </Text>
          ) : null}
        </View>

        {/* Right: speed + status stacked */}
        <View style={styles.rightStack}>
          {speedKmh !== null ? (
            <View style={styles.speedPill}>
              <Text style={styles.speedNumber}>{speedKmh}</Text>
              <Text style={styles.speedUnit}> km/h</Text>
            </View>
          ) : null}
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.routeInfo}>
          {segment.routeName ? (
            <Text style={styles.routeName} numberOfLines={1}>
              {segment.routeName}
            </Text>
          ) : null}
          {segment.busNumber ? (
            <Text style={styles.busNumber}>Bus {segment.busNumber}</Text>
          ) : null}
        </View>

        {segment.driverName ? (
          <Pressable
            style={({ pressed }) => [styles.driverBtn, pressed && styles.driverBtnPressed]}
            onPress={handleCallDriver}
            disabled={!segment.driverPhone}
            accessibilityLabel={`Call driver ${segment.driverName}`}
            accessibilityRole="button"
          >
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarInitial}>
                {segment.driverName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.driverLabel}>Driver</Text>
              <Text style={styles.driverName} numberOfLines={1}>
                {segment.driverName}
              </Text>
            </View>
            {segment.driverPhone ? (
              <View style={styles.callIcon}>
                <Text style={styles.callIconText}>📞</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 24 : 16,
    left: 12,
    right: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  staleBanner: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    alignSelf: "stretch",
  },
  staleBannerText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  etaBlock: {
    flex: 1,
    marginRight: 12,
  },
  etaInner: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  etaNumber: {
    fontSize: 36,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 40,
  },
  etaUnit: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 5,
    marginLeft: 2,
  },
  etaUnknown: {
    fontSize: 20,
    fontWeight: "700",
    color: "#94A3B8",
  },
  arrivingLabel: {
    fontSize: 22,
    fontWeight: "800",
    color: "#16A34A",
  },
  nextStopName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginTop: 2,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 1,
  },
  rightStack: {
    alignItems: "flex-end",
    gap: 6,
  },
  speedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  speedNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  speedUnit: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routeInfo: {
    flex: 1,
    marginRight: 12,
  },
  routeName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  busNumber: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  driverBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  driverBtnPressed: {
    backgroundColor: "#F1F5F9",
  },
  driverAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  driverAvatarInitial: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  driverLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  driverName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    maxWidth: 100,
  },
  callIcon: {
    marginLeft: 2,
  },
  callIconText: {
    fontSize: 14,
  },
});

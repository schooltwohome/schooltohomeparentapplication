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
import { MaterialCommunityIcons } from "@expo/vector-icons";
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

/** Max speed for the speed bar fill (100% at this value). */
const SPEED_BAR_MAX_KMH = 80;

/**
 * A bottom-anchored floating card that shows live trip info: ETA, next stop, status, driver contact.
 * Slides in from below on mount using a spring animation — no third-party sheet library needed.
 */
export default function FloatingInfoCard({
  segment,
  isStale,
  staleLabel,
  liveEtaMinutes,
  liveRemainingKm,
}: Props) {
  const slideAnim = useRef(new Animated.Value(120)).current;
  const arrivingPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const isArrivingNow =
    typeof segment?.distanceToPickupKm === "number" &&
    segment.distanceToPickupKm <= 0.1;

  // Pulse "Arriving now" text
  useEffect(() => {
    if (isArrivingNow) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(arrivingPulse, {
            toValue: 0.55,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(arrivingPulse, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      arrivingPulse.setValue(1);
    }
  }, [isArrivingNow, arrivingPulse]);

  if (!segment) return null;

  const tripStatus = normalizeTripStatus(segment.tripStatus);
  const statusColor = STATUS_COLOR[tripStatus] ?? "#64748B";
  const statusLabel = TRIP_STATUS_LABEL[tripStatus];

  const etaMinutes = liveEtaMinutes != null ? liveEtaMinutes : segment.etaMinutes;
  const speedKmh =
    typeof segment.speedKmh === "number" && Number.isFinite(segment.speedKmh)
      ? Math.round(segment.speedKmh)
      : null;

  const speedBarFill =
    speedKmh != null
      ? Math.min(1, speedKmh / SPEED_BAR_MAX_KMH)
      : 0;

  const nextStopName =
    segment.routeStops?.find((s) => s.id === segment.nextStopId)?.stopName ??
    segment.pickupStop?.name ??
    null;

  const handleCallDriver = () => {
    const phone = segment.driverPhone;
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s/g, "")}`).catch(() => {});
  };

  return (
    <Animated.View
      style={[styles.card, { transform: [{ translateY: slideAnim }] }]}
      pointerEvents="box-none"
    >
      {/* Drag handle */}
      <View style={styles.dragHandle} />

      {isStale && staleLabel ? (
        <View style={styles.staleBanner}>
          <MaterialCommunityIcons name="wifi-off" size={13} color="#1D4ED8" style={{ marginRight: 5 }} />
          <Text style={styles.staleBannerText}>{staleLabel}</Text>
        </View>
      ) : null}

      <View style={styles.topRow}>
        {/* Left: ETA block */}
        <View style={styles.etaBlock}>
          {isArrivingNow ? (
            <Animated.Text style={[styles.arrivingLabel, { opacity: arrivingPulse }]}>
              Arriving now
            </Animated.Text>
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

          {nextStopName ? (
            <Text style={styles.nextStopName} numberOfLines={1}>
              {nextStopName}
            </Text>
          ) : null}
        </View>

        {/* Right: speed + status */}
        <View style={styles.rightStack}>
          {speedKmh !== null ? (
            <View style={styles.speedBlock}>
              <View style={styles.speedPill}>
                <Text style={styles.speedNumber}>{speedKmh}</Text>
                <Text style={styles.speedUnit}> km/h</Text>
              </View>
              {/* Speed bar */}
              <View style={styles.speedBarTrack}>
                <View style={[styles.speedBarFill, { width: `${speedBarFill * 100}%` as unknown as number }]} />
              </View>
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
              <MaterialCommunityIcons name="phone" size={18} color="#16A34A" style={styles.callIcon} />
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
    borderRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 12,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 10,
  },
  staleBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  staleBannerText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "600",
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
    fontSize: 38,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 42,
  },
  etaUnit: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 6,
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
    marginTop: 3,
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
  speedBlock: {
    alignItems: "flex-end",
    gap: 4,
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
  speedBarTrack: {
    width: 64,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
  },
  speedBarFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#F59E0B",
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
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  driverBtnPressed: {
    backgroundColor: "#F1F5F9",
  },
  driverAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
});

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native";
import { Phone, MessageSquare, User, Bus, CheckCircle2 } from "lucide-react-native";
import type { TrackingSegment } from "../../../../services/parentApi";

function formatTripStatus(status: string | null): string {
  if (!status) return "No active trip";
  const map: Record<string, string> = {
    scheduled: "Scheduled",
    on_going: "On the way",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return map[status] ?? status.replace(/_/g, " ");
}

type Props = { segment: TrackingSegment | null; staleLabel: string | null };

export default function DriverProfile({ segment, staleLabel }: Props) {
  const phone = segment?.driverPhone?.trim() || "";
  const busLabel = segment?.busNumber ?? "—";
  const eta =
    segment?.etaMinutes != null && segment.etaMinutes > 0
      ? `~${segment.etaMinutes} min to pickup`
      : "—";
  const driverName = segment?.driverName?.trim() || "Driver not assigned";
  const route = segment?.routeName ?? "Route";

  const handleCall = () => {
    if (!phone) return;
    Linking.openURL(Platform.OS === "ios" ? `telprompt:${phone}` : `tel:${phone}`);
  };

  const handleMessage = () => {
    if (!phone) return;
    Linking.openURL(Platform.OS === "ios" ? `sms:${phone}` : `sms:${phone}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarFallback}>
            <User size={28} color="#64748B" />
          </View>
          <View style={styles.verifiedBadge}>
            <CheckCircle2 size={12} color="#FFFFFF" fill="#3B82F6" />
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.topRow}>
            <View style={styles.busBadge}>
              <Bus size={12} color="#3B82F6" style={{ marginRight: 4 }} />
              <Text style={styles.busId} numberOfLines={1}>
                {busLabel}
              </Text>
            </View>
            <Text style={styles.timeText} numberOfLines={1}>
              {eta}
            </Text>
          </View>
          <Text style={styles.routeLine} numberOfLines={1}>
            {route}
          </Text>
          <Text style={styles.statusLine} numberOfLines={1}>
            {formatTripStatus(segment?.tripStatus ?? null)}
          </Text>
          {staleLabel ? (
            <Text style={styles.staleLine} numberOfLines={1}>
              {staleLabel}
            </Text>
          ) : null}
          <Text style={styles.driverName} numberOfLines={1}>
            {driverName}
          </Text>
        </View>
      </View>

      {phone ? (
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.callBtn]}
            onPress={handleCall}
            activeOpacity={0.7}
          >
            <Phone size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.msgBtn]}
            onPress={handleMessage}
            activeOpacity={0.7}
          >
            <MessageSquare size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 4,
    width: "100%",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 1,
  },
  infoContainer: {
    marginLeft: 12,
    flex: 1,
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B82F6",
    flexShrink: 1,
  },
  busBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
    maxWidth: "55%",
  },
  busId: {
    fontSize: 10,
    fontWeight: "800",
    color: "#3B82F6",
    letterSpacing: 0.5,
  },
  routeLine: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 2,
  },
  statusLine: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 4,
  },
  staleLine: {
    fontSize: 11,
    color: "#1D4ED8",
    marginBottom: 4,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  rightSection: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  callBtn: {
    backgroundColor: "#3B82F6",
  },
  msgBtn: {
    backgroundColor: "#F1F5F9",
  },
});

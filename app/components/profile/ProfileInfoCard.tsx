import React, { useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Mail, Phone, MapPin, Sparkles } from "lucide-react-native";
import InfoListItem from "./InfoListItem";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export type ProfileInfo = {
  displayName: string;
  initials: string;
  email: string;
  phone: string;
  address: string;
};

export default function ProfileInfoCard({ profile }: { profile: ProfileInfo }) {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.glow} />
      <View style={styles.card}>
        <View style={styles.accentBar} />

        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGlow} />
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.initials}</Text>
            </View>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{profile.displayName}</Text>
            <View style={styles.badge}>
              <Sparkles size={12} color="#0369A1" />
              <Text style={styles.badgeText}>Verified parent</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.panelLabel}>Contact</Text>
          <View style={styles.infoList}>
            <InfoListItem icon={Mail} label="Email" value={profile.email} kind="email" />
            <InfoListItem icon={Phone} label="Phone" value={profile.phone} kind="phone" />
            <InfoListItem icon={MapPin} label="Address" value={profile.address} kind="address" />
          </View>
        </View>
      </View>
    </View>
  );
}

export function useProfileInfoFromParent(
  name: string | null | undefined,
  email: string | null | undefined,
  phone: string | null | undefined,
  address: string | null | undefined
): ProfileInfo {
  return useMemo(() => {
    const displayName = name?.trim() || "Parent";
    return {
      displayName,
      initials: initialsFromName(displayName),
      email: email?.trim() || "—",
      phone: phone?.trim() || "—",
      address: address?.trim() || "—",
    };
  }, [name, email, phone, address]);
}

const styles = StyleSheet.create({
  cardContainer: {
    position: "relative",
    paddingBottom: 8,
  },
  glow: {
    position: "absolute",
    top: 24,
    left: 16,
    right: 16,
    bottom: -4,
    backgroundColor: "#3B82F6",
    opacity: 0.12,
    borderRadius: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E8EEF4",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.07,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#3B82F6",
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingLeft: 8,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 18,
  },
  avatarGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 24,
    backgroundColor: "#3B82F6",
    opacity: 0.15,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  badge: {
    backgroundColor: "#F0F9FF",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  badgeText: {
    fontSize: 12,
    color: "#0369A1",
    fontWeight: "700",
  },
  infoPanel: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  panelLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 14,
    textTransform: "uppercase",
  },
  infoList: {
    gap: 16,
  },
});

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Mail, Phone, MapPin } from "lucide-react-native";
import InfoListItem from "./InfoListItem";

export default function ProfileInfoCard() {
  return (
    <View style={styles.cardContainer}>
      {/* Glow effect behind card */}
      <View style={styles.glow} />
      
      <View style={styles.card}>
        {/* Profile Header section in card */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGlow} />
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>SJ</Text>
            </View>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>Sarah Johnson</Text>
            <View style={styles.badge}>
              <View style={styles.activeDot} />
              <Text style={styles.badgeText}>Verified Parent</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Info items */}
        <View style={styles.infoList}>
          <InfoListItem 
            icon={Mail} 
            label="Email Address" 
            value="sarah.johnson@email.com" 
          />
          <InfoListItem 
            icon={Phone} 
            label="Phone Number" 
            value="+1 (555) 123-4567" 
          />
          <InfoListItem 
            icon={MapPin} 
            label="Home Address" 
            value="123 Maple Avenue, Springfield" 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: "relative",
    paddingBottom: 8,
  },
  glow: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    bottom: 0,
    backgroundColor: "#3B82F6",
    opacity: 0.1,
    borderRadius: 32,
    filter: "blur(20px)",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    ...Platform.select({
      ios: {
        shadowColor: "#1E293B",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
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
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: "#F0F9FF",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0EA5E9",
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    color: "#0369A1",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 24,
  },
  infoList: {
    gap: 0,
  },
});

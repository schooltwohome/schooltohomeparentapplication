import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Mail, Phone, MapPin } from "lucide-react-native";
import InfoListItem from "./InfoListItem";

export default function ProfileInfoCard() {
  return (
    <View style={styles.card}>
      {/* Profile Header section in card */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>SJ</Text>
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>Sarah Johnson</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Parent Account</Text>
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
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#3B82F6", // Professional Blue
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  badge: {
    backgroundColor: "#EFF6FF",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 24,
  },
  infoList: {
    gap: 4,
  },
});

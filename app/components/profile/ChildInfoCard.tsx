import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { ChevronRight } from "lucide-react-native";

interface ChildInfoCardProps {
  name: string;
  grade: string;
  busNumber: string;
  initial: string;
  avatarColor: string;
}

export default function ChildInfoCard({ 
  name, 
  grade, 
  busNumber, 
  initial, 
  avatarColor 
}: ChildInfoCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>{name}</Text>
        <Text style={styles.detailsText}>
          Grade {grade} • Bus {busNumber}
        </Text>
      </View>

      <ChevronRight size={20} color="#CBD5E1" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
});

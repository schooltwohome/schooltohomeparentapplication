import React from "react";
import { View, Text, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { Bus, ChevronRight } from "lucide-react-native";

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
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.nameText} numberOfLines={1}>{name}</Text>
        <Text style={styles.gradeText}>Grade {grade}</Text>
        
        <View style={styles.busBadge}>
          <Bus size={14} color="#3B82F6" />
          <Text style={styles.busText}>{busNumber}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.viewDetails}>View Details</Text>
        <ChevronRight size={14} color="#3B82F6" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    width: 220, // Rectangular card for horizontal scroll
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  content: {
    marginBottom: 20,
  },
  nameText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  gradeText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 12,
  },
  busBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  busText: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "700",
    marginLeft: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  viewDetails: {
    fontSize: 13,
    color: "#3B82F6",
    fontWeight: "600",
  },
});

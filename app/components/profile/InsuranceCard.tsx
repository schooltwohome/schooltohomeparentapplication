import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { ShieldCheck } from "lucide-react-native";

interface InsuranceCardProps {
  type: string;
  policyNumber: string;
}

export default function InsuranceCard({ type, policyNumber }: InsuranceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconBackground}>
        <ShieldCheck size={24} color="#10B981" />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.typeText}>{type}</Text>
        <Text style={styles.policyText}>Policy {policyNumber}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F0FDF4", // Light green background
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  typeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#065F46",
    marginBottom: 4,
  },
  policyText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
});

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { ShieldCheck, ChevronRight } from "lucide-react-native";

interface InsuranceCardProps {
  type: string;
  policyNumber: string;
}

export default function InsuranceCard({ type, policyNumber }: InsuranceCardProps) {
  return (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        {/* Background shield watermark */}
        <View style={styles.watermarkContainer}>
          <ShieldCheck size={120} color="#10B981" opacity={0.05} />
        </View>
        
        <View style={styles.content}>
          <View style={styles.iconBackground}>
            <ShieldCheck size={26} color="#10B981" />
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.typeText}>{type}</Text>
            <View style={styles.policyBadge}>
              <Text style={styles.policyText}>Policy {policyNumber}</Text>
            </View>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Coverage valid until Dec 2026</Text>
          <ChevronRight size={14} color="#059669" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    paddingBottom: 8,
  },
  card: {
    backgroundColor: "#F0FDF4",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "#DCFCE7",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  watermarkContainer: {
    position: "absolute",
    right: -20,
    bottom: -20,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconBackground: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
  },
  typeText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#064E3B",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  policyBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  policyText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(16, 185, 129, 0.1)",
    paddingTop: 16,
  },
  footerText: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "600",
  },
});

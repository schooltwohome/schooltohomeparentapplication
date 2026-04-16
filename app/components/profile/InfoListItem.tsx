import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LucideIcon } from "lucide-react-native";

interface InfoListItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

export default function InfoListItem({ icon: Icon, label, value }: InfoListItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon size={20} color="#64748B" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: "#334155",
    fontWeight: "500",
  },
});

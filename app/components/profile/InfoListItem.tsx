import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LucideIcon } from "lucide-react-native";

export type InfoRowKind = "email" | "phone" | "address";

const TINT: Record<
  InfoRowKind,
  { iconBg: string; iconFg: string }
> = {
  email: { iconBg: "#EFF6FF", iconFg: "#2563EB" },
  phone: { iconBg: "#F0FDF4", iconFg: "#16A34A" },
  address: { iconBg: "#FFF7ED", iconFg: "#EA580C" },
};

interface InfoListItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
  kind: InfoRowKind;
}

export default function InfoListItem({ icon: Icon, label, value, kind }: InfoListItemProps) {
  const t = TINT[kind];
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: t.iconBg }]}>
        <Icon size={20} color={t.iconFg} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={3}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    paddingTop: 1,
  },
  label: {
    fontSize: 11,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "600",
    lineHeight: 21,
  },
});

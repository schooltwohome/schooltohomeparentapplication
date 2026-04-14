import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Bell } from "lucide-react-native";

interface HomeHeaderProps {
  greeting: string;
  userName: string;
}

export default function HomeHeader({ greeting, userName }: HomeHeaderProps) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.subGreeting}>{userName}</Text>
      </View>
      <TouchableOpacity style={styles.notificationBtn}>
        <Bell size={24} color="#0F172A" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  subGreeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 4,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
});

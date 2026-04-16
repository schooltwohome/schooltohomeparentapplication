import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CheckCheck } from "lucide-react-native";

interface AlertsHeaderProps {
  unreadCount: number;
  onMarkAllRead: () => void;
}

export default function AlertsHeader({ unreadCount, onMarkAllRead }: AlertsHeaderProps) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>
          You have <Text style={styles.highlight}>{unreadCount} unread</Text> notifications
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.markReadBtn} 
        onPress={unreadCount > 0 ? onMarkAllRead : undefined}
        disabled={unreadCount === 0}
      >
        <CheckCheck size={16} color={unreadCount > 0 ? "#4F46E5" : "#94A3B8"} />
        <Text style={[styles.markReadText, unreadCount === 0 && styles.disabledText]}>
          Mark all read
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  highlight: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  markReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  markReadText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4F46E5",
    marginLeft: 6,
  },
  disabledText: {
    color: "#94A3B8",
  },
});

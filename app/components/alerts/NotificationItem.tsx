import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { 
  Bus, 
  UserCheck, 
  TriangleAlert, 
  MapPin, 
  CalendarClock,
  Circle
} from "lucide-react-native";

export interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "bus" | "board" | "delay" | "arrive" | "update";
  isRead: boolean;
  onPress?: () => void;
}

const getIcon = (type: string, color: string) => {
  switch (type) {
    case "bus":
      return <Bus size={20} color={color} />;
    case "board":
      return <UserCheck size={20} color={color} />;
    case "delay":
      return <TriangleAlert size={20} color={color} />;
    case "arrive":
      return <MapPin size={20} color={color} />;
    case "update":
      return <CalendarClock size={20} color={color} />;
    default:
      return <Bus size={20} color={color} />;
  }
};

const getIconColors = (type: string) => {
  switch (type) {
    case "bus":
      return { bg: "#EFF6FF", icon: "#3B82F6" };
    case "board":
      return { bg: "#ECFDF5", icon: "#10B981" };
    case "delay":
      return { bg: "#FEF2F2", icon: "#EF4444" };
    case "arrive":
      return { bg: "#F5F3FF", icon: "#8B5CF6" };
    case "update":
      return { bg: "#FFF7ED", icon: "#F59E0B" };
    default:
      return { bg: "#F1F5F9", icon: "#64748B" };
  }
};

export default function NotificationItem({
  title,
  message,
  time,
  type,
  isRead,
  onPress,
}: NotificationItemProps) {
  const colors = getIconColors(type);

  return (
    <TouchableOpacity 
      style={[styles.container, !isRead && styles.unreadContainer]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
        {getIcon(type, colors.icon)}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, !isRead && styles.unreadTitle]}>{title}</Text>
          {!isRead && (
            <Circle size={8} fill="#4F46E5" color="#4F46E5" style={styles.unreadDot} />
          )}
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  unreadContainer: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    flex: 1,
  },
  unreadTitle: {
    color: "#0F172A",
  },
  unreadDot: {
    marginLeft: 8,
  },
  message: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 8,
  },
  time: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
});

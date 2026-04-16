import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Animated } from "react-native";
import AlertsHeader from "./AlertsHeader";
import NotificationItem, { NotificationItemProps } from "./NotificationItem";

const MOCK_NOTIFICATIONS: NotificationItemProps[] = [
  {
    id: "1",
    title: "Bus Arriving Soon",
    message: "Bus #SB-042 will arrive at your stop in 5 minutes",
    time: "2 mins ago",
    type: "bus",
    isRead: false,
  },
  {
    id: "2",
    title: "Student Boarded",
    message: "Liam has boarded the bus at Stop #12",
    time: "25 mins ago",
    type: "board",
    isRead: false,
  },
  {
    id: "3",
    title: "Route Delay",
    message: "Bus running 10 minutes late due to traffic",
    time: "1 hour ago",
    type: "delay",
    isRead: false,
  },
  {
    id: "4",
    title: "Arrived at School",
    message: "Bus #SB-042 has arrived at Lincoln Elementary",
    time: "Yesterday",
    type: "arrive",
    isRead: true,
  },
  {
    id: "5",
    title: "Schedule Update",
    message: "Tomorrow's pickup time changed to 7:45 AM",
    time: "Yesterday",
    type: "update",
    isRead: true,
  },
];

export default function AlertsScreen() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationPress = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  return (
    <View style={styles.container}>
      <AlertsHeader 
        unreadCount={unreadCount} 
        onMarkAllRead={handleMarkAllRead} 
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.map((item) => (
          <NotificationItem
            key={item.id}
            {...item}
            onPress={() => handleNotificationPress(item.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 120, // Space for bottom tabs
  },
});

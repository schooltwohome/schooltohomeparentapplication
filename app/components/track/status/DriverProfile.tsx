import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native";
import { Phone, MessageSquare, User, Bus } from "lucide-react-native";

export default function DriverProfile() {
  const handleCall = () => {
    Linking.openURL(Platform.OS === 'ios' ? 'telprompt:1234567890' : 'tel:1234567890');
  };

  const handleMessage = () => {
    Linking.openURL(Platform.OS === 'ios' ? 'sms:1234567890' : 'sms:1234567890');
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoSection}>
        <View style={styles.avatar}>
          <User size={24} color="#3B82F6" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.busNumber}>Bus #SB-042</Text>
          <Text style={styles.driverName}>Driver: John Smith</Text>
        </View>
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
          <Phone size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleMessage}>
          <MessageSquare size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    justifyContent: "center",
  },
  busNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  driverName: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  actionsSection: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
});

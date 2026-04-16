import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Image } from "react-native";
import { Phone, MessageSquare, User, Bus, Star, CheckCircle2 } from "lucide-react-native";

export default function DriverProfile() {
  const handleCall = () => {
    Linking.openURL(Platform.OS === 'ios' ? 'telprompt:1234567890' : 'tel:1234567890');
  };

  const handleMessage = () => {
    Linking.openURL(Platform.OS === 'ios' ? 'sms:1234567890' : 'sms:1234567890');
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop' }} 
            style={styles.avatarImage} 
          />
          <View style={styles.verifiedBadge}>
            <CheckCircle2 size={12} color="#FFFFFF" fill="#3B82F6" />
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.topRow}>
            <View style={styles.busBadge}>
              <Bus size={12} color="#3B82F6" style={{ marginRight: 4 }} />
              <Text style={styles.busId}>SB-042</Text>
            </View>
            <Text style={styles.timeText} numberOfLines={1}>ETA 8:45 AM</Text>
          </View>
          <Text style={styles.driverName} numberOfLines={1}>John Smith</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.callBtn]} 
          onPress={handleCall}
          activeOpacity={0.7}
        >
          <Phone size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.msgBtn]} 
          onPress={handleMessage}
          activeOpacity={0.7}
        >
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
    marginBottom: 24,
    paddingVertical: 4,
    width: '100%', // Ensure it stays within bounds
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Allow this section to take available space
    marginRight: 10, // Spacer between sections
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 1,
  },
  infoContainer: {
    marginLeft: 12, // Slightly reduced
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    flexShrink: 1,
  },
  busBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
  },
  busId: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 0.5,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  rightSection: {
    flexDirection: "row",
    gap: 8, // Slightly reduced gap
    alignItems: 'center',
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  callBtn: {
    backgroundColor: "#3B82F6",
  },
  msgBtn: {
    backgroundColor: "#F1F5F9",
  },
});

import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Dimensions } from "react-native";
import { Bell, Shield, LifeBuoy, LogOut } from "lucide-react-native";
import ProfileInfoCard from "./ProfileInfoCard";
import ChildInfoCard from "./ChildInfoCard";
import InsuranceCard from "./InsuranceCard";
import SettingsItem from "./SettingsItem";

const { width } = Dimensions.get("window");
const CARD_WIDTH = 220;
const CARD_MARGIN = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;

export default function ProfileScreen() {
  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => console.log("Sign Out Pressed") }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.subtitle}>Manage your account and details</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Parent Info */}
        <View style={styles.paddingContainer}>
          <ProfileInfoCard />
        </View>

        {/* My Children Section - IMPROVED UI */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Children</Text>
            <Text style={styles.sectionBadge}>2 Students</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.childrenCarousel}
            decelerationRate="fast"
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="start"
          >
            <ChildInfoCard 
              initial="E" 
              name="Emma Johnson" 
              grade="5" 
              busNumber="SB-042" 
              avatarColor="#8B5CF6" 
            />
            <ChildInfoCard 
              initial="L" 
              name="Liam Johnson" 
              grade="3" 
              busNumber="SB-042" 
              avatarColor="#EC4899" 
            />
          </ScrollView>
        </View>

        {/* Insurance Info Section */}
        <View style={styles.section}>
          <View style={styles.paddingContainer}>
            <Text style={styles.sectionTitle}>Insurance Info</Text>
            <InsuranceCard 
              type="Student Travel Insurance" 
              policyNumber="#INS-2024-0042" 
            />
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <View style={styles.paddingContainer}>
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>
          <View style={styles.settingsCard}>
            <SettingsItem 
              icon={Bell} 
              label="Push Notifications" 
              onPress={() => {}} 
            />
            <View style={styles.settingDivider} />
            <SettingsItem 
              icon={Shield} 
              label="Privacy & Security" 
              onPress={() => {}} 
            />
            <View style={styles.settingDivider} />
            <SettingsItem 
              icon={LifeBuoy} 
              label="Help & Support" 
              onPress={() => {}} 
            />
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <SettingsItem 
            icon={LogOut} 
            label="Sign Out" 
            onPress={handleSignOut} 
            isDestructive={true}
            showChevron={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 120, // Space for bottom tabs
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B82F6",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  childrenCarousel: {
    paddingLeft: 24,
    paddingRight: 8, // Less padding on right to show next card is available
    paddingBottom: 10, // Shadow space
  },
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginHorizontal: 24,
  },
  settingDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 16,
  },
  paddingContainer: {
    paddingHorizontal: 24,
  },
  logoutSection: {
    marginTop: 32,
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginHorizontal: 24,
  },
  // Ensure other static sections also have horizontal padding
  staticSection: {
    paddingHorizontal: 24,
  }
});

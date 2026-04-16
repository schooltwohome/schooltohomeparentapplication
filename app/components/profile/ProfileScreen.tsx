import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { Bell, Shield, LifeBuoy, LogOut } from "lucide-react-native";
import ProfileInfoCard from "./ProfileInfoCard";
import ChildInfoCard from "./ChildInfoCard";
import InsuranceCard from "./InsuranceCard";
import SettingsItem from "./SettingsItem";

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
        <ProfileInfoCard />

        {/* My Children Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Children</Text>
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
        </View>

        {/* Insurance Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insurance Info</Text>
          <InsuranceCard 
            type="Student Travel Insurance" 
            policyNumber="#INS-2024-0042" 
          />
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
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
    paddingHorizontal: 24,
    paddingBottom: 120, // Space for bottom tabs
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  settingDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 16,
  },
  logoutSection: {
    marginTop: 32,
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
});

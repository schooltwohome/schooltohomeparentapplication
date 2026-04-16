import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Dimensions } from "react-native";
import { Bell, Shield, LifeBuoy, LogOut } from "lucide-react-native";
import ProfileInfoCard from "./ProfileInfoCard";
import ChildInfoCard from "./ChildInfoCard";
import InsuranceCard from "./InsuranceCard";
import SettingsItem from "./SettingsItem";
import ChildDetailsModal from "./ChildDetailsModal";

const { width } = Dimensions.get("window");
const CARD_WIDTH = 220;
const CARD_MARGIN = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;

// Detailed child data
const CHILDREN_DATA = [
  {
    id: "1",
    initial: "E",
    name: "Emma Johnson",
    grade: "5",
    section: "A",
    busNumber: "SB-042",
    avatarColor: "#818CF8", // Indigo 400
    teacher: "Mrs. Sarah White",
    driverName: "Robert Miller",
    driverPhone: "+1 (555) 987-6543",
    emergencyContact: "Sarah Johnson (Mother)",
  },
  {
    id: "2",
    initial: "L",
    name: "Liam Johnson",
    grade: "3",
    section: "C",
    busNumber: "SB-042",
    avatarColor: "#F472B6", // Pink 400
    teacher: "Mr. James Wilson",
    driverName: "Robert Miller",
    driverPhone: "+1 (555) 987-6543",
    emergencyContact: "Sarah Johnson (Mother)",
  },
];

export default function ProfileScreen() {
  const [isChildModalVisible, setIsChildModalVisible] = useState(false);
  const [selectedChild, setSelectedChild] = useState<any>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

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

  const openChildDetails = (child: any) => {
    setSelectedChild(child);
    setIsChildModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Background decoration */}
      <View style={styles.bgDecoration} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>{greeting},</Text>
          <Text style={styles.title}>Sarah Johnson</Text>
        </View>
        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Active</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Parent Info */}
        <View style={styles.paddingContainer}>
          <ProfileInfoCard />
        </View>

        {/* My Children Section - PREMIUM UI */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>My Children</Text>
              <Text style={styles.sectionSubtitle}>Tap to view school updates</Text>
            </View>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{CHILDREN_DATA.length}</Text>
            </View>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.childrenCarousel}
            decelerationRate="fast"
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="start"
          >
            {CHILDREN_DATA.map((child) => (
              <ChildInfoCard 
                key={child.id}
                initial={child.initial} 
                name={child.name} 
                grade={child.grade} 
                busNumber={child.busNumber} 
                avatarColor={child.avatarColor}
                onPress={() => openChildDetails(child)} 
              />
            ))}
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

      {/* Child Details Modal */}
      <ChildDetailsModal 
        isVisible={isChildModalVisible}
        onClose={() => setIsChildModalVisible(false)}
        child={selectedChild}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  bgDecoration: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#EFF6FF",
    opacity: 0.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greetingText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 2,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },
  activeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
  },
  scrollContent: {
    paddingBottom: 130, // Increased for bottom tabs
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
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: 2,
  },
  sectionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
  },
  childrenCarousel: {
    paddingLeft: 24,
    paddingRight: 8,
    paddingBottom: 16, // Extra space for shadows
  },
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginHorizontal: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
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
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginHorizontal: 24,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
});

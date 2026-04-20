import React, { useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import {
  Bell,
  Shield,
  LifeBuoy,
  LogOut,
  Users,
  ShieldCheck,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import ProfileInfoCard, { useProfileInfoFromParent } from "./ProfileInfoCard";
import ChildInfoCard from "./ChildInfoCard";
import SettingsItem from "./SettingsItem";
import GroupedPreferenceRow from "./GroupedPreferenceRow";
import ChildDetailsModal from "./ChildDetailsModal";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { logoutThunk } from "../../../store/slices/authSlice";
import type { UiChild } from "../../../store/slices/authSlice";
import {
  HelpSupportModal,
  PrivacySecurityModal,
  PushNotificationsModal,
  pushStatusSubtitle,
} from "./settings/ProfileSettingsModals";
import {
  getPushPermissionStatus,
  type PushPermissionStatus,
} from "../../../lib/pushNotifications";

const CARD_WIDTH = 220;
const CARD_MARGIN = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const profile = useAppSelector((s) => s.auth.profile);
  const children = useAppSelector((s) => s.auth.children);
  const [isChildModalVisible, setIsChildModalVisible] = useState(false);
  const [selectedChild, setSelectedChild] = useState<UiChild | null>(null);
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<PushPermissionStatus>("undetermined");

  const refreshPushStatus = useCallback(async () => {
    setPushStatus(await getPushPermissionStatus());
  }, []);

  useEffect(() => {
    if (!pushModalOpen && !privacyModalOpen && !helpModalOpen) {
      void refreshPushStatus();
    }
  }, [pushModalOpen, privacyModalOpen, helpModalOpen, refreshPushStatus]);

  const profileInfo = useProfileInfoFromParent(
    profile?.name,
    profile?.email,
    profile?.phone,
    profile?.parent_profile?.address
  );

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
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await dispatch(logoutThunk());
            router.replace("/screens/Auth/LoginScreen" as any);
          },
        },
      ]
    );
  };

  const openChildDetails = (child: UiChild) => {
    setSelectedChild(child);
    setIsChildModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerEyebrow}>Profile</Text>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {profileInfo.displayName}
          </Text>
          <Text style={styles.headerSubline}>Manage your account & preferences</Text>
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
        <View style={styles.paddingContainer}>
          <ProfileInfoCard profile={profileInfo} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <View style={styles.sectionHeadingLeft}>
              <View style={styles.sectionAccent} />
              <View>
                <Text style={styles.sectionEyebrow}>Family</Text>
                <Text style={styles.sectionTitle}>My children</Text>
                <Text style={styles.sectionSubtitle}>Tap a card for school & bus details</Text>
              </View>
            </View>
            <View style={styles.countPill}>
              <Users size={14} color="#475569" />
              <Text style={styles.countPillText}>{children.length}</Text>
            </View>
          </View>

          {children.length === 0 ? (
            <View style={styles.paddingContainer}>
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Users size={26} color="#64748B" />
                </View>
                <Text style={styles.emptyTitle}>No students linked</Text>
                <Text style={styles.emptyBody}>
                  Ask your school administrator to connect your children to this parent account.
                </Text>
              </View>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.childrenCarousel}
              decelerationRate="fast"
              snapToInterval={SNAP_INTERVAL}
              snapToAlignment="start"
            >
              {children.map((child) => (
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
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.paddingContainer}>
            <View style={styles.sectionHeadingLeft}>
              <View style={[styles.sectionAccent, { backgroundColor: "#6366F1" }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionEyebrow}>Coverage</Text>
                <Text style={styles.sectionTitle}>Insurance</Text>
              </View>
            </View>
            <View style={styles.insuranceCard}>
              <View style={styles.insuranceIcon}>
                <ShieldCheck size={22} color="#4F46E5" />
              </View>
              <View style={styles.insuranceCopy}>
                <Text style={styles.insuranceTitle}>Managed by your school</Text>
                <Text style={styles.insuranceHint}>
                  Policy details and coverage questions are handled directly by your school’s office.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.preferencesSection}>
          <Text style={styles.preferencesSectionLabel}>App preferences</Text>
          <View style={styles.preferencesGroup}>
            <GroupedPreferenceRow
              icon={Bell}
              label="Push notifications"
              subtitle={pushStatusSubtitle(pushStatus)}
              onPress={() => setPushModalOpen(true)}
            />
            <GroupedPreferenceRow
              icon={Shield}
              label="Privacy & security"
              onPress={() => setPrivacyModalOpen(true)}
            />
            <GroupedPreferenceRow
              icon={LifeBuoy}
              label="Help & support"
              onPress={() => setHelpModalOpen(true)}
              isLast
            />
          </View>
        </View>

        <View style={styles.logoutSection}>
          <Text style={styles.logoutCaption}>Session</Text>
          <View style={styles.logoutCard}>
            <SettingsItem
              icon={LogOut}
              label="Sign out"
              onPress={handleSignOut}
              isDestructive={true}
              showChevron={false}
            />
          </View>
          <Text style={styles.logoutHint}>You’ll need to sign in again to view alerts and tracking.</Text>
        </View>
      </ScrollView>

      {/* Child Details Modal */}
      <ChildDetailsModal 
        isVisible={isChildModalVisible}
        onClose={() => setIsChildModalVisible(false)}
        child={selectedChild}
      />

      <PushNotificationsModal
        visible={pushModalOpen}
        onClose={() => setPushModalOpen(false)}
      />
      <PrivacySecurityModal
        visible={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
      <HelpSupportModal
        visible={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#3B82F6",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  greetingText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "600",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 4,
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  headerSubline: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: 8,
    lineHeight: 18,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    marginTop: 22,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginRight: 7,
  },
  activeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#047857",
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  section: {
    marginTop: 28,
  },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionHeadingLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  sectionAccent: {
    width: 4,
    borderRadius: 2,
    backgroundColor: "#3B82F6",
    marginRight: 12,
    marginTop: 4,
    minHeight: 36,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 2,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: 4,
    lineHeight: 18,
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  countPillText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 21,
    textAlign: "center",
  },
  insuranceCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#EEF2FF",
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#312E81",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  insuranceIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  insuranceCopy: {
    flex: 1,
  },
  insuranceTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  insuranceHint: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 21,
  },
  childrenCarousel: {
    paddingLeft: 24,
    paddingRight: 8,
    paddingBottom: 16,
  },
  preferencesSection: {
    marginTop: 28,
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  preferencesSectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  preferencesGroup: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  paddingContainer: {
    paddingHorizontal: 24,
  },
  logoutSection: {
    marginTop: 28,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  logoutCaption: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },
  logoutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    ...Platform.select({
      ios: {
        shadowColor: "#B91C1C",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  logoutHint: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 10,
    marginLeft: 4,
    lineHeight: 17,
  },
});

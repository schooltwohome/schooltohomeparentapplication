import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { X, Bus, Phone, GraduationCap, MapPin, ExternalLink, Shield } from "lucide-react-native";

interface ChildDetails {
  name: string;
  grade: string;
  initial: string;
  avatarColor: string;
  busNumber: string;
  teacher: string;
  section: string;
  driverName: string;
  driverPhone: string;
  emergencyContact: string;
}

interface ChildDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  child: ChildDetails | null;
}

// Memoized content for performance with explicit display name
const ModalContent = memo(function ModalContent({ child }: { child: ChildDetails }) {
  return (
    <View style={styles.contentWrapper}>
      {/* Profile Overview */}
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: child.avatarColor }]}>
          <View style={styles.avatarInnerGlow} />
          <Text style={styles.avatarText}>{child.initial}</Text>
        </View>
        <Text style={styles.nameText}>{child.name}</Text>
        <View style={styles.gradeBadge}>
          <GraduationCap size={14} color="#64748B" />
          <Text style={styles.gradeText}>Grade {child.grade} • Section {child.section}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        {/* Academic Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBg, { backgroundColor: "#EEF2FF" }]}>
              <GraduationCap size={16} color="#6366F1" />
            </View>
            <Text style={styles.cardTitle}>Academic Records</Text>
          </View>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Class Teacher</Text>
              <Text style={styles.detailValue}>{child.teacher}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>98% Attendance</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Transit Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBg, { backgroundColor: "#EFF6FF" }]}>
              <Bus size={16} color="#3B82F6" />
            </View>
            <Text style={styles.cardTitle}>Transit Info</Text>
          </View>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Assigned Bus</Text>
              <Text style={styles.detailValue}>{child.busNumber}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bus Driver</Text>
              <Text style={styles.detailValue}>{child.driverName}</Text>
            </View>
            <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
              <Phone size={14} color="#3B82F6" />
              <Text style={styles.actionText}>Call Driver</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety Card */}
        <View style={[styles.infoCard, styles.emergencyCard]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBg, { backgroundColor: "#FEF2F2" }]}>
              <Shield size={16} color="#EF4444" />
            </View>
            <Text style={[styles.cardTitle, { color: "#991B1B" }]}>Health & Safety</Text>
          </View>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Emergency Contact</Text>
              <Text style={styles.detailValue}>{child.emergencyContact}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Medical Clearances</Text>
              <Text style={[styles.detailValue, { color: "#059669" }]}>Verified ✓</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Section */}
      <View style={styles.footerActions}>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
          <Bus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.primaryBtnText}>Track Real-time Journey</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.7}>
          <ExternalLink size={18} color="#475569" />
          <Text style={styles.secondaryBtnText}>View Digital Report Card</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function ChildDetailsModal({
  isVisible,
  onClose,
  child,
}: ChildDetailsModalProps) {
  if (!child) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.centeredView}>
          <Pressable style={styles.modalView}>
            {/* Grab Handle for UX hint */}
            <View style={styles.handleBar}>
              <View style={styles.handle} />
            </View>

            {/* Modal Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Student Details</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.6}>
                <View style={styles.closeIconBg}>
                  <X size={18} color="#64748B" />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              scrollEventThrottle={16}
              removeClippedSubviews={Platform.OS === "android"}
              nestedScrollEnabled
              overScrollMode="never"
            >
              <ModalContent child={child} />
            </ScrollView>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-end",
  },
  centeredView: {
    width: "100%",
  },
  modalView: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    width: "100%",
    maxHeight: "92%",
    // Simplified Modal Shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
    overflow: "hidden",
  },
  handleBar: {
    alignItems: "center",
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 2,
  },
  closeIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  contentWrapper: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 36,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
    // Simplified Avatar Shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarInnerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  avatarText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  nameText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  gradeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    // Extreme light shadow - better for performance
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  gradeText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
    marginLeft: 10,
  },
  infoGrid: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    // Minimal shadow inside scrollview
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emergencyCard: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FEE2E2",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  cardIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.3,
  },
  detailsContainer: {
    gap: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    opacity: 0.8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#15803D",
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9FF",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  actionText: {
    fontSize: 14,
    color: "#0369A1",
    fontWeight: "800",
    marginLeft: 8,
  },
  footerActions: {
    marginTop: 40,
    gap: 14,
  },
  primaryBtn: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    // Keep heavy shadow on main button as it's static at bottom
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 12,
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  secondaryBtnText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 10,
  },
});

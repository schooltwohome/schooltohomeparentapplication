import React from "react";
import { View, Text, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { Bus, ChevronRight, Sparkles } from "lucide-react-native";

interface ChildInfoCardProps {
  name: string;
  grade: string;
  busNumber: string;
  initial: string;
  avatarColor: string;
  onPress: () => void;
}

export default function ChildInfoCard({ 
  name, 
  grade, 
  busNumber, 
  initial, 
  avatarColor,
  onPress
}: ChildInfoCardProps) {
  return (
    <View style={styles.cardWrapper}>
      {/* Dynamic color shadow/glow behind the card */}
      <View style={[styles.cardGlow, { backgroundColor: avatarColor, opacity: 0.1 }]} />
      
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9} 
        onPress={onPress}
      >
        <View style={styles.topRow}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <View style={styles.avatarInnerGlow} />
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.sparkleContainer}>
            <Sparkles size={16} color={avatarColor} opacity={0.6} />
          </View>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.nameText} numberOfLines={1}>{name}</Text>
          <View style={styles.gradeRow}>
            <Text style={styles.gradeText}>Grade {grade}</Text>
            <View style={styles.dot} />
            <Text style={styles.statusText}>Active</Text>
          </View>
          
          <View style={[styles.busBadge, { backgroundColor: `${avatarColor}10` }]}>
            <Bus size={14} color={avatarColor} />
            <Text style={[styles.busText, { color: avatarColor }]}>{busNumber}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.viewDetails, { color: avatarColor }]}>View Details</Text>
          <View style={[styles.chevronBg, { backgroundColor: `${avatarColor}15` }]}>
            <ChevronRight size={12} color={avatarColor} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    position: "relative",
    marginRight: 16,
    paddingBottom: 8,
  },
  cardGlow: {
    position: "absolute",
    top: 20,
    left: 10,
    right: 10,
    bottom: 0,
    borderRadius: 24,
    filter: "blur(15px)",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    width: 220,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.7)",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  avatarInnerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 18,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  sparkleContainer: {
    marginTop: 4,
  },
  content: {
    marginBottom: 20,
  },
  nameText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  gradeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  gradeText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 8,
  },
  statusText: {
    fontSize: 13,
    color: "#22C55E",
    fontWeight: "700",
  },
  busBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  busText: {
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 14,
  },
  viewDetails: {
    fontSize: 13,
    fontWeight: "700",
  },
  chevronBg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
});

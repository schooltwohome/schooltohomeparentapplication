import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { LucideIcon, ChevronRight } from "lucide-react-native";

export type SettingsAccent = {
  backgroundColor: string;
  iconColor: string;
};

interface SettingsItemProps {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  isDestructive?: boolean;
  showChevron?: boolean;
  accent?: SettingsAccent;
}

export default function SettingsItem({ 
  icon: Icon, 
  label,
  subtitle,
  onPress, 
  isDestructive = false,
  showChevron = true,
  accent,
}: SettingsItemProps) {
  const iconBg = isDestructive
    ? styles.destructiveIconBackground
    : accent
      ? { backgroundColor: accent.backgroundColor }
      : styles.neutralIconBackground;
  const iconColor = isDestructive ? "#EF4444" : accent?.iconColor ?? "#475569";

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.65}
    >
      <View style={[styles.iconContainer, iconBg]}>
        <Icon size={20} color={iconColor} />
      </View>
      
      <View style={styles.labelBlock}>
        <Text style={[styles.label, isDestructive && styles.destructiveLabel]}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {showChevron && !isDestructive && (
        <ChevronRight size={18} color="#CBD5E1" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  neutralIconBackground: {
    backgroundColor: "#F1F5F9",
  },
  destructiveIconBackground: {
    backgroundColor: "#FEF2F2",
  },
  labelBlock: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
    marginTop: 2,
  },
  destructiveLabel: {
    color: "#EF4444",
  },
});

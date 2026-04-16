import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { LucideIcon, ChevronRight } from "lucide-react-native";

interface SettingsItemProps {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  isDestructive?: boolean;
  showChevron?: boolean;
}

export default function SettingsItem({ 
  icon: Icon, 
  label, 
  onPress, 
  isDestructive = false,
  showChevron = true
}: SettingsItemProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={[styles.iconContainer, isDestructive && styles.destructiveIconBackground]}>
        <Icon size={20} color={isDestructive ? "#EF4444" : "#64748B"} />
      </View>
      
      <Text style={[styles.label, isDestructive && styles.destructiveLabel]}>
        {label}
      </Text>

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
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  destructiveIconBackground: {
    backgroundColor: "#FEF2F2",
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  destructiveLabel: {
    color: "#EF4444",
  },
});

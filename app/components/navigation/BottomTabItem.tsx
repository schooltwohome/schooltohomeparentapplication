import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { LucideIcon } from "lucide-react-native";

interface BottomTabItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export default function BottomTabItem({ 
  icon: Icon, 
  label, 
  isActive, 
  onPress 
}: BottomTabItemProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
        <Icon 
          size={24} 
          color={isActive ? "#3B82F6" : "#64748B"} 
          strokeWidth={isActive ? 2.5 : 2}
        />
      </View>
      <Text style={[styles.label, isActive && styles.activeLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: "#EFF6FF", // Light blue background for active icon
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  activeLabel: {
    color: "#3B82F6",
    fontWeight: "600",
  },
});

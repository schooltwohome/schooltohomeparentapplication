import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Home, LocateFixed, Bell, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomTabItem from "./BottomTabItem";

interface BottomTabsProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export default function BottomTabs({ activeTab, onTabPress }: BottomTabsProps) {
  const insets = useSafeAreaInsets();
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "track", label: "Track", icon: LocateFixed },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <View style={[
      styles.container, 
      { paddingBottom: Math.max(insets.bottom, 16) }
    ]}>
      <View style={styles.content}>
        {tabs.map((tab) => (
          <BottomTabItem
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            isActive={activeTab === tab.id}
            onPress={() => onTabPress(tab.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    height: 72,
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    // Modern shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
});

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MapPin } from "lucide-react-native";

interface PermissionPromptProps {
  onGrantPermission: () => void;
  isLoading: boolean;
}

export default function PermissionPrompt({ onGrantPermission, isLoading }: PermissionPromptProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MapPin size={48} color="#3B82F6" />
      </View>
      <Text style={styles.title}>Enable Location</Text>
      <Text style={styles.description}>
        We need access to your location to show you where the bus is relative to you, ensuring maximum safety and accurate tracking.
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={onGrantPermission}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? "Requesting..." : "Allow Location Access"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    width: "100%",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: "#94A3B8",
    shadowOpacity: 0,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

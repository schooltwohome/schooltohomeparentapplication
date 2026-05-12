import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { MapPin } from "lucide-react-native";
import LocationDisclosureModal from "../permissions/LocationDisclosureModal";

const DISCLOSURE_KEY = "location_disclosure_seen_v1";

async function getDisclosureSeen(): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      const ls = (globalThis as unknown as { localStorage?: Storage }).localStorage;
      return ls?.getItem(DISCLOSURE_KEY) === "1";
    }
    const v = await SecureStore.getItemAsync(DISCLOSURE_KEY);
    return v === "1";
  } catch {
    return false;
  }
}

async function setDisclosureSeen(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      const ls = (globalThis as unknown as { localStorage?: Storage }).localStorage;
      ls?.setItem(DISCLOSURE_KEY, "1");
      return;
    }
    await SecureStore.setItemAsync(DISCLOSURE_KEY, "1");
  } catch {
    /* ignore */
  }
}

interface PermissionPromptProps {
  onGrantPermission: () => void | Promise<void>;
  isLoading: boolean;
}

export default function PermissionPrompt({ onGrantPermission, isLoading }: PermissionPromptProps) {
  const [ready, setReady] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seen = await getDisclosureSeen();
      if (!cancelled) {
        setShowDisclosure(!seen);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNotNow = useCallback(async () => {
    await setDisclosureSeen();
    setShowDisclosure(false);
  }, []);

  const handleContinue = useCallback(async () => {
    await setDisclosureSeen();
    setShowDisclosure(false);
    await onGrantPermission();
  }, [onGrantPermission]);

  if (!ready) {
    return (
      <View style={[styles.container, styles.centerOnly]}>
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LocationDisclosureModal
        visible={showDisclosure}
        onNotNow={handleNotNow}
        onContinue={handleContinue}
      />

      {!showDisclosure ? (
        <>
          <View style={styles.iconContainer}>
            <MapPin size={48} color="#3B82F6" />
          </View>
          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.description}>
            We need access to your location to show you where the bus is relative to you, ensuring
            maximum safety and accurate tracking.
          </Text>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={() => void onGrantPermission()}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Requesting..." : "Allow Location Access"}
            </Text>
          </TouchableOpacity>
        </>
      ) : null}
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
  centerOnly: {
    justifyContent: "center",
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

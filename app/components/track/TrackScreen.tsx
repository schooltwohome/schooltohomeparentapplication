import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import * as Location from "expo-location";
import LiveMap from "./LiveMap";
import BusLiveStatus from "./BusLiveStatus";
import PermissionPrompt from "./PermissionPrompt";

export default function TrackScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check initial permission status silently
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        setHasPermission(true);
      } else {
        setHasPermission(false);
      }
    })();
  }, []);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoading(false);
    }
  };

  // While checking initial status
  if (hasPermission === null) {
    return <View style={styles.container} />;
  }

  // Not granted: show the educational prompt
  if (!hasPermission) {
    return (
      <PermissionPrompt 
        onGrantPermission={handleRequestPermission} 
        isLoading={isLoading} 
      />
    );
  }

  // Granted: render the full map UI
  return (
    <View style={styles.container}>
      <LiveMap />
      <BusLiveStatus />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});

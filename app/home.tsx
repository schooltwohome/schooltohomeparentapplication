import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { AppState, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeHeader from "./components/home/HomeHeader";
import BottomTabs from "./components/navigation/BottomTabs";
import HomeDashboard from "./components/home/HomeDashboard";
import TrackScreen from "./components/track/TrackScreen";
import AlertsScreen from "./components/alerts/AlertsScreen";
import ProfileScreen from "./components/profile/ProfileScreen";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  consumePendingPushNavigation,
  fetchNotifications,
} from "../store/slices/notificationsSlice";
import { getParentTracking } from "../services/parentApi";

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = React.useState("home");
  const displayName = useAppSelector((s) => s.auth.profile?.name?.trim()) || "Parent";
  const authToken = useAppSelector((s) => s.auth.token);
  const pendingPushNavigation = useAppSelector(
    (s) => s.notifications.pendingPushNavigation
  );
  const notificationItems = useAppSelector((s) => s.notifications.items);

  const [hasLiveTripFromTracking, setHasLiveTripFromTracking] = useState(false);

  const refreshLiveTrip = useCallback(async () => {
    if (!authToken) {
      setHasLiveTripFromTracking(false);
      return;
    }
    try {
      const { segments } = await getParentTracking(authToken);
      setHasLiveTripFromTracking(
        segments.some(
          (s) => s.tripStatus === "scheduled" || s.tripStatus === "on_going"
        )
      );
    } catch {
      setHasLiveTripFromTracking(false);
    }
  }, [authToken]);

  React.useEffect(() => {
    if (!authToken) return;
    dispatch(fetchNotifications());
  }, [authToken, dispatch]);

  React.useEffect(() => {
    void refreshLiveTrip();
  }, [refreshLiveTrip, notificationItems]);

  /** Pull new in-app alerts when returning from background (e.g. driver just started trip). */
  React.useEffect(() => {
    if (!authToken) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        dispatch(fetchNotifications());
        void refreshLiveTrip();
      }
    });
    return () => sub.remove();
  }, [authToken, dispatch, refreshLiveTrip]);

  React.useEffect(() => {
    if (!pendingPushNavigation) return;
    setActiveTab(pendingPushNavigation.tab);
    dispatch(consumePendingPushNavigation());
  }, [pendingPushNavigation, dispatch]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      {activeTab === "home" && (
        <HomeHeader
          greeting="Welcome Back!"
          userName={displayName}
          hasLiveTripFromTracking={hasLiveTripFromTracking}
        />
      )}

      <View style={styles.contentContainer}>
        {activeTab === "home" && (
          <HomeDashboard
            onOpenTrack={() => setActiveTab("track")}
            hasLiveTripFromTracking={hasLiveTripFromTracking}
          />
        )}
        {activeTab === "track" && <TrackScreen />}
        {activeTab === "alerts" && <AlertsScreen />}
        {activeTab === "profile" && <ProfileScreen />}
      </View>

      <BottomTabs
        activeTab={activeTab}
        onTabPress={(tab) => setActiveTab(tab)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120, // Increased to avoid overlap with bottom navigation
  },
  contentContainer: {
    flex: 1,
  },
});

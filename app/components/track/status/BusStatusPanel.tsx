import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView, Dimensions, Text, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import DriverProfile from "./DriverProfile";
import RideStatsRow from "./RideStatsRow";
import UpcomingStops from "./UpcomingStops";
import type { TrackingSegment } from "../../../../services/parentApi";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MIN_HEIGHT = 200;
const MID_HEIGHT = SCREEN_HEIGHT * 0.45;
const MAX_HEIGHT = SCREEN_HEIGHT * 0.85;

type Props = {
  segment: TrackingSegment | null;
  allSegments: TrackingSegment[];
  loading: boolean;
  staleLabel: string | null;
};

export default function BusStatusPanel({ segment, allSegments, loading, staleLabel }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT - MID_HEIGHT);
  const context = useSharedValue({ y: 0 });

  const snapPoints = useMemo(
    () => [
      SCREEN_HEIGHT - MAX_HEIGHT,
      SCREEN_HEIGHT - MID_HEIGHT,
      SCREEN_HEIGHT - MIN_HEIGHT,
    ],
    []
  );

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
      translateY.value = Math.max(translateY.value, SCREEN_HEIGHT - MAX_HEIGHT);
    })
    .onEnd((event) => {
      const targetY = event.translationY + context.value.y;
      const closest = snapPoints.reduce((prev, curr) =>
        Math.abs(curr - targetY) < Math.abs(prev - targetY) ? curr : prev
      );
      translateY.value = withTiming(closest, { duration: 300 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, animatedStyle, { height: MAX_HEIGHT }]}>
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#0F172A" />
            <Text style={styles.loadingText}>Loading route data…</Text>
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 120 },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <DriverProfile segment={segment} staleLabel={staleLabel} />
          <RideStatsRow segment={segment} linkedChildrenCount={allSegments.length} />
          <UpcomingStops segment={segment} />
        </ScrollView>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 100,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
  },
});

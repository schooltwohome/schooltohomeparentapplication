import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  runOnJS 
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import DriverProfile from "./DriverProfile";
import RideStatsRow from "./RideStatsRow";
import UpcomingStops from "./UpcomingStops";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MIN_HEIGHT = 200;
const MID_HEIGHT = SCREEN_HEIGHT * 0.45;
const MAX_HEIGHT = SCREEN_HEIGHT * 0.85;

export default function BusStatusPanel() {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT - MID_HEIGHT);
  const context = useSharedValue({ y: 0 });

  const snapPoints = useMemo(() => [
    SCREEN_HEIGHT - MAX_HEIGHT,
    SCREEN_HEIGHT - MID_HEIGHT,
    SCREEN_HEIGHT - MIN_HEIGHT
  ], []);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
      // Clamped strictly to prevent any "elastic" overflow during drag
      translateY.value = Math.max(translateY.value, SCREEN_HEIGHT - MAX_HEIGHT);
    })
    .onEnd((event) => {
      // Snapping logic
      const targetY = event.translationY + context.value.y;
      const closest = snapPoints.reduce((prev, curr) => 
        Math.abs(curr - targetY) < Math.abs(prev - targetY) ? curr : prev
      );
      // Switched to withTiming for a stiff, predictable snap without any bounce
      translateY.value = withTiming(closest, { duration: 300 });
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, animatedStyle, { height: MAX_HEIGHT }]}>
        {/* Drag Indicator Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            { paddingBottom: Math.max(insets.bottom, 16) + 120 }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <DriverProfile />
          <RideStatsRow />
          <UpcomingStops />
        </ScrollView>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0, // We use translateY to push it down
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
});

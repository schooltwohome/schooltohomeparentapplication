import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { MarkerAnimated } from "react-native-maps";
import type { AnimatedBusMarkerState } from "../../_hooks/useAnimatedBusMarker";

type Props = {
  markerState: AnimatedBusMarkerState;
  title?: string;
  isStale?: boolean;
  /** Current bus speed in km/h — drives stopped vs moving visual state. */
  speedKmh?: number | null;
};

/**
 * Uber-style animated bus pin for react-native-maps.
 *
 * Shape: a white pill (48×32) with a downward-pointing triangle tip (8px) anchored
 * at y=1.0 so the tip touches the exact map coordinate — just like Uber's car pin.
 *
 * Rotation: the outer wrapper rotates to face the direction of travel. The inner bus
 * icon counter-rotates by the same amount so it always stays upright and readable.
 *
 * States:
 *   - Moving  : white pill, amber icon, full shadow
 *   - Stopped : gray pill (#E5E7EB), icon at 45% opacity
 *   - Stale   : entire pin pulses opacity 0.5 → 1 → 0.5
 */
export default function BusMarker({
  markerState,
  title = "School bus",
  isStale = false,
  speedKmh = null,
}: Props) {
  const { animatedRegion, rotation } = markerState;
  const markerRef = useRef<React.ElementRef<typeof MarkerAnimated>>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Stale pulse loop
  useEffect(() => {
    if (isStale) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isStale, pulseAnim]);

  // Pin rotates with bearing
  const rotatePin = rotation.interpolate({
    inputRange: [-7200, -3600, 0, 3600, 7200],
    outputRange: ["-7200deg", "-3600deg", "0deg", "3600deg", "7200deg"],
    extrapolate: "extend",
  });

  // Icon counter-rotates so it stays upright regardless of pin heading
  const counterRotate = rotation.interpolate({
    inputRange: [-7200, -3600, 0, 3600, 7200],
    outputRange: ["7200deg", "3600deg", "0deg", "-3600deg", "-7200deg"],
    extrapolate: "extend",
  });

  const isStopped =
    typeof speedKmh === "number" && Number.isFinite(speedKmh) && speedKmh === 0;

  const pillBg = isStopped ? "#E5E7EB" : "#FFFFFF";
  const iconColor = isStopped ? "#94A3B8" : "#F59E0B";
  const iconOpacity = isStopped ? 0.45 : 1;
  const triangleColor = isStopped ? "#CBD5E1" : "#F59E0B";

  return (
    <MarkerAnimated
      ref={markerRef}
      coordinate={animatedRegion}
      title={title}
      anchor={{ x: 0.5, y: 1.0 }}
      tracksViewChanges={false}
    >
      <Animated.View
        style={[
          styles.wrapper,
          {
            opacity: pulseAnim,
            transform: [{ rotate: rotatePin }],
          },
        ]}
      >
        {/* Pill */}
        <View
          style={[
            styles.pill,
            { backgroundColor: pillBg },
            !isStopped && styles.pillShadow,
          ]}
        >
          <Animated.View
            style={[
              styles.iconWrap,
              {
                opacity: iconOpacity,
                transform: [{ rotate: counterRotate }],
              },
            ]}
          >
            <BusTopDownIcon color={iconColor} />
          </Animated.View>
        </View>

        {/* Triangle tip pointing down */}
        <View style={[styles.tip, { borderTopColor: triangleColor }]} />
      </Animated.View>
    </MarkerAnimated>
  );
}

/** Top-down view of a bus rendered as React Native Views — no external SVG asset. */
function BusTopDownIcon({ color }: { color: string }) {
  return (
    <View style={styles.busWrap}>
      {/* Front windshield triangle */}
      <View style={[styles.busFront, { borderBottomColor: color }]} />
      {/* Body */}
      <View style={[styles.busBody, { backgroundColor: color }]}>
        {/* Window strip */}
        <View style={styles.windowRow}>
          <View style={styles.window} />
          <View style={styles.window} />
          <View style={styles.window} />
        </View>
      </View>
      {/* Rear */}
      <View style={[styles.busRear, { backgroundColor: color }]} />
      {/* Wheels left */}
      <View style={[styles.wheelLeft, styles.wheelFront]} />
      <View style={[styles.wheelLeft, styles.wheelRear]} />
      {/* Wheels right */}
      <View style={[styles.wheelRight, styles.wheelFront]} />
      <View style={[styles.wheelRight, styles.wheelRear]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    width: 72,
    height: 62,
  },
  pill: {
    width: 72,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  pillShadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 8,
  },
  tip: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  // Top-down bus icon
  busWrap: {
    width: 34,
    height: 34,
    alignItems: "center",
    position: "relative",
  },
  busFront: {
    width: 22,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    zIndex: 1,
  },
  busBody: {
    width: 28,
    height: 20,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  busRear: {
    width: 24,
    height: 5,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    opacity: 0.7,
  },
  windowRow: {
    flexDirection: "row",
    gap: 3,
  },
  window: {
    width: 5,
    height: 5,
    borderRadius: 1.5,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  wheelLeft: {
    position: "absolute",
    left: 0,
    width: 6,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#374151",
  },
  wheelRight: {
    position: "absolute",
    right: 0,
    width: 6,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#374151",
  },
  wheelFront: {
    top: 8,
  },
  wheelRear: {
    bottom: 6,
  },
});

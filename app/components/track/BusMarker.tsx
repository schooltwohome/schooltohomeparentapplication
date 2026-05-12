import React, { useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { MarkerAnimated } from "react-native-maps";
import type { AnimatedBusMarkerState } from "../../_hooks/useAnimatedBusMarker";

type Props = {
  markerState: AnimatedBusMarkerState;
  title?: string;
  isStale?: boolean;
};

/**
 * An animated bus marker for react-native-maps.
 *
 * Coordinate interpolation is driven by `AnimatedRegion` (native thread, no JS bridge per frame).
 * The bus icon rotates to reflect the current direction of travel via `Animated.Value` → transform.
 * When the location is stale, the icon desaturates to signal that GPS data is old.
 */
export default function BusMarker({ markerState, title = "School bus", isStale = false }: Props) {
  const { animatedRegion, rotation } = markerState;
  const markerRef = useRef<React.ElementRef<typeof MarkerAnimated>>(null);

  const rotateInterpolation = rotation.interpolate({
    inputRange: [-7200, -3600, 0, 3600, 7200],
    outputRange: ["-7200deg", "-3600deg", "0deg", "3600deg", "7200deg"],
    extrapolate: "extend",
  });

  return (
    <MarkerAnimated
      ref={markerRef}
      coordinate={animatedRegion}
      title={title}
      anchor={{ x: 0.5, y: 0.5 }}
      // tracksViewChanges=false prevents re-render on every coordinate update;
      // AnimatedRegion handles coordinate changes natively without re-mounting.
      tracksViewChanges={false}
    >
      <Animated.View
        style={[
          styles.wrapper,
          { transform: [{ rotate: rotateInterpolation }] },
        ]}
      >
        <View style={[styles.circle, isStale && styles.circleStale]}>
          <BusIcon color={isStale ? "#94A3B8" : "#FFFFFF"} />
        </View>
        {/* Direction pointer at the top of the circle */}
        <View style={[styles.pointer, isStale && styles.pointerStale]} />
      </Animated.View>
    </MarkerAnimated>
  );
}

/** Inline bus SVG rendered as a React Native View tree — no external asset file needed. */
function BusIcon({ color }: { color: string }) {
  return (
    <View style={styles.busIconWrap}>
      {/* Windshield */}
      <View style={[styles.busIconWindshield, { borderBottomColor: color }]} />
      {/* Body */}
      <View style={[styles.busIconBody, { backgroundColor: color }]}>
        {/* Windows row */}
        <View style={styles.busIconWindowRow}>
          <View style={styles.busIconWindow} />
          <View style={styles.busIconWindow} />
          <View style={styles.busIconWindow} />
        </View>
      </View>
      {/* Wheels */}
      <View style={styles.busIconWheelRow}>
        <View style={styles.busIconWheel} />
        <View style={styles.busIconWheel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    width: 44,
    height: 52,
  },
  pointer: {
    position: "absolute",
    top: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#F59E0B",
  },
  pointerStale: {
    borderBottomColor: "#94A3B8",
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    marginTop: 8,
  },
  circleStale: {
    backgroundColor: "#94A3B8",
    borderColor: "#E2E8F0",
  },
  busIconWrap: {
    alignItems: "center",
    width: 20,
    height: 22,
  },
  busIconWindshield: {
    width: 16,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 4,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  busIconBody: {
    width: 20,
    height: 13,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  busIconWindowRow: {
    flexDirection: "row",
    gap: 2,
  },
  busIconWindow: {
    width: 4,
    height: 4,
    borderRadius: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  busIconWheelRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: 18,
    marginTop: 1,
  },
  busIconWheel: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#374151",
  },
});

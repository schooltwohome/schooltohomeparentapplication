/**
 * BusMarker3D — production-ready school bus map marker for react-native-maps.
 *
 * Features:
 *  • Realistic 3D-isometric bus SVG (three visible faces + wheels + shadow)
 *  • flat={true} + rotation={heading} — bus lies flat on the map and rotates
 *    smoothly with the direction of travel (Uber-style)
 *  • Idle scale pulse when isLive = false (heartbeat loop, 700 ms half-period)
 *  • Online radar-ping ring animation when isLive = true
 *  • Custom callout card on tap (bus number, status, speed pill)
 *  • tracksViewChanges managed automatically — true only when props that affect
 *    the rendered SVG change, false otherwise to keep 60 fps smooth
 *
 * Usage:
 *   <MapView>
 *     <BusMarker3D
 *       coordinate={{ latitude: 8.5241, longitude: 76.9366 }}
 *       heading={45}
 *       busNumber="01"
 *       speed={35}
 *       isLive={true}
 *       status="On the way"
 *       onPress={() => console.log("Bus tapped")}
 *     />
 *   </MapView>
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Platform, Text, View } from "react-native";
import { Callout, Marker } from "react-native-maps";
import BusSVG from "./BusSVG";
import { SVG_RENDER_H, SVG_RENDER_W } from "./constants";
import styles from "./styles";
import type { BusMarkerProps } from "./types";
import { useMarkerAnimation } from "./useMarkerAnimation";

// ─── tracksViewChanges duration (ms) ─────────────────────────────────────────
const TRACKS_VIEW_RESET_MS = 400;

// ─── Component ────────────────────────────────────────────────────────────────

export default function BusMarker3D({
  coordinate,
  heading,
  busNumber,
  speed,
  isLive,
  status,
  onPress,
}: BusMarkerProps) {
  const { scaleAnim, ringOpacity, ringScale } = useMarkerAnimation(isLive);

  // ── tracksViewChanges management ─────────────────────────────────────────
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const tracksTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldTrackViewChanges = Platform.OS === "android" ? true : tracksViewChanges;
  const safeHeading = Number.isFinite(heading) ? heading : 0;

  const enableTrackingBriefly = useCallback(() => {
    if (tracksTimerRef.current !== null) {
      clearTimeout(tracksTimerRef.current);
    }
    setTracksViewChanges(true);
    tracksTimerRef.current = setTimeout(() => {
      tracksTimerRef.current = null;
      setTracksViewChanges(false);
    }, TRACKS_VIEW_RESET_MS);
  }, []);

  useEffect(() => {
    enableTrackingBriefly();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busNumber, isLive, status]);

  useEffect(() => {
    const id = setTimeout(() => setTracksViewChanges(false), TRACKS_VIEW_RESET_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    return () => {
      if (tracksTimerRef.current !== null) {
        clearTimeout(tracksTimerRef.current);
      }
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Marker
      coordinate={coordinate}
      /**
       * anchor x:0.5, y:1.0 — bottom-centre of the SVG is pinned to the map
       * coordinate. The bus body fills the full SVG height, so y:1.0 is correct.
       */
      anchor={{ x: 0.5, y: 1.0 }}
      /**
       * flat={true}  — marker lies flat on the map plane (Uber-style).
       * rotation     — rotates with heading so the bus nose points forward.
       */
      flat
      rotation={safeHeading}
      tracksViewChanges={shouldTrackViewChanges}
      zIndex={1000}
      onPress={onPress}
      accessibilityLabel="School bus marker"
    >
      {/*
       * Animated.View — drives the idle scale pulse.
       * Heading rotation is delegated to the Marker's `rotation` prop so we
       * only need a single transform here.
       */}
      <Animated.View
        style={[
          styles.markerWrapper,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Online radar-ping ring — absolutely positioned behind the badge. */}
        <Animated.View
          style={[
            styles.onlineRing,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
          pointerEvents="none"
        />

        <BusSVG
          isLive={isLive}
          busNumber={busNumber}
          width={SVG_RENDER_W}
          height={SVG_RENDER_H}
        />
      </Animated.View>

      <Callout tooltip onPress={onPress}>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>🚌 Bus {busNumber}</Text>
          <Text style={styles.calloutStatus}>{status}</Text>
          <View style={styles.speedBadge}>
            <Text style={styles.speedText}>{speed} km/h</Text>
          </View>
        </View>
      </Callout>
    </Marker>
  );
}

export type { BusMarkerProps };
export { SVG_RENDER_H as MARKER_HEIGHT, SVG_RENDER_W as MARKER_WIDTH };

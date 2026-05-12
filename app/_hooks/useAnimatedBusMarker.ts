import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { AnimatedRegion } from "react-native-maps";
import { bearingDeg } from "../../lib/geo";
import type { GeoPoint } from "../../types/tracking";

const MIN_DISTANCE_FOR_ANIMATION_M = 4;
const MAX_DISTANCE_FOR_ANIMATION_M = 180;
/** Minimum movement in metres before recomputing bearing from position delta. Below this threshold, device heading is preferred or bearing is held steady. */
const MIN_BEARING_UPDATE_DISTANCE_M = 12;
/**
 * Expected interval between GPS fixes in ms. Used as the interpolation window —
 * the marker will travel from the previous fix to the new one over this duration,
 * creating the appearance of continuous movement between real GPS polls.
 */
const INTERPOLATION_WINDOW_MS = 4_000;
/** Tick rate for the interpolation loop. 100 ms gives ~10 fps of smooth movement. */
const INTERPOLATION_TICK_MS = 100;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) *
      Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude));
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

function unwrapHeadingDelta(next: number, prev: number): number {
  let delta = next - prev;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

function animationDurationFromDistance(distanceMeters: number): number {
  const d = Math.max(MIN_DISTANCE_FOR_ANIMATION_M, Math.min(MAX_DISTANCE_FOR_ANIMATION_M, distanceMeters));
  const ratio =
    (d - MIN_DISTANCE_FOR_ANIMATION_M) /
    (MAX_DISTANCE_FOR_ANIMATION_M - MIN_DISTANCE_FOR_ANIMATION_M);
  // Scale between the interpolation tick (minimum perceptible step) and full window.
  return Math.round(INTERPOLATION_TICK_MS + ratio * (INTERPOLATION_WINDOW_MS - INTERPOLATION_TICK_MS));
}

/**
 * Linearly interpolates between two GPS points.
 * `fraction` should be in [0, 1]; values outside are clamped automatically by the caller.
 */
function interpolate(start: GeoPoint, end: GeoPoint, fraction: number): { latitude: number; longitude: number } {
  return {
    latitude: start.latitude + (end.latitude - start.latitude) * fraction,
    longitude: start.longitude + (end.longitude - start.longitude) * fraction,
  };
}

export type AnimatedBusMarkerState = {
  /** Pass directly to `<MarkerAnimated coordinate={animatedRegion}>`. */
  animatedRegion: InstanceType<typeof AnimatedRegion>;
  /**
   * Current bearing as an `Animated.Value` (degrees 0–360).
   * Apply via `transform: [{ rotate: rotation.interpolate({...}) }]` on the icon View.
   */
  rotation: Animated.Value;
  /** Current bearing as a plain number for non-animated consumers (e.g. icon label). */
  bearingDegRef: React.MutableRefObject<number>;
};

/**
 * Drives smooth, animated bus marker movement on react-native-maps.
 *
 * How it works:
 * 1. On each GPS fix, we record the previous position as `interpolationStart` and the
 *    new position as `interpolationTarget`, along with the current timestamp.
 * 2. A `setInterval` running every INTERPOLATION_TICK_MS (100 ms) computes what fraction
 *    of INTERPOLATION_WINDOW_MS has elapsed and calls `animatedRegion.setValue()` with the
 *    linearly interpolated coordinate. This makes the bus appear to move continuously even
 *    between 4-second GPS polls — the same technique used by Uber and Swiggy.
 * 3. Rotation (bearing) is still driven by `Animated.timing` so the icon spins smoothly
 *    to face the direction of travel as each new fix arrives.
 *
 * @param location  Current bus location from the tracking API; pass `null` when no active trip.
 */
export function useAnimatedBusMarker(location: GeoPoint | null): AnimatedBusMarkerState {
  const animatedRegion = useRef(
    new AnimatedRegion({
      latitude: location?.latitude ?? 0,
      longitude: location?.longitude ?? 0,
      latitudeDelta: 0,
      longitudeDelta: 0,
    })
  ).current;

  const rotation = useRef(new Animated.Value(0)).current;
  const bearingDegRef = useRef<number>(0);
  const prevLocationRef = useRef<GeoPoint | null>(null);
  const headingAccumulatorRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  // Interpolation state — updated on every GPS fix, consumed by the tick interval.
  const interpolationStartRef = useRef<GeoPoint | null>(null);
  const interpolationTargetRef = useRef<GeoPoint | null>(null);
  const interpolationStartTimeRef = useRef<number>(0);
  const interpolationWindowRef = useRef<number>(INTERPOLATION_WINDOW_MS);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start the 100 ms tick loop once on mount; it reads from refs so it never needs
  // to be restarted and does not cause re-renders.
  useEffect(() => {
    tickIntervalRef.current = setInterval(() => {
      const start = interpolationStartRef.current;
      const target = interpolationTargetRef.current;
      if (!start || !target) return;

      const elapsed = Date.now() - interpolationStartTimeRef.current;
      const fraction = Math.min(1, elapsed / interpolationWindowRef.current);
      const pos = interpolate(start, target, fraction);

      animatedRegion.setValue({
        latitude: pos.latitude,
        longitude: pos.longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      });
    }, INTERPOLATION_TICK_MS);

    return () => {
      if (tickIntervalRef.current !== null) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  // animatedRegion is a stable ref value — safe to omit from deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!location) return;

    if (!isInitializedRef.current) {
      // Snap to position on first render — no interpolation to avoid "flying in from 0,0".
      animatedRegion.setValue({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      });
      interpolationStartRef.current = location;
      interpolationTargetRef.current = location;
      interpolationStartTimeRef.current = Date.now();
      isInitializedRef.current = true;
      prevLocationRef.current = location;
      return;
    }

    const prev = prevLocationRef.current;
    const segmentDistance = prev ? haversineMeters(prev, location) : MIN_DISTANCE_FOR_ANIMATION_M;

    // Update bearing / rotation animation.
    if (prev) {
      let newBearing: number;
      if (segmentDistance >= MIN_BEARING_UPDATE_DISTANCE_M) {
        newBearing = bearingDeg(prev, location);
      } else if (location.heading != null) {
        newBearing = location.heading;
      } else {
        newBearing = bearingDegRef.current;
      }
      const delta = unwrapHeadingDelta(newBearing, bearingDegRef.current);
      if (Math.abs(delta) >= 2) {
        bearingDegRef.current = newBearing;
        headingAccumulatorRef.current += delta;
        // Animate rotation over the same window as the interpolation so the icon
        // direction and position arrive together.
        Animated.timing(rotation, {
          toValue: headingAccumulatorRef.current,
          duration: animationDurationFromDistance(segmentDistance),
          useNativeDriver: false,
        }).start();
      }
    }

    // Arm the interpolation: the tick loop will carry the marker from the current
    // rendered position to `location` over INTERPOLATION_WINDOW_MS milliseconds.
    // Using the current AnimatedRegion value as the start avoids a visible jump when
    // a new fix arrives before the previous interpolation segment has fully completed.
    const currentLat = (animatedRegion as unknown as { _value: { latitude: number } })._value?.latitude
      ?? (prev?.latitude ?? location.latitude);
    const currentLon = (animatedRegion as unknown as { _value: { longitude: number } })._value?.longitude
      ?? (prev?.longitude ?? location.longitude);

    interpolationStartRef.current = { latitude: currentLat, longitude: currentLon };
    interpolationTargetRef.current = location;
    interpolationStartTimeRef.current = Date.now();
    interpolationWindowRef.current = animationDurationFromDistance(segmentDistance);

    prevLocationRef.current = location;
  }, [location, animatedRegion, rotation]);

  return { animatedRegion, rotation, bearingDegRef };
}

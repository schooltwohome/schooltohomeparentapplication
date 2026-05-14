import { useEffect, useRef, useState } from "react";
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
const HEADING_JITTER_DEG = 2;
const MOVING_HEADING_SMOOTHING = 0.45;
const STATIONARY_HEADING_SMOOTHING = 0.25;

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
  /** Smoothly interpolated marker coordinate to pass into `<Marker coordinate={...}>`. */
  coordinate: { latitude: number; longitude: number };
  /** Stable heading in degrees for Marker `rotation` prop. */
  busHeading: number;
};

/**
 * Drives smooth, animated bus marker movement on react-native-maps.
 *
 * How it works:
 * 1. On each GPS fix, we record the previous position as `interpolationStart` and the
 *    new position as `interpolationTarget`, along with the current timestamp.
 * 2. A `setInterval` running every INTERPOLATION_TICK_MS (100 ms) computes what fraction
 *    of INTERPOLATION_WINDOW_MS has elapsed and updates a local coordinate state.
 *    This makes the bus appear to move continuously even between 4-second GPS polls.
 * 3. Heading is derived from travel bearing and smoothed to suppress GPS jitter.
 *
 * @param location  Current bus location from the tracking API; pass `null` when no active trip.
 */
export function useAnimatedBusMarker(location: GeoPoint | null): AnimatedBusMarkerState {
  const [coordinate, setCoordinate] = useState<{ latitude: number; longitude: number }>({
    latitude: location?.latitude ?? 0,
    longitude: location?.longitude ?? 0,
  });
  const [busHeading, setBusHeading] = useState<number>(
    Number.isFinite(location?.heading) ? Number(location?.heading) : 0
  );
  const bearingDegRef = useRef<number>(Number.isFinite(location?.heading) ? Number(location?.heading) : 0);
  const currentCoordRef = useRef<{ latitude: number; longitude: number }>({
    latitude: location?.latitude ?? 0,
    longitude: location?.longitude ?? 0,
  });
  const prevLocationRef = useRef<GeoPoint | null>(null);
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
      currentCoordRef.current = { latitude: pos.latitude, longitude: pos.longitude };
      setCoordinate({ latitude: pos.latitude, longitude: pos.longitude });
    }, INTERPOLATION_TICK_MS);

    return () => {
      if (tickIntervalRef.current !== null) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!location) return;

    if (!isInitializedRef.current) {
      // Snap to position on first render — no interpolation to avoid "flying in from 0,0".
      setCoordinate({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      currentCoordRef.current = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      interpolationStartRef.current = location;
      interpolationTargetRef.current = location;
      interpolationStartTimeRef.current = Date.now();
      isInitializedRef.current = true;
      prevLocationRef.current = location;
      if (Number.isFinite(location.heading)) {
        const heading = Number(location.heading);
        bearingDegRef.current = heading;
        setBusHeading(heading);
      }
      return;
    }

    const prev = prevLocationRef.current;
    const segmentDistance = prev ? haversineMeters(prev, location) : MIN_DISTANCE_FOR_ANIMATION_M;

    // Update heading using route bearing first, then device heading fallback for tiny movement.
    if (prev) {
      let targetHeading: number;
      if (segmentDistance >= MIN_BEARING_UPDATE_DISTANCE_M) {
        targetHeading = bearingDeg(prev, location);
      } else if (location.heading != null) {
        targetHeading = location.heading;
      } else {
        targetHeading = bearingDegRef.current;
      }

      const delta = unwrapHeadingDelta(targetHeading, bearingDegRef.current);
      if (Math.abs(delta) >= HEADING_JITTER_DEG) {
        const smoothing =
          segmentDistance >= MIN_BEARING_UPDATE_DISTANCE_M
            ? MOVING_HEADING_SMOOTHING
            : STATIONARY_HEADING_SMOOTHING;
        const nextHeading = (bearingDegRef.current + delta * smoothing + 360) % 360;
        bearingDegRef.current = nextHeading;
        setBusHeading(nextHeading);
      }
    }

    // Arm the interpolation: the tick loop will carry the marker from the current
    // rendered position to `location` over INTERPOLATION_WINDOW_MS milliseconds.
    // Using the current interpolated coordinate as the next segment start avoids visible jumps.
    const currentLat = currentCoordRef.current.latitude ?? (prev?.latitude ?? location.latitude);
    const currentLon = currentCoordRef.current.longitude ?? (prev?.longitude ?? location.longitude);

    interpolationStartRef.current = { latitude: currentLat, longitude: currentLon };
    interpolationTargetRef.current = location;
    interpolationStartTimeRef.current = Date.now();
    interpolationWindowRef.current = animationDurationFromDistance(segmentDistance);

    prevLocationRef.current = location;
  }, [location]);

  return { coordinate, busHeading };
}

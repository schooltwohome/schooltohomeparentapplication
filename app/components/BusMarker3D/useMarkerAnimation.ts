/**
 * useMarkerAnimation — animation logic for BusMarker3D.
 *
 * Heading rotation is now handled natively by react-native-maps via the
 * `rotation` prop on `<Marker flat>`, so this hook only manages:
 *
 * 1. IDLE PULSE (isLive = false)
 *    An Animated.loop scales the marker 1.0 → 1.08 → 1.0 in a gentle heartbeat.
 *    useNativeDriver: true — only drives transform:[{scale}].
 *
 * 2. ONLINE RING PULSE (isLive = true)
 *    A radar-ping ring expands from scale 1 → RING_PULSE_MAX_SCALE while fading
 *    opacity 0.8 → 0 over RING_PULSE_DURATION_MS. The loop resets and repeats.
 *    useNativeDriver: true — drives opacity + transform:[{scale}].
 */

import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import {
  IDLE_PULSE_HALF_MS,
  IDLE_PULSE_SCALE,
  RING_PULSE_DURATION_MS,
  RING_PULSE_MAX_SCALE,
} from "./constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarkerAnimationState {
  /**
   * Scale Animated.Value driven by the idle-pulse loop.
   * Apply via `transform: [{ scale: scaleAnim }]`.
   */
  scaleAnim: Animated.Value;
  /**
   * Opacity for the online ring. Use on a ring View's `opacity` style.
   */
  ringOpacity: Animated.Value;
  /**
   * Scale for the online ring. Use on a ring View's `transform:[{scale}]`.
   */
  ringScale: Animated.Value;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMarkerAnimation(isLive: boolean): MarkerAnimationState {
  // ── Idle pulse loop (isLive = false) ──────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const idleLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isLive) {
      idleLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: IDLE_PULSE_SCALE,
            duration: IDLE_PULSE_HALF_MS,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: IDLE_PULSE_HALF_MS,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      idleLoopRef.current.start();
    } else {
      idleLoopRef.current?.stop();
      idleLoopRef.current = null;
      scaleAnim.setValue(1);
    }

    return () => {
      idleLoopRef.current?.stop();
      idleLoopRef.current = null;
    };
    // scaleAnim is a stable ref — safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive]);

  // ── Online ring pulse (isLive = true) ─────────────────────────────────────
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const ringLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isLive) {
      ringScale.setValue(1);
      ringOpacity.setValue(0.8);

      ringLoopRef.current = Animated.loop(
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: RING_PULSE_MAX_SCALE,
            duration: RING_PULSE_DURATION_MS,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: RING_PULSE_DURATION_MS,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      ringLoopRef.current.start();
    } else {
      ringLoopRef.current?.stop();
      ringLoopRef.current = null;
      ringScale.setValue(1);
      ringOpacity.setValue(0);
    }

    return () => {
      ringLoopRef.current?.stop();
      ringLoopRef.current = null;
    };
    // ringScale / ringOpacity are stable refs — safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive]);

  return { scaleAnim, ringOpacity, ringScale };
}

import { StyleSheet } from "react-native";
import { SVG_RENDER_H, SVG_RENDER_W } from "./constants";

/**
 * StyleSheet for BusMarker3D.
 *
 * The SVG dimensions are imported from constants so every size value has a
 * single source of truth — nothing is hardcoded in this file.
 */
const styles = StyleSheet.create({
  // ── Marker wrapper ──────────────────────────────────────────────────────
  /**
   * Animated.View that receives the scale transform (idle pulse).
   * Must be exactly the rendered SVG size so the bottom-centre anchor aligns
   * correctly with the map coordinate.
   */
  markerWrapper: {
    width: SVG_RENDER_W,
    height: SVG_RENDER_H,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Online ring pulse ───────────────────────────────────────────────────
  /**
   * Absolutely positioned ring that sits over the number badge above the roof.
   *
   * Badge rect in viewBox "-10 -20 120 80": x=29, y=-9, w=22, h=12
   * Badge centre (viewBox): cx=40, cy=-3
   * viewBox scale to rendered 150×100:
   *   scaleX = 150/120 = 1.25,  scaleY = 100/80 = 1.25
   * Badge rendered centre: x=(40-(-10))*1.25=62.5, y=(-3-(-20))*1.25=21.25
   * Ring r≈13 → top=8, left=50, width=26, height=26
   */
  onlineRing: {
    position: "absolute",
    top: 8,
    left: 50,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#22C55E",
    backgroundColor: "transparent",
  },

  // ── Callout bubble ──────────────────────────────────────────────────────
  /**
   * White card shown when the user taps the marker.
   * Uses a tooltip callout so the native iOS/Android bubble frame is hidden
   * and only this custom view is rendered.
   */
  callout: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 160,
    maxWidth: 220,
    // iOS shadow
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    // Android elevation
    elevation: 8,
  },

  /**
   * "🚌 Bus 01" — bold headline inside callout.
   */
  calloutTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 3,
  },

  /**
   * Status line — "On the way · 11 min"
   */
  calloutStatus: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
    lineHeight: 17,
  },

  /**
   * Pill container for the speed badge.
   */
  speedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  /**
   * Speed text inside the pill, e.g. "35 km/h".
   */
  speedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
});

export default styles;

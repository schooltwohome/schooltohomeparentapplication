/** Props accepted by the BusMarker3D map marker component. */
export interface BusMarkerProps {
  /** GPS coordinate the marker is pinned to. */
  coordinate: { latitude: number; longitude: number };
  /** Direction the bus is facing, 0–360 degrees (0 = north, 90 = east). */
  heading: number;
  /** Bus identifier shown in the callout, e.g. "01". */
  busNumber: string;
  /** Current speed in km/h — shown in the callout speed pill. */
  speed: number;
  /** True when the GPS feed is active; false when updating / offline. */
  isLive: boolean;
  /** Human-readable status line shown in the callout, e.g. "On the way". */
  status: string;
  /** Optional tap handler. */
  onPress?: () => void;
}

/** Props forwarded to the pure SVG drawing component. */
export interface BusSVGProps {
  /** Shows a green badge when true, gray when false. */
  isLive: boolean;
  /** Displayed on the bus number badge above the roof. */
  busNumber: string;
  /** Override rendered width in pixels (defaults to SVG_RENDER_W). */
  width?: number;
  /** Override rendered height in pixels (defaults to SVG_RENDER_H). */
  height?: number;
}

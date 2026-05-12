export type GeoPoint = {
  latitude: number;
  longitude: number;
  /** GPS compass heading in degrees 0–360 from the driver device; null when unavailable. */
  heading?: number | null;
};

export type TripStatus =
  | "not_started"
  | "started"
  | "reached_school"
  | "returning"
  | "completed";

/** Label shown in the floating info card based on trip status. */
export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  not_started: "Not started",
  started: "Trip started",
  reached_school: "Reached school",
  returning: "On the way back",
  completed: "Trip completed",
};

/** Maps raw backend `tripStatus` strings (snake_case or varied) to canonical TripStatus. */
export function normalizeTripStatus(raw: string | null | undefined): TripStatus {
  if (!raw) return "not_started";
  const s = raw.toLowerCase().replace(/[\s-]/g, "_");
  if (s === "started" || s === "in_progress" || s === "active") return "started";
  if (s === "reached_school" || s === "at_school" || s === "school_reached") return "reached_school";
  if (s === "returning" || s === "return" || s === "heading_back") return "returning";
  if (s === "completed" || s === "done" || s === "finished") return "completed";
  return "not_started";
}

export interface RouteStop extends GeoPoint {
  id: string;
  name: string;
  order: number;
  isCompleted: boolean;
}

/** Real-time vehicle state derived from a tracking segment, used by animated marker. */
export interface VehicleSnapshot {
  busId: string;
  location: GeoPoint;
  /** Speed in km/h; 0 when stationary or unknown. */
  speedKmh: number;
  /** Compass bearing 0–360 computed client-side from consecutive GPS points. */
  bearingDeg: number;
  capturedAtMs: number;
  isStale: boolean;
}

export interface Trip {
  tripId: string;
  status: TripStatus;
  routeStops: RouteStop[];
  etaMinutes: number | null;
  vehicle: VehicleSnapshot | null;
}

import type { MapCoord } from "../app/components/track/trackMapGeometry";

export type DirectionStep = {
  htmlInstructions: string;
  distanceText: string;
  durationText: string;
};

export type DirectionsSummary = {
  distanceText: string;
  durationText: string;
  steps: DirectionStep[];
  overviewCoords: MapCoord[];
};

/** Decode Google-encoded polyline to coordinates (overview_path). */
export function decodeEncodedPolyline(encoded: string): MapCoord[] {
  if (!encoded?.length) return [];
  let index = 0;
  const coordinates: MapCoord[] = [];
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b = 0;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coordinates;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
}

/** Max intermediate waypoints Google Directions allows per request. */
const MAX_INTERMEDIATES = 8;

/**
 * Single Directions API call for one batch of waypoints (origin + ≤8 intermediates + destination).
 * Returns detailed step-level polyline coordinates — far more accurate than overview_polyline
 * for winding roads. Falls back to overview_polyline if steps are unavailable.
 */
async function fetchDirectionsBatch(
  waypoints: MapCoord[],
  apiKey: string
): Promise<MapCoord[] | null> {
  if (waypoints.length < 2) return null;
  const origin = `${waypoints[0].latitude},${waypoints[0].longitude}`;
  const destination = `${waypoints[waypoints.length - 1].latitude},${waypoints[waypoints.length - 1].longitude}`;
  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("key", apiKey.trim());

  const intermediates = waypoints.slice(1, waypoints.length - 1);
  if (intermediates.length > 0) {
    const waypointParam =
      "optimize:false|" +
      intermediates.map((w) => `${w.latitude},${w.longitude}`).join("|");
    url.searchParams.set("waypoints", waypointParam);
  }

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      routes?: {
        overview_polyline?: { points?: string };
        legs?: {
          steps?: { polyline?: { points?: string } }[];
        }[];
      }[];
    };
    if (data.status !== "OK" || !data.routes?.[0]) return null;

    // Concatenate step-level polylines from all legs for full road accuracy.
    const allCoords: MapCoord[] = [];
    for (const leg of data.routes[0].legs ?? []) {
      for (const step of leg.steps ?? []) {
        if (step.polyline?.points) {
          allCoords.push(...decodeEncodedPolyline(step.polyline.points));
        }
      }
    }
    if (allCoords.length >= 2) return allCoords;

    // Fallback to overview_polyline if steps were empty.
    const points = data.routes[0].overview_polyline?.points;
    return points ? decodeEncodedPolyline(points) : null;
  } catch {
    return null;
  }
}

/**
 * Driving directions following ordered stop waypoints (Google Directions API).
 * Automatically batches routes with more than 10 stops (origin + 8 intermediates + destination)
 * into overlapping chunks and stitches the resulting polylines together.
 * Uses step-level polylines for full road accuracy rather than the coarse overview_polyline.
 */
export async function fetchDrivingDirections(
  waypoints: MapCoord[],
  apiKey: string
): Promise<MapCoord[] | null> {
  if (!apiKey?.trim() || waypoints.length < 2) return null;

  // If the route fits in a single request, no batching needed.
  if (waypoints.length <= MAX_INTERMEDIATES + 2) {
    return fetchDirectionsBatch(waypoints, apiKey);
  }

  // Split into overlapping batches of (MAX_INTERMEDIATES + 2) stops.
  // Each batch shares its last stop as the first stop of the next batch so the
  // polyline segments connect without gaps.
  const batchSize = MAX_INTERMEDIATES + 2; // 10 stops per call
  const batches: MapCoord[][] = [];
  let start = 0;
  while (start < waypoints.length - 1) {
    const end = Math.min(start + batchSize - 1, waypoints.length - 1);
    batches.push(waypoints.slice(start, end + 1));
    if (end === waypoints.length - 1) break;
    start = end; // overlap: last stop of this batch = first of next
  }

  const results = await Promise.all(
    batches.map((batch) => fetchDirectionsBatch(batch, apiKey))
  );

  // Stitch batches — skip the first point of each subsequent batch to avoid duplicates.
  const stitched: MapCoord[] = [];
  for (let i = 0; i < results.length; i++) {
    const coords = results[i];
    if (!coords || coords.length === 0) continue;
    if (stitched.length === 0) {
      stitched.push(...coords);
    } else {
      stitched.push(...coords.slice(1));
    }
  }

  return stitched.length >= 2 ? stitched : null;
}

/**
 * Walking directions from origin to destination (Google Directions API).
 */
export async function fetchWalkingDirections(
  origin: MapCoord,
  destination: MapCoord,
  apiKey: string
): Promise<DirectionsSummary | null> {
  if (!apiKey?.trim()) return null;
  const o = `${origin.latitude},${origin.longitude}`;
  const d = `${destination.latitude},${destination.longitude}`;
  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", o);
  url.searchParams.set("destination", d);
  url.searchParams.set("mode", "walking");
  url.searchParams.set("key", apiKey.trim());

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status?: string;
    routes?: {
      overview_polyline?: { points?: string };
      legs?: {
        distance?: { text?: string };
        duration?: { text?: string };
        steps?: {
          html_instructions?: string;
          distance?: { text?: string };
          duration?: { text?: string };
        }[];
      }[];
    }[];
    error_message?: string;
  };

  if (data.status !== "OK" || !data.routes?.[0]) return null;
  const route = data.routes[0];
  const leg = route.legs?.[0];
  const overview = route.overview_polyline?.points
    ? decodeEncodedPolyline(route.overview_polyline.points)
    : [];

  const steps =
    leg?.steps?.map(s => ({
      htmlInstructions: stripHtml(String(s.html_instructions ?? "")),
      distanceText: String(s.distance?.text ?? ""),
      durationText: String(s.duration?.text ?? ""),
    })) ?? [];

  return {
    distanceText: String(leg?.distance?.text ?? ""),
    durationText: String(leg?.duration?.text ?? ""),
    steps,
    overviewCoords: overview,
  };
}

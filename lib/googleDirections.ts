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

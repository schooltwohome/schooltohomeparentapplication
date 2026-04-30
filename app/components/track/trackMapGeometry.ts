import type { TrackingSegment } from "../../../services/parentApi";

export type MapCoord = { latitude: number; longitude: number };

function isValidCoord(c: MapCoord): boolean {
  return (
    Number.isFinite(c.latitude) &&
    Number.isFinite(c.longitude) &&
    c.latitude >= -90 &&
    c.latitude <= 90 &&
    c.longitude >= -180 &&
    c.longitude <= 180
  );
}

export function coordFromStopRow(
  stop: TrackingSegment["routeStops"][number]
): MapCoord | null {
  const la =
    typeof stop.latitude === "number"
      ? stop.latitude
      : stop.latitude != null
        ? Number(stop.latitude)
        : NaN;
  const lo =
    typeof stop.longitude === "number"
      ? stop.longitude
      : stop.longitude != null
        ? Number(stop.longitude)
        : NaN;
  const c = { latitude: la, longitude: lo };
  return isValidCoord(c) ? c : null;
}

/**
 * Full route polyline: every stop with valid coordinates, in stopOrder (gaps skipped —
 * if a stop has no lat/lng, the line connects the surrounding points).
 */
export function buildRouteContextPolyline(segment: TrackingSegment | null): MapCoord[] {
  if (!segment?.routeStops?.length) return [];
  const sorted = [...segment.routeStops].sort((a, b) => a.stopOrder - b.stopOrder);
  const out: MapCoord[] = [];
  for (const row of sorted) {
    const c = coordFromStopRow(row);
    if (c) out.push(c);
  }
  return out;
}

/** Short dashed segment from live bus position to the next stop (only when both exist). */
export function buildBusToNextLeg(
  bus: MapCoord | null,
  segment: TrackingSegment | null
): MapCoord[] {
  if (!bus || !segment?.nextStopId) return [];
  const sorted = [...(segment.routeStops ?? [])].sort((a, b) => a.stopOrder - b.stopOrder);
  const next = sorted.find((s) => s.id === segment.nextStopId);
  if (!next) return [];
  const nextCoord = coordFromStopRow(next);
  if (!nextCoord) return [];
  return [bus, nextCoord];
}

export function collectFitCoordinates(params: {
  bus: MapCoord | null;
  parent: MapCoord | null;
  pickup: MapCoord | null;
  routeContext: MapCoord[];
}): MapCoord[] {
  const set = new Set<string>();
  const add = (c: MapCoord | null) => {
    if (!c || !isValidCoord(c)) return;
    const k = `${c.latitude.toFixed(5)},${c.longitude.toFixed(5)}`;
    if (set.has(k)) return;
    set.add(k);
    pts.push(c);
  };
  const pts: MapCoord[] = [];
  add(params.bus);
  add(params.pickup);
  add(params.parent);
  for (const c of params.routeContext) add(c);
  return pts;
}

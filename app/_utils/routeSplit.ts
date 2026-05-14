import type { LatLng } from "react-native-maps";

type NearestPointResult = {
  point: LatLng;
  distanceMeters: number;
  t: number;
};

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) *
      Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude));
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/**
 * Returns the nearest point from `target` to segment AB.
 * Uses a cos(latitude) correction so projection in lat/lng space remains stable.
 */
export function nearestPointOnSegment(
  a: LatLng,
  b: LatLng,
  target: LatLng
): NearestPointResult {
  const midLat = (a.latitude + b.latitude) / 2;
  const cosLat = Math.cos((midLat * Math.PI) / 180);

  const ax = a.longitude * cosLat;
  const ay = a.latitude;
  const bx = b.longitude * cosLat;
  const by = b.latitude;
  const px = target.longitude * cosLat;
  const py = target.latitude;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  const unclampedT = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  const t = Math.max(0, Math.min(1, unclampedT));

  const projLat = ay + t * dy;
  const projLon = cosLat === 0 ? a.longitude : (ax + t * dx) / cosLat;
  const point = { latitude: projLat, longitude: projLon };
  const distanceMeters = haversineMeters(point, target);
  return { point, distanceMeters, t };
}

export function splitRouteAtBusPosition(
  waypoints: LatLng[],
  busCoord: LatLng
): { covered: LatLng[]; remaining: LatLng[] } {
  if (waypoints.length < 2) {
    return { covered: waypoints.slice(0, 1), remaining: waypoints.slice() };
  }

  let nearestIdx = 0;
  let nearestPoint = waypoints[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const result = nearestPointOnSegment(waypoints[i], waypoints[i + 1], busCoord);
    if (result.distanceMeters < bestDistance) {
      bestDistance = result.distanceMeters;
      nearestIdx = i;
      nearestPoint = result.point;
    }
  }

  return {
    covered: [...waypoints.slice(0, nearestIdx + 1), nearestPoint],
    remaining: [nearestPoint, ...waypoints.slice(nearestIdx + 1)],
  };
}

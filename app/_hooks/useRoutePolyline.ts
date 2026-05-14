import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TrackingSegment } from "../../services/parentApi";
import type { MapCoord } from "../components/track/trackMapGeometry";
import { coordFromStopRow } from "../components/track/trackMapGeometry";
import { deviationMeters } from "../../lib/geo";
import { fetchDrivingDirections } from "../../lib/googleDirections";
import {
  nearestPointOnSegment,
  splitRouteAtBusPosition,
} from "../_utils/routeSplit";

export const DEVIATION_THRESHOLD_METERS = 150;
/** Minimum milliseconds between reroute fetches to avoid spamming Directions API. */
const REROUTE_COOLDOWN_MS = 20_000;

export type RoutePolylineResult = {
  /** Full route polyline in stop order — used as the base path on the map. */
  fullPolyline: MapCoord[];
  /** Stops already visited — rendered in a muted colour to show progress. */
  coveredPolyline: MapCoord[];
  /** Remaining stops from the current position — rendered in the primary colour. */
  remainingPolyline: MapCoord[];
  /** Short dashed segment from the live bus position to the next stop. */
  busToNextLeg: MapCoord[];
  /**
   * Shortest distance in metres from the bus to the nearest route polyline segment.
   * Null when busCoord is unavailable or the route has fewer than 2 points.
   */
  deviationFromRoute: number | null;
};

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

/**
 * Fetches a road-snapped driving polyline for the given stop coordinates once per
 * unique stop list and caches it in a ref so it survives re-renders.
 *
 * When `busCoord` is supplied and the bus has deviated more than
 * DEVIATION_THRESHOLD_METERS from the current polyline, automatically re-fetches
 * a new route starting from the current bus position → remaining stops.
 * A cooldown prevents hammering the Directions API on every GPS fix.
 *
 * Falls back to an empty array (caller uses straight-line polyline) when unavailable.
 */
export function useRoadSnappedPolyline(
  stopCoords: MapCoord[],
  apiKey: string | undefined,
  busCoord?: MapCoord | null,
  remainingStopCoords?: MapCoord[]
): MapCoord[] {
  const [roadPolyline, setRoadPolyline] = useState<MapCoord[]>([]);
  const fetchedKeyRef = useRef<string | null>(null);
  const lastRerouteAtRef = useRef<number>(0);

  const stopKey = useMemo(
    () => stopCoords.map((c) => `${c.latitude.toFixed(5)},${c.longitude.toFixed(5)}`).join("|"),
    [stopCoords]
  );

  // Initial/baseline route fetch — runs once per unique stop list.
  useEffect(() => {
    if (!apiKey || stopCoords.length < 2) return;
    if (fetchedKeyRef.current === stopKey) return;

    let cancelled = false;
    fetchDrivingDirections(stopCoords, apiKey).then((result) => {
      if (cancelled) return;
      if (result && result.length >= 2) {
        fetchedKeyRef.current = stopKey;
        setRoadPolyline(result);
      }
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopKey, apiKey]);

  // Reroute fetch — triggered when the bus deviates beyond the threshold.
  const triggerReroute = useCallback(
    (from: MapCoord, throughStops: MapCoord[]) => {
      if (!apiKey) return;
      const now = Date.now();
      if (now - lastRerouteAtRef.current < REROUTE_COOLDOWN_MS) return;
      lastRerouteAtRef.current = now;
      // Build waypoint list: current bus position → remaining stops.
      const waypoints: MapCoord[] = [from, ...throughStops];
      if (waypoints.length < 2) return;
      fetchDrivingDirections(waypoints, apiKey).then((result) => {
        if (result && result.length >= 2) {
          setRoadPolyline(result);
        }
      });
    },
    [apiKey]
  );

  useEffect(() => {
    if (
      !busCoord ||
      !isValidCoord(busCoord) ||
      !remainingStopCoords?.length ||
      roadPolyline.length < 2
    ) {
      return;
    }
    const deviation = deviationMeters(busCoord, roadPolyline);
    if (deviation > DEVIATION_THRESHOLD_METERS) {
      triggerReroute(busCoord, remainingStopCoords);
    }
  // busCoord changes on every GPS fix — intentional: we check deviation on each update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busCoord, remainingStopCoords, triggerReroute]);

  return roadPolyline;
}

/**
 * Derives memoized polyline arrays from a tracking segment.
 *
 * When the road polyline is loaded the split tracks the live bus position so
 * the gray "traveled" and blue "remaining" portions move in real-time — exactly
 * like Uber's navigation progress line.  When no bus coord is available it falls
 * back to splitting at the last completed stop.
 *
 * @param roadPolyline  Optional road-snapped polyline from `useRoadSnappedPolyline`.
 *                      When provided and has ≥ 2 points, used as the base for splits
 *                      instead of the straight-line stop-to-stop polyline.
 */
export function useRoutePolyline(
  segment: TrackingSegment | null,
  busCoord: MapCoord | null,
  roadPolyline?: MapCoord[]
): RoutePolylineResult {
  const completedKey = segment?.completedStopIds?.join(",") ?? "";
  const nextStopId = segment?.nextStopId ?? null;
  const maxSplitIdxRef = useRef<number>(0);

  const fullPolyline = useMemo<MapCoord[]>(() => {
    if (!segment?.routeStops?.length) return [];
    return [...segment.routeStops]
      .sort((a, b) => a.stopOrder - b.stopOrder)
      .reduce<MapCoord[]>((acc, stop) => {
        const c = coordFromStopRow(stop);
        if (c) acc.push(c);
        return acc;
      }, []);
  }, [segment?.routeStops]);

  const routeStopIdsKey = useMemo(
    () => segment?.routeStops?.map((s) => s.id).join(",") ?? "",
    [segment?.routeStops]
  );

  useEffect(() => {
    maxSplitIdxRef.current = 0;
  }, [routeStopIdsKey]);

  const hasRoadPolyline = (roadPolyline?.length ?? 0) >= 2;
  const basePolyline = hasRoadPolyline ? roadPolyline! : fullPolyline;

  const { coveredPolyline, remainingPolyline } = useMemo<{
    coveredPolyline: MapCoord[];
    remainingPolyline: MapCoord[];
  }>(() => {
    if (!segment?.routeStops?.length || !basePolyline.length) {
      return { coveredPolyline: [], remainingPolyline: basePolyline };
    }

    // Priority 1 — live bus position known.
    // Split at the nearest point on the active base polyline (road-snapped when
    // available, otherwise stop-chain) for real-time Uber-style progress.
    if (busCoord && isValidCoord(busCoord) && basePolyline.length >= 2) {
      const split = splitRouteAtBusPosition(basePolyline, busCoord);
      const rawIdx = Math.max(0, split.covered.length - 2);
      // Monotonicity: split can only advance forward, never jump backward due to GPS jitter.
      const effectiveIdx = Math.max(maxSplitIdxRef.current, rawIdx);
      const projectedPoint =
        effectiveIdx > rawIdx
          ? basePolyline[effectiveIdx]
          : split.covered[split.covered.length - 1] ?? basePolyline[effectiveIdx];
      maxSplitIdxRef.current = effectiveIdx;
      return {
        coveredPolyline: [...basePolyline.slice(0, effectiveIdx + 1), projectedPoint],
        remainingPolyline: [projectedPoint, ...basePolyline.slice(effectiveIdx + 1)],
      };
    }

    // Priority 2 — road polyline loaded but no live bus coord yet.
    // Split at the nearest road point to the last completed stop.
    const completedIds = new Set(segment.completedStopIds ?? []);
    const sortedStops = [...segment.routeStops].sort((a, b) => a.stopOrder - b.stopOrder);
    let lastCompletedIdx = -1;
    for (let i = 0; i < sortedStops.length; i++) {
      if (completedIds.has(sortedStops[i].id)) lastCompletedIdx = i;
    }

    if (hasRoadPolyline && lastCompletedIdx >= 0) {
      const lastStopCoord = coordFromStopRow(sortedStops[lastCompletedIdx]);
      if (lastStopCoord && isValidCoord(lastStopCoord)) {
        let idx = 0;
        let proj = basePolyline[0];
        let bestDistance = Number.POSITIVE_INFINITY;
        for (let i = 0; i < basePolyline.length - 1; i += 1) {
          const nearest = nearestPointOnSegment(basePolyline[i], basePolyline[i + 1], lastStopCoord);
          if (nearest.distanceMeters < bestDistance) {
            bestDistance = nearest.distanceMeters;
            idx = i;
            proj = nearest.point;
          }
        }
        return {
          coveredPolyline: [...basePolyline.slice(0, idx + 1), proj],
          remainingPolyline: [proj, ...basePolyline.slice(idx + 1)],
        };
      }
    }

    // Fallback — straight-line polyline or no completed stops: split by index.
    const splitAt = lastCompletedIdx + 1;
    return {
      coveredPolyline: basePolyline.slice(0, splitAt),
      remainingPolyline: basePolyline.slice(splitAt),
    };
    // busCoord is intentionally in the deps: split must move as the bus moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePolyline, completedKey, hasRoadPolyline, busCoord]);

  const { busToNextLeg, deviationFromRoute } = useMemo<{
    busToNextLeg: MapCoord[];
    deviationFromRoute: number | null;
  }>(() => {
    const routeForDeviation = (roadPolyline?.length ?? 0) >= 2 ? roadPolyline! : fullPolyline;
    const deviation =
      busCoord && isValidCoord(busCoord) && routeForDeviation.length >= 2
        ? deviationMeters(busCoord, routeForDeviation)
        : null;

    if (!busCoord || !isValidCoord(busCoord) || !nextStopId || !segment?.routeStops) {
      return { busToNextLeg: [], deviationFromRoute: deviation };
    }
    const sorted = [...segment.routeStops].sort((a, b) => a.stopOrder - b.stopOrder);
    const nextStop = sorted.find((s) => s.id === nextStopId);
    if (!nextStop) return { busToNextLeg: [], deviationFromRoute: deviation };
    const nextCoord = coordFromStopRow(nextStop);
    if (!nextCoord || !isValidCoord(nextCoord)) {
      return { busToNextLeg: [], deviationFromRoute: deviation };
    }
    return { busToNextLeg: [busCoord, nextCoord], deviationFromRoute: deviation };
  }, [busCoord, nextStopId, segment?.routeStops, fullPolyline, roadPolyline]);

  return { fullPolyline, coveredPolyline, remainingPolyline, busToNextLeg, deviationFromRoute };
}

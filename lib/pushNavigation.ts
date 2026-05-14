import type { PendingPushNavigation } from "../store/slices/notificationsSlice";

/** Maps server `data.type` (and optional ids) to the parent shell tab + context. */
export function targetFromPushData(
  data: Record<string, unknown> | undefined | null
): PendingPushNavigation {
  const raw = data ?? {};
  const type = raw.type != null ? String(raw.type) : "";

  const tripId = raw.tripId != null ? String(raw.tripId) : undefined;
  const busId = raw.busId != null ? String(raw.busId) : undefined;
  const routeId = raw.routeId != null ? String(raw.routeId) : undefined;

  switch (type) {
    case "driver_trip_start":
    case "driver_assigned":
    case "trip_start_reminder":
    case "bus_approaching":
    case "trip_started":
    case "bus_on_the_way":
    case "bus_arriving_soon":
    case "bus_arrived":
    case "bus_left_stop":
    case "route_completed":
    case "student_boarded":
    case "stop_completed":
      return { tab: "track", tripId, busId, routeId };
    default:
      return { tab: "alerts" };
  }
}

export type NotificationRowType =
  | "bus"
  | "board"
  | "delay"
  | "arrive"
  | "update";

/** Filters on Alerts tab — derived from event_type or copy heuristics. */
export type NotificationCategoryFilter =
  | "all"
  | "trip"
  | "attendance"
  | "stops";

export function notificationCategory(
  eventType: string | null | undefined,
  title: string,
  message: string
): "trip" | "attendance" | "stops" | "other" {
  const et = eventType?.trim().toLowerCase() ?? "";
  if (
    [
      "driver_trip_start",
      "driver_assigned",
      "trip_start_reminder",
      "bus_approaching",
    ].includes(et)
  ) {
    return "trip";
  }
  if (et === "student_boarded") return "attendance";
  if (et === "stop_completed") return "stops";

  const t = `${title} ${message}`.toLowerCase();
  if (
    isTripStartStyleNotificationTitle(title) ||
    t.includes("bus trip") ||
    t.includes("driver assigned") ||
    t.includes("approaching")
  ) {
    return "trip";
  }
  if (
    t.includes("present on bus") ||
    t.includes("marked present") ||
    t.includes("boarded")
  ) {
    return "attendance";
  }
  if (t.includes("reached your stop") || t.includes("servicing")) {
    return "stops";
  }
  return "other";
}

/**
 * In-app titles that imply a live school trip. When tracking shows no active trip,
 * these should not drive the home “live bus” card or timeline rows.
 */
export function isTripStartStyleNotificationTitle(title: string): boolean {
  const t = title.trim().toLowerCase();
  return (
    t === "your bus trip is starting" ||
    t === "bus starting now" ||
    t === "driver assigned to bus"
  );
}

export function isStaleTripStartNotification(
  title: string,
  hasLiveTripFromTracking: boolean
): boolean {
  return !hasLiveTripFromTracking && isTripStartStyleNotificationTitle(title);
}

/** Map server copy to alert row icon bucket (no type field on API yet). */
const EVENT_TYPE_TO_ROW: Record<string, NotificationRowType> = {
  student_boarded: "board",
  stop_completed: "arrive",
  bus_approaching: "bus",
  driver_trip_start: "bus",
  driver_assigned: "bus",
  trip_start_reminder: "update",
};

/**
 * Map server `event_type` to alert row icon bucket; fallback to heuristics from copy.
 */
export function rowTypeFromEventType(
  eventType: string | null | undefined,
  title: string,
  message: string
): NotificationRowType {
  if (eventType) {
    const k = eventType.trim().toLowerCase();
    if (EVENT_TYPE_TO_ROW[k]) return EVENT_TYPE_TO_ROW[k];
  }
  return inferNotificationRowType(title, message);
}

export function inferNotificationRowType(
  title: string,
  message: string
): NotificationRowType {
  const t = `${title} ${message}`.toLowerCase();
  if (t.includes("delay") || t.includes("late")) return "delay";
  if (
    t.includes("board") ||
    t.includes("picked up") ||
    t.includes("present on bus") ||
    t.includes("marked present")
  )
    return "board";
  if (
    t.includes("arriv") ||
    t.includes("school") ||
    t.includes("reached your stop") ||
    t.includes("servicing")
  )
    return "arrive";
  if (t.includes("schedule") || t.includes("update")) return "update";
  if (t.includes("bus") || t.includes("stop") || t.includes("approach"))
    return "bus";
  return "bus";
}

export function inferModalType(
  title: string,
  message: string
): "info" | "success" | "alert" {
  const t = `${title} ${message}`.toLowerCase();
  if (t.includes("delay") || t.includes("late") || t.includes("alert"))
    return "alert";
  if (
    t.includes("safe") ||
    t.includes("board") ||
    t.includes("arriv") ||
    t.includes("success")
  )
    return "success";
  return "info";
}

export function inferActivityType(
  title: string,
  message: string
): "bus" | "board" | "arrive" | "default" {
  const row = inferNotificationRowType(title, message);
  if (row === "board") return "board";
  if (row === "arrive") return "arrive";
  if (row === "bus") return "bus";
  return "default";
}

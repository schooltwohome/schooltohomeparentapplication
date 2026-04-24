export type NotificationRowType =
  | "bus"
  | "board"
  | "delay"
  | "arrive"
  | "update";

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
export function inferNotificationRowType(
  title: string,
  message: string
): NotificationRowType {
  const t = `${title} ${message}`.toLowerCase();
  if (t.includes("delay") || t.includes("late")) return "delay";
  if (t.includes("board") || t.includes("picked up")) return "board";
  if (t.includes("arriv") || t.includes("school")) return "arrive";
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

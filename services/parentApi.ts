import { apiRequest } from "./http";

export type LoginResponse = {
  token: string;
  user: {
    uuid: string;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
  };
};

export type ParentProfile = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  parent_profile?: {
    address?: string | null;
    alternate_phone?: string | null;
  } | null;
};

export type ParentChildLink = {
  student: {
    uuid: string;
    name: string;
    grade?: string | null;
    student_code?: string | null;
    school?: { name: string };
  };
};

export function loginWithPassword(identifier: string, password: string) {
  return apiRequest<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: identifier.trim(), password }),
  });
}

export function sendParentOtp(phone: string) {
  return apiRequest<{ message?: string }>("/api/v1/parents/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone: phone.trim() }),
  });
}

export function resendParentOtp(phone: string) {
  return apiRequest<{ message?: string }>("/api/v1/parents/resend-otp", {
    method: "POST",
    body: JSON.stringify({ phone: phone.trim() }),
  });
}

export function verifyParentOtp(phone: string, otp: string) {
  return apiRequest<LoginResponse>("/api/v1/parents/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
  });
}

export function getParentMe(token: string) {
  return apiRequest<ParentProfile>("/api/v1/parents/me", {
    method: "GET",
    token,
  });
}

export function getParentChildren(token: string) {
  return apiRequest<ParentChildLink[]>("/api/v1/parents/children", {
    method: "GET",
    token,
  });
}

export function parentLogout(token: string) {
  return apiRequest<{ success?: boolean }>("/api/v1/parents/logout", {
    method: "POST",
    token,
  });
}

export type ApiNotification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  /** Server semantic type for icon/deep link (e.g. student_boarded, stop_completed). */
  event_type?: string | null;
};

export function getParentNotifications(token: string, limit = 50) {
  return apiRequest<ApiNotification[]>(
    `/api/v1/parents/notifications?limit=${limit}`,
    { method: "GET", token }
  );
}

export function markParentNotificationRead(
  token: string,
  notificationId: string
) {
  return apiRequest<{ success: boolean }>(
    `/api/v1/parents/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "PATCH", token }
  );
}

export function markAllParentNotificationsRead(token: string) {
  return apiRequest<{ success: boolean }>(
    "/api/v1/parents/notifications/read-all",
    { method: "PATCH", token }
  );
}

export function registerParentPushDevice(
  token: string,
  body: { expoPushToken: string; deviceType?: string; appVersion?: string }
) {
  return apiRequest<{ success: boolean }>("/api/v1/parents/device", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export type TrackingSegment = {
  studentUuid: string;
  studentName: string;
  routeName: string | null;
  tripStatus: string | null;
  busNumber: string | null;
  busId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  speedKmh: number | null;
  lastFixAt: string | null;
  isLocationStale?: boolean | null;
  locationAgeSeconds?: number | null;
  latitude: number | null;
  longitude: number | null;
  distanceToPickupKm: number | null;
  etaMinutes: number | null;
  pickupStop: {
    name: string;
    latitude: number;
    longitude: number;
  } | null;
  routeStops: Array<{ id: string; stopName: string; stopOrder: number }>;
  completedStopIds: string[];
  nextStopId: string | null;
  hasReachedPickup: boolean;
  pickupReachedAt: string | null;
};

export function getParentTracking(token: string) {
  return apiRequest<{ segments: TrackingSegment[] }>("/api/v1/parents/tracking", {
    method: "GET",
    token,
  });
}

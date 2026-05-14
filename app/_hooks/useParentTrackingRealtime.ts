import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { SOCKET_IO_ORIGIN } from "../../lib/config";

const DEBOUNCE_MS = 400;

/** Live coordinate push from the server — emitted on every GPS fix without debounce. */
export type LiveLocationPush = {
  busId: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speedKmh?: number | null;
  ts: number;
  tripId?: string;
};

/** Real-time approaching-stop alert emitted when the bus is within the ETA window. */
export type BusArrivingPush = {
  busId: string;
  tripId: string;
  stopId: string;
  stopName: string;
  etaMinutes: number;
  studentName: string;
  ts: number;
};

/**
 * Subscribes to `bus:*` rooms and triggers a refetch when the server signals a tracking change.
 * Polling remains the source of truth if the socket is down.
 * Optionally accepts `onLocationPush` which is called immediately (no debounce) for every
 * "tracking:location" event so the bus marker moves without waiting for the next HTTP poll.
 * Optionally accepts `onArrivingPush` for real-time arriving-soon alerts.
 */
export function useParentTrackingRealtime(
  token: string | null,
  busIds: string[],
  onRefresh: () => void,
  active: boolean,
  onLocationPush?: (data: LiveLocationPush) => void,
  onArrivingPush?: (data: BusArrivingPush) => void,
  onUnauthorized?: () => void
) {
  const socketRef = useRef<Socket | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const onLocationPushRef = useRef(onLocationPush);
  onLocationPushRef.current = onLocationPush;
  const onArrivingPushRef = useRef(onArrivingPush);
  onArrivingPushRef.current = onArrivingPush;
  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;
  const busIdsRef = useRef(busIds);
  busIdsRef.current = busIds;

  const busKey = [...new Set(busIds)].sort().join(",");

  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      onRefreshRef.current();
    }, DEBOUNCE_MS);
  }, []);

  const handleLocationPush = useCallback((data: LiveLocationPush) => {
    const tsRaw = Number(data.ts);
    const normalizedTs =
      Number.isFinite(tsRaw) && tsRaw > 0
        ? tsRaw < 1_000_000_000_000
          ? tsRaw * 1000
          : tsRaw
        : Date.now();
    onLocationPushRef.current?.({
      ...data,
      busId: String(data.busId),
      ts: normalizedTs,
    });
  }, []);

  const handleArrivingPush = useCallback((data: BusArrivingPush) => {
    onArrivingPushRef.current?.(data);
  }, []);

  useEffect(() => {
    if (!active || !token) return;

    const socket = io(SOCKET_IO_ORIGIN, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      auth: { token },
      reconnectionAttempts: Infinity,
      // Auto-reconnect quickly and keep retrying (network switches, wifi/cellular hops).
      reconnectionDelay: 1200,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (__DEV__) {
        console.log("[ParentRealtime] connected", { busCount: busIdsRef.current.length });
      }
      socket.emit("tracking:subscribe", { busIds: busIdsRef.current });
      // Pull once on re-connect to close any gaps from disconnected periods.
      debouncedRefresh();
    });

    socket.on("tracking:update", debouncedRefresh);
    socket.on("tracking:location", handleLocationPush);
    socket.on("tracking:arriving", handleArrivingPush);
    socket.on("reconnect", debouncedRefresh);
    socket.on("connect_error", (err) => {
      if (__DEV__) {
        console.warn("[ParentRealtime] connect_error", err?.message);
      }
      const msg = String(err?.message ?? "");
      if (/unauthorized|forbidden|jwt|token/i.test(msg)) {
        onUnauthorizedRef.current?.();
      }
      debouncedRefresh();
    });
    socket.on("disconnect", (reason) => {
      if (__DEV__) {
        console.log("[ParentRealtime] disconnected", reason);
      }
      if (reason === "io server disconnect") {
        // Server-initiated disconnect often follows auth rejection/expiry.
        onUnauthorizedRef.current?.();
      }
      debouncedRefresh();
    });

    return () => {
      socket.off("tracking:update", debouncedRefresh);
      socket.off("tracking:location", handleLocationPush);
      socket.off("tracking:arriving", handleArrivingPush);
      socket.off("reconnect", debouncedRefresh);
      socket.off("connect_error");
      socket.off("disconnect");
      socket.disconnect();
      socketRef.current = null;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [active, token, debouncedRefresh, handleLocationPush, handleArrivingPush]);

  useEffect(() => {
    const s = socketRef.current;
    if (s?.connected) {
      s.emit("tracking:subscribe", { busIds: busIdsRef.current });
    }
  }, [busKey]);
}


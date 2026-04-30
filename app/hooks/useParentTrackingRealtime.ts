import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { SOCKET_IO_ORIGIN } from "../../lib/config";

const DEBOUNCE_MS = 400;

/**
 * Subscribes to `bus:*` rooms and triggers a refetch when the server signals a tracking change.
 * Polling remains the source of truth if the socket is down.
 */
export function useParentTrackingRealtime(
  token: string | null,
  busIds: string[],
  onRefresh: () => void,
  active: boolean
) {
  const socketRef = useRef<Socket | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const busIdsRef = useRef(busIds);
  busIdsRef.current = busIds;

  const busKey = busIds.join(",");

  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      onRefreshRef.current();
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    if (!active || !token) return;

    const socket = io(SOCKET_IO_ORIGIN, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      auth: { token },
      reconnectionAttempts: 8,
      reconnectionDelay: 1200,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("tracking:subscribe", { busIds: busIdsRef.current });
    });

    socket.on("tracking:update", debouncedRefresh);

    return () => {
      socket.disconnect();
      socketRef.current = null;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [active, token, debouncedRefresh]);

  useEffect(() => {
    const s = socketRef.current;
    if (s?.connected) {
      s.emit("tracking:subscribe", { busIds: busIdsRef.current });
    }
  }, [busKey]);
}


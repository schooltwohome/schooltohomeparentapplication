import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getParentNotifications,
  markParentNotificationRead,
  markAllParentNotificationsRead,
  registerParentPushDevice,
  type ApiNotification,
} from "../../services/parentApi";
import { ApiHttpError } from "../../services/http";
import { formatRelativeTime } from "../../lib/formatRelativeTime";
import {
  rowTypeFromEventType,
  type NotificationRowType,
} from "../../lib/notificationUi";
import { logoutThunk } from "./authSlice";
import Constants from "expo-constants";

type AuthPick = { auth: { token: string | null } };

export type NotificationRow = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: NotificationRowType;
  isRead: boolean;
  eventType: string | null;
};

function mapApi(n: ApiNotification): NotificationRow {
  const et = n.event_type ?? null;
  return {
    id: String(n.id),
    title: n.title,
    message: n.message,
    time: formatRelativeTime(n.created_at),
    type: rowTypeFromEventType(et, n.title, n.message),
    isRead: n.is_read,
    eventType: et,
  };
}

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (_, { getState, rejectWithValue }) => {
    const token = (getState() as AuthPick).auth.token;
    if (!token) return rejectWithValue("Not signed in");
    try {
      const rows = await getParentNotifications(token);
      return rows.map(mapApi);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load notifications";
      return rejectWithValue(msg);
    }
  }
);

export const markNotificationReadThunk = createAsyncThunk(
  "notifications/markOne",
  async (notificationId: string, { getState, rejectWithValue }) => {
    const token = (getState() as AuthPick).auth.token;
    if (!token) return rejectWithValue("Not signed in");
    try {
      await markParentNotificationRead(token, notificationId);
      return notificationId;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Update failed";
      return rejectWithValue(msg);
    }
  }
);

export const markAllNotificationsReadThunk = createAsyncThunk(
  "notifications/markAll",
  async (_, { getState, rejectWithValue }) => {
    const token = (getState() as AuthPick).auth.token;
    if (!token) return rejectWithValue("Not signed in");
    try {
      await markAllParentNotificationsRead(token);
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Update failed";
      return rejectWithValue(msg);
    }
  }
);

export const registerPushDeviceThunk = createAsyncThunk(
  "notifications/registerPush",
  async (expoPushToken: string, { getState, rejectWithValue }) => {
    const token = (getState() as AuthPick).auth.token;
    if (!token) return rejectWithValue("Not signed in");
    try {
      await registerParentPushDevice(token, {
        expoPushToken,
        deviceType: "expo",
        appVersion: Constants.expoConfig?.version ?? undefined,
      });
      return true;
    } catch (e: unknown) {
      if (e instanceof ApiHttpError && e.status === 401) {
        return rejectWithValue({
          unauthorized: true as const,
          message: e.message,
        });
      }
      const msg = e instanceof Error ? e.message : "Device registration failed";
      return rejectWithValue({ unauthorized: false as const, message: msg });
    }
  }
);

/** Bottom tab id in `app/home.tsx` — used when opening from a push tap. */
export type ParentHomeTabId = "home" | "track" | "alerts" | "profile";

export type PendingPushNavigation = {
  tab: ParentHomeTabId;
  tripId?: string;
  busId?: string;
  routeId?: string;
};

type NotificationsState = {
  items: NotificationRow[];
  loading: boolean;
  error: string | null;
  pushRegistered: boolean;
  /** Cleared after the main shell applies the tab switch. */
  pendingPushNavigation: PendingPushNavigation | null;
};

const initialState: NotificationsState = {
  items: [],
  loading: false,
  error: null,
  pushRegistered: false,
  pendingPushNavigation: null,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotifications(state) {
      state.items = [];
      state.error = null;
    },
    clearPushRegistration(state) {
      state.pushRegistered = false;
    },
    setPendingPushNavigation(
      state,
      action: { payload: PendingPushNavigation | null }
    ) {
      state.pendingPushNavigation = action.payload;
    },
    consumePendingPushNavigation(state) {
      state.pendingPushNavigation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed";
      })
      .addCase(markNotificationReadThunk.fulfilled, (state, action) => {
        const id = action.payload;
        const row = state.items.find((i) => i.id === id);
        if (row) row.isRead = true;
      })
      .addCase(markAllNotificationsReadThunk.fulfilled, (state) => {
        state.items.forEach((i) => {
          i.isRead = true;
        });
      })
      .addCase(registerPushDeviceThunk.fulfilled, (state) => {
        state.pushRegistered = true;
      })
      .addCase(registerPushDeviceThunk.rejected, (state, action) => {
        const payload = action.payload as
          | { unauthorized?: boolean; message?: string }
          | string
          | undefined;
        if (
          typeof payload === "object" &&
          payload?.unauthorized === true
        ) {
          state.pushRegistered = false;
        }
      })
      .addCase(logoutThunk.fulfilled, () => ({ ...initialState }));
  },
});

export const {
  clearNotifications,
  clearPushRegistration,
  setPendingPushNavigation,
  consumePendingPushNavigation,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;

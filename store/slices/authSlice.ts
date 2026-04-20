import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { ParentChildLink, ParentProfile } from "../../services/parentApi";
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
} from "../../lib/authTokenStorage";
import {
  getParentChildren,
  getParentMe,
  loginWithPassword,
  parentLogout,
  sendParentOtp,
  resendParentOtp,
  verifyParentOtp,
} from "../../services/parentApi";

const AVATAR_COLORS = ["#818CF8", "#F472B6", "#34D399", "#FBBF24", "#A78BFA"];

export type UiChild = {
  id: string;
  initial: string;
  name: string;
  grade: string;
  section: string;
  busNumber: string;
  avatarColor: string;
  teacher: string;
  driverName: string;
  driverPhone: string;
  emergencyContact: string;
};

function mapChildrenToUi(links: ParentChildLink[]): UiChild[] {
  return links.map((link, index) => {
    const s = link.student;
    const name = s.name || "Student";
    const grade = s.grade?.trim() || "—";
    return {
      id: s.uuid,
      initial: name.charAt(0).toUpperCase(),
      name,
      grade,
      section: "—",
      busNumber: "—",
      avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
      teacher: "—",
      driverName: "—",
      driverPhone: "—",
      emergencyContact: "—",
    };
  });
}

async function loadParentSession(token: string) {
  const [profile, childrenRaw] = await Promise.all([
    getParentMe(token),
    getParentChildren(token),
  ]);
  return {
    profile,
    children: mapChildrenToUi(childrenRaw),
  };
}

export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { token: null as string | null, profile: null, children: [] as UiChild[] };
      }
      const session = await loadParentSession(token);
      return { token, ...session };
    } catch {
      await removeAuthToken();
      return rejectWithValue("Session expired");
    }
  }
);

export const loginWithPasswordThunk = createAsyncThunk(
  "auth/loginPassword",
  async (
    payload: { identifier: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const { token } = await loginWithPassword(
        payload.identifier,
        payload.password
      );
      await setAuthToken(token);
      const session = await loadParentSession(token);
      return { token, ...session };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign in failed";
      return rejectWithValue(msg);
    }
  }
);

export const loginWithOtpThunk = createAsyncThunk(
  "auth/loginOtp",
  async (
    payload: { phone: string; otp: string },
    { rejectWithValue }
  ) => {
    try {
      const { token } = await verifyParentOtp(payload.phone, payload.otp);
      await setAuthToken(token);
      const session = await loadParentSession(token);
      return { token, ...session };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Verification failed";
      return rejectWithValue(msg);
    }
  }
);

export const sendParentOtpThunk = createAsyncThunk(
  "auth/sendOtp",
  async (phone: string, { rejectWithValue }) => {
    try {
      await sendParentOtp(phone);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not send OTP";
      return rejectWithValue(msg);
    }
  }
);

export const resendParentOtpThunk = createAsyncThunk(
  "auth/resendOtp",
  async (phone: string, { rejectWithValue }) => {
    try {
      await resendParentOtp(phone);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not resend OTP";
      return rejectWithValue(msg);
    }
  }
);

type AuthRootPick = { auth: { token: string | null } };

export const logoutThunk = createAsyncThunk("auth/logout", async (_, { getState }) => {
  const token = (getState() as AuthRootPick).auth.token;
  if (token) {
    try {
      await parentLogout(token);
    } catch {
      /* ignore */
    }
  }
  await removeAuthToken();
});

export const refreshParentDataThunk = createAsyncThunk(
  "auth/refresh",
  async (_, { getState, rejectWithValue }) => {
    const token = (getState() as AuthRootPick).auth.token;
    if (!token) return rejectWithValue("Not signed in");
    try {
      return await loadParentSession(token);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Refresh failed";
      return rejectWithValue(msg);
    }
  }
);

export type AuthState = {
  token: string | null;
  initialized: boolean;
  profile: ParentProfile | null;
  children: UiChild[];
  loading: boolean;
  error: string | null;
  otpPending: boolean;
};

const initialState: AuthState = {
  token: null,
  initialized: false,
  profile: null,
  children: [],
  loading: false,
  error: null,
  otpPending: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setProfile(state, action: PayloadAction<ParentProfile | null>) {
      state.profile = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.token = action.payload.token;
        state.profile = action.payload.profile;
        state.children = action.payload.children;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.token = null;
        state.profile = null;
        state.children = [];
      })
      .addCase(loginWithPasswordThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithPasswordThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.profile = action.payload.profile;
        state.children = action.payload.children;
      })
      .addCase(loginWithPasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Sign in failed";
      })
      .addCase(loginWithOtpThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithOtpThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.profile = action.payload.profile;
        state.children = action.payload.children;
      })
      .addCase(loginWithOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Verification failed";
      })
      .addCase(sendParentOtpThunk.pending, (state) => {
        state.otpPending = true;
        state.error = null;
      })
      .addCase(sendParentOtpThunk.fulfilled, (state) => {
        state.otpPending = false;
      })
      .addCase(sendParentOtpThunk.rejected, (state) => {
        state.otpPending = false;
      })
      .addCase(resendParentOtpThunk.pending, (state) => {
        state.otpPending = true;
        state.error = null;
      })
      .addCase(resendParentOtpThunk.fulfilled, (state) => {
        state.otpPending = false;
      })
      .addCase(resendParentOtpThunk.rejected, (state) => {
        state.otpPending = false;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.token = null;
        state.profile = null;
        state.children = [];
      })
      .addCase(refreshParentDataThunk.fulfilled, (state, action) => {
        state.profile = action.payload.profile;
        state.children = action.payload.children;
      });
  },
});

export const { clearError, setProfile } = authSlice.actions;
export default authSlice.reducer;

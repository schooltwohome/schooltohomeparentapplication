import { Platform } from "react-native";
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

function parsePortFromUrl(url: string | undefined): number | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.port) return parseInt(u.port, 10);
    return u.protocol === "https:" ? 443 : 80;
  } catch {
    return null;
  }
}

/**
 * API origin only — no `/api/v1` suffix (paths in `services/` already start with `/api/v1`).
 *
 * Priority: `EXPO_PUBLIC_API_URL` → `app.json` `expo.extra.apiUrl` → smart default.
 * - iOS Simulator: `http://localhost:8080`
 * - Android Emulator: `http://10.0.2.2:8080`
 * - Physical device: set `EXPO_PUBLIC_API_URL=http://<PC-LAN-IP>:8080` (same Wi‑Fi; firewall open on 8080).
 */
export const API_BASE_URL = (() => {
  const env = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (env) return env.replace(/\/$/, "");

  const configUrl = extra?.apiUrl?.trim();
  const port = parsePortFromUrl(configUrl || "http://localhost:8080") ?? 8080;

  if (Platform.OS === "android" && Constants.isDevice === false) {
    return `http://10.0.2.2:${port}`;
  }

  const base = configUrl && configUrl.length > 0 ? configUrl : `http://localhost:${port}`;
  const normalized = base.replace(/\/$/, "");

  if (
    typeof __DEV__ !== "undefined" &&
    __DEV__ &&
    Platform.OS === "android" &&
    Constants.isDevice === true &&
    (normalized.includes("localhost") || normalized.includes("127.0.0.1"))
  ) {
    console.warn(
      "[SchoolToHome] API URL is localhost on a physical Android device — set EXPO_PUBLIC_API_URL to your PC's LAN IP and restart Expo."
    );
  }

  return normalized;
})();

/** Optional: shown in Help & Privacy screens (mailto / in-app browser). */
export const SUPPORT_EMAIL =
  process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || "";
export const PRIVACY_POLICY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() || "";
export const HELP_CENTER_URL =
  process.env.EXPO_PUBLIC_HELP_CENTER_URL?.trim() || "";

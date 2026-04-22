import { API_BASE_URL } from "../lib/config";

export type ApiSuccess<T> = {
  success: boolean;
  message: string;
  data?: T;
};

/** Thrown by `apiRequest` with the HTTP status for callers that branch on codes (e.g. 401). */
export class ApiHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (e: unknown) {
    const raw = e instanceof Error ? e.message : String(e);
    const isNetwork =
      /network request failed|failed to fetch|load failed|aborted/i.test(raw);
    if (isNetwork) {
      throw new Error(
        `Cannot reach the server (${API_BASE_URL}). ` +
          (typeof __DEV__ !== "undefined" && __DEV__
            ? "Android emulator uses 10.0.2.2 to reach your PC. On a phone use EXPO_PUBLIC_API_URL with your PC's LAN IP. Ensure the API is running."
            : "Check your connection and API URL.")
      );
    }
    throw e instanceof Error ? e : new Error(raw);
  }
  const json = (await res.json().catch(() => ({}))) as ApiSuccess<T> & {
    message?: string;
  };

  if (!res.ok || json.success === false) {
    throw new ApiHttpError(
      typeof json.message === "string" && json.message.length > 0
        ? json.message
        : `Request failed (${res.status})`,
      res.status
    );
  }

  return json.data as T;
}

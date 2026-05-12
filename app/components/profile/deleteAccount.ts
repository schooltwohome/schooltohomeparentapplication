import { apiRequest, ApiHttpError } from "../../../services/http";

// TODO(BACKEND-ACCOUNT-DELETE): wire `POST /api/v1/account/delete` when live; return 2xx on success

export type DeleteAccountResult =
  | { status: "ok" }
  | { status: "missing_endpoint" }
  | { status: "error"; message: string };

/**
 * Requests account deletion. If the route is not deployed yet (404/405/501), callers should show
 * the user-facing fallback copy and still clear the local session.
 */
export async function deleteAccount(token: string): Promise<DeleteAccountResult> {
  try {
    await apiRequest<unknown>("/api/v1/account/delete", {
      method: "POST",
      token,
      body: JSON.stringify({}),
    });
    return { status: "ok" };
  } catch (e: unknown) {
    if (e instanceof ApiHttpError && (e.status === 404 || e.status === 405 || e.status === 501)) {
      return { status: "missing_endpoint" };
    }
    if (e instanceof ApiHttpError) {
      return { status: "error", message: e.message };
    }
    const msg = e instanceof Error ? e.message : "Request failed";
    return { status: "error", message: msg };
  }
}

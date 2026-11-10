import { ApiError } from "@/lib/api";
import { BillingError } from "@/lib/billing/api";

/**
 * How an admin call failed with respect to access: the session ended (401),
 * the account may not use the page (403, shown as "Page not found"), or
 * neither (null: show an ordinary error).
 */
export function accessOutcome(caught: unknown): "session" | "denied" | null {
  const status = caught instanceof ApiError
    ? caught.status
    : caught instanceof BillingError
      ? caught.failure.kind === "unauthenticated"
        ? 401
        : caught.failure.kind === "forbidden"
          ? 403
          : caught.failure.kind === "unknown"
            ? caught.failure.status
            : 0
      : 0;
  if (status === 401) return "session";
  if (status === 403) return "denied";
  return null;
}

/** The document title for the admin page in each access state. */
export function adminTitle(state: "checking" | "authorized" | "denied"): string {
  return state === "authorized" ? "Codes | Toone" : state === "denied" ? "Page not found | Toone" : "Account | Toone";
}

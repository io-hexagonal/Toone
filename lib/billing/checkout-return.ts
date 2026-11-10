/**
 * What the page Stripe returns to after a payment shows, as a pure state
 * machine plus a small driver with an injectable clock and fetchers.
 *
 * Nothing here trusts the URL: the `session_id` only lets the page ask the
 * API about that checkout. Pro is shown as on only when the account's
 * entitlement says so.
 *
 *   pending ──entitlement is Pro──────────────▶ active
 *      │  ──session expired unpaid─────────────▶ error (expired)
 *      │  ──401───────────────────────────────▶ signed_out
 *      │  ──deadline, API answered at least once▶ timeout ("still processing")
 *      └  ──deadline, API never answered────────▶ error (unreachable)
 */

import {
  getCheckoutStatus,
  getEntitlement,
  isPro,
  type CheckoutStatus,
  type Entitlement,
} from "./api";
import { billingFailure, type BillingFailure } from "./errors";

export type CheckoutReturnState =
  | {
    kind: "pending";
    /** Polls made so far. */
    attempts: number;
    /** True once the API answered the entitlement request at least once. */
    reached: boolean;
    lastFailure: BillingFailure | null;
  }
  | { kind: "active"; entitlement: Entitlement }
  | { kind: "timeout" }
  | { kind: "signed_out" }
  | { kind: "error"; reason: "expired" | "unreachable"; failure: BillingFailure | null };

export type CheckoutReturnKind = CheckoutReturnState["kind"];

export type CheckoutReturnConfig = {
  /** Give up after this long (ms since the first poll). */
  timeoutMs: number;
  /** Waits between polls; the last value repeats. */
  delaysMs: readonly number[];
};

export const CHECKOUT_RETURN_DEFAULTS: Readonly<CheckoutReturnConfig> = Object.freeze({
  timeoutMs: 60_000,
  delaysMs: Object.freeze([1_000, 1_500, 2_000, 3_000, 5_000]),
});

/** One poll's result: the entitlement (plus the checkout status, when asked), or why it failed. */
export type CheckoutReturnObservation =
  | { entitlement: Entitlement; checkout?: CheckoutStatus | null }
  | { failure: BillingFailure };

export function initialCheckoutReturn(): CheckoutReturnState {
  return { kind: "pending", attempts: 0, reached: false, lastFailure: null };
}

export function isFinalCheckoutReturn(state: CheckoutReturnState): boolean {
  return state.kind !== "pending";
}

/**
 * Applies one poll result. `elapsedMs` is the time since the first poll.
 * Returns the next state and how long to wait before polling again
 * (null once the state is final).
 */
export function stepCheckoutReturn(
  state: CheckoutReturnState,
  observation: CheckoutReturnObservation,
  elapsedMs: number,
  config: CheckoutReturnConfig = CHECKOUT_RETURN_DEFAULTS,
): { state: CheckoutReturnState; delayMs: number | null } {
  if (state.kind !== "pending") return { state, delayMs: null };
  const attempts = state.attempts + 1;
  let reached = state.reached;
  let lastFailure = state.lastFailure;

  if ("failure" in observation) {
    if (observation.failure.kind === "unauthenticated") return { state: { kind: "signed_out" }, delayMs: null };
    // Everything else (network, rate limit, 5xx) may pass: keep polling until the deadline.
    lastFailure = observation.failure;
  } else {
    if (isPro(observation.entitlement)) {
      return { state: { kind: "active", entitlement: observation.entitlement }, delayMs: null };
    }
    if (observation.checkout?.status === "expired") {
      return { state: { kind: "error", reason: "expired", failure: null }, delayMs: null };
    }
    reached = true;
    lastFailure = null;
  }

  const remaining = config.timeoutMs - elapsedMs;
  if (remaining <= 0) {
    const final: CheckoutReturnState = reached
      ? { kind: "timeout" }
      : { kind: "error", reason: "unreachable", failure: lastFailure };
    return { state: final, delayMs: null };
  }
  const delays = config.delaysMs.length ? config.delaysMs : CHECKOUT_RETURN_DEFAULTS.delaysMs;
  const planned = delays[Math.min(attempts - 1, delays.length - 1)];
  // The last wait is cut short so one final poll lands on the deadline.
  return {
    state: { kind: "pending", attempts, reached, lastFailure },
    delayMs: Math.max(0, Math.min(planned, remaining)),
  };
}

export type CheckoutReturnDeps = {
  /** Bearer token of the stored session; null shows the signed-out state at once. */
  token: string | null;
  /** From `stripSessionId()`; null when the page was opened without one. */
  sessionId: string | null;
  fetchEntitlement?: (token: string, signal?: AbortSignal) => Promise<Entitlement>;
  /** Pass null to skip the checkout status request. */
  fetchCheckoutStatus?: ((token: string, sessionId: string, signal?: AbortSignal) => Promise<CheckoutStatus>) | null;
  now?: () => number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  /** Called with every state, including the first `pending`. */
  onState?: (state: CheckoutReturnState) => void;
  signal?: AbortSignal;
  config?: Partial<CheckoutReturnConfig>;
};

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (signal?.aborted) return resolve();
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve();
    }
    signal?.addEventListener("abort", done, { once: true });
  });
}

/**
 * Polls until the state is final (or `signal` aborts, in which case the last
 * state is returned and `onState` is not called again).
 */
export async function pollCheckoutReturn(deps: CheckoutReturnDeps): Promise<CheckoutReturnState> {
  const config: CheckoutReturnConfig = { ...CHECKOUT_RETURN_DEFAULTS, ...deps.config };
  const now = deps.now ?? Date.now;
  const sleep = deps.sleep ?? defaultSleep;
  const fetchEntitlement = deps.fetchEntitlement ?? getEntitlement;
  const fetchStatus = deps.fetchCheckoutStatus === undefined ? getCheckoutStatus : deps.fetchCheckoutStatus;
  const emit = (state: CheckoutReturnState) => { if (!deps.signal?.aborted) deps.onState?.(state); };

  let state = initialCheckoutReturn();
  emit(state);
  if (!deps.token) {
    state = { kind: "signed_out" };
    emit(state);
    return state;
  }
  const token = deps.token;
  const started = now();

  while (!deps.signal?.aborted) {
    const observation = await observe(token, deps.sessionId, fetchEntitlement, fetchStatus, deps.signal);
    if (deps.signal?.aborted) break;
    const step = stepCheckoutReturn(state, observation, now() - started, config);
    state = step.state;
    emit(state);
    if (step.delayMs === null) break;
    await sleep(step.delayMs, deps.signal);
  }
  return state;
}

async function observe(
  token: string,
  sessionId: string | null,
  fetchEntitlement: NonNullable<CheckoutReturnDeps["fetchEntitlement"]>,
  fetchStatus: CheckoutReturnDeps["fetchCheckoutStatus"],
  signal?: AbortSignal,
): Promise<CheckoutReturnObservation> {
  // The checkout status is a hint (it spots an expired, unpaid session early);
  // its failures never decide the outcome.
  const status = sessionId && fetchStatus
    ? fetchStatus(token, sessionId, signal).catch(() => null)
    : Promise.resolve(null);
  try {
    const [entitlement, checkout] = await Promise.all([fetchEntitlement(token, signal), status]);
    return { entitlement, checkout };
  } catch (error) {
    await status;
    return { failure: billingFailure(error) };
  }
}

/* ---- session_id in the return URL */

const SESSION_ID_PATTERN = /^cs_[A-Za-z0-9_]{1,250}$/;

/**
 * Splits the Checkout `session_id` out of a URL. `cleaned` is the same
 * path, query and hash without it (null when there was nothing to remove).
 * A malformed id is still removed, but returned as null.
 */
export function splitSessionId(href: string): { sessionId: string | null; cleaned: string | null } {
  let url: URL;
  try {
    url = new URL(href, "https://trytoone.com");
  } catch {
    return { sessionId: null, cleaned: null };
  }
  if (!url.searchParams.has("session_id")) return { sessionId: null, cleaned: null };
  const raw = url.searchParams.get("session_id") ?? "";
  url.searchParams.delete("session_id");
  const query = url.searchParams.toString();
  return {
    sessionId: SESSION_ID_PATTERN.test(raw) ? raw : null,
    cleaned: `${url.pathname}${query ? `?${query}` : ""}${url.hash}`,
  };
}

type HistoryWindow = {
  location: { href: string };
  history: { state: unknown; replaceState(data: unknown, unused: string, url?: string | URL | null): void };
};

/**
 * Reads the Checkout `session_id` from the address bar and removes it with
 * `history.replaceState`, so analytics and referrers never see it. Call it
 * before anything else on the page reads the URL. Null when there was none
 * (or it was malformed) and outside a browser.
 */
export function stripSessionId(win: HistoryWindow | undefined = typeof window === "undefined" ? undefined : window): string | null {
  if (!win) return null;
  const { sessionId, cleaned } = splitSessionId(win.location.href);
  if (cleaned !== null) win.history.replaceState(win.history.state, "", cleaned);
  return sessionId;
}

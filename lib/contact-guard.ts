/**
 * Abuse guards for `/api/contact` (contact modal and the goodwill refund
 * form): a honeypot field, an Origin allowlist and a per-IP rate limit. None
 * of these is a security boundary (a script can send any Origin and rotate
 * IPs); together they keep drive-by spam and cross-site form posts out of the
 * team's Discord channel.
 */

/**
 * The honeypot: a text input both forms render visually hidden, aria-hidden
 * and out of the tab order. People never see it, so a non-empty value means a
 * bot filled every field it found; the route then answers 200 without posting.
 */
export const HONEYPOT_FIELD = "website";

/** True when the parsed body carries a filled honeypot. */
export function honeypotFilled(body: unknown): boolean {
  if (body == null || typeof body !== "object") return false;
  const value = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof value === "string" && value.trim() !== "";
}

const ALLOWED_ORIGINS = new Set(["https://trytoone.com", "https://www.trytoone.com"]);
/** `next dev` on this machine (allowedDevOrigins in next.config.ts lists 127.0.0.1). */
const DEV_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * Browsers send `Origin` on every cross-site POST: when it is present it must
 * be the site itself (or local development). A request without it (curl, a
 * server) is let through; the rate limit and the honeypot still apply.
 */
export function originAllowed(origin: string | null): boolean {
  if (origin == null) return true;
  return ALLOWED_ORIGINS.has(origin) || DEV_ORIGIN.test(origin);
}

/**
 * The client IP: the first `x-forwarded-for` entry, else `x-real-ip`. Vercel
 * sets both and overwrites whatever the client sent.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/** At most this many requests per IP … */
export const CONTACT_RATE_LIMIT = 5;
/** … in this sliding window. */
export const CONTACT_RATE_WINDOW_MS = 10 * 60 * 1000;
/** Prune expired IPs once the map holds this many, so it cannot grow without bound. */
const PRUNE_AT = 1000;

/**
 * A best-effort sliding-window limiter kept in memory. It is per serverless
 * instance: Vercel may run several instances (and recycles them), so the
 * effective limit across the fleet is higher. Good enough to blunt a single
 * client hammering the route; not a guarantee.
 */
export function createRateLimiter({
  limit = CONTACT_RATE_LIMIT,
  windowMs = CONTACT_RATE_WINDOW_MS,
  now = () => Date.now(),
}: { limit?: number; windowMs?: number; now?: () => number } = {}) {
  const hits = new Map<string, number[]>();

  function prune(at: number) {
    for (const [key, times] of hits) {
      if (times[times.length - 1] <= at - windowMs) hits.delete(key);
    }
  }

  return {
    /** Records a request from `key`; false when it is over the limit (the request is not counted then). */
    allow(key: string): boolean {
      const at = now();
      if (hits.size >= PRUNE_AT) prune(at);
      const recent = (hits.get(key) ?? []).filter((time) => time > at - windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(at);
      hits.set(key, recent);
      return true;
    },
    /** IPs currently tracked (tests). */
    get size() {
      return hits.size;
    },
  };
}

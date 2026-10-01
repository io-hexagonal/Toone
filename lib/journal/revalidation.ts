import type { JournalRevalidateEvent } from "./types";

/**
 * Contract §9: Journal events share the Explore webhook URL, secret and
 * signature. The signature is verified first (`lib/explore/revalidation.ts`);
 * only then is the body routed here when it says `"type": "journal"`.
 */
const EVENTS = new Set(["published", "updated", "retired"]);
const POST_ID = /^jnp_[a-z0-9]{8,32}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** True when a signed body is addressed to the Journal handler. */
export function isJournalPayload(raw: string): boolean {
  try {
    const body = JSON.parse(raw);
    return !!body && typeof body === "object" && body.type === "journal";
  } catch {
    return false;
  }
}

/** Parse and validate a Journal webhook body; null when malformed. */
export function parseJournalEvent(raw: string): JournalRevalidateEvent | null {
  try {
    const event = JSON.parse(raw);
    if (!event || typeof event !== "object" || Array.isArray(event)) return null;
    if (event.type !== "journal" || !EVENTS.has(event.event)) return null;
    if (typeof event.id !== "string" || !POST_ID.test(event.id)) return null;
    if (
      typeof event.slug !== "string" ||
      event.slug.length < 3 ||
      event.slug.length > 80 ||
      !SLUG.test(event.slug)
    )
      return null;
    if (typeof event.occurred_at !== "string" || !Number.isFinite(Date.parse(event.occurred_at)))
      return null;
    return {
      event: event.event,
      type: "journal",
      id: event.id,
      slug: event.slug,
      occurred_at: event.occurred_at,
    };
  } catch {
    return null;
  }
}

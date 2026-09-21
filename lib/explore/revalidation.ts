import { createHmac, timingSafeEqual } from "node:crypto";
import type { RevalidateEvent } from "./types";
export function verifyRevalidation(
  raw: string,
  signature: string | null,
  secret: string,
): RevalidateEvent | null {
  if (!secret || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature))
    return null;
  const expected = createHmac("sha256", secret).update(raw).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature.slice(7), "hex")))
    return null;
  try {
    const event = JSON.parse(raw);
    if (
      !event ||
      !["approved", "removed", "repinned", "listing_changed"].includes(
        event.event,
      )
    )
      return null;
    if (!["routine", "bundle"].includes(event.type)) return null;
    if (
      typeof event.id !== "string" ||
      !(
        event.type === "routine"
          ? /^wfl_[a-z0-9]{8,32}$/
          : /^wfb_[a-z0-9]{8,32}$/
      ).test(event.id)
    )
      return null;
    if (
      typeof event.slug !== "string" ||
      event.slug.length > 128 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(event.slug)
    )
      return null;
    if (
      typeof event.occurred_at !== "string" ||
      !Number.isFinite(Date.parse(event.occurred_at))
    )
      return null;
    return event;
  } catch {
    return null;
  }
}

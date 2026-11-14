/**
 * Attribution carried from Explore to the access request (before the launch)
 * or to sign-up and download (after it): `from=explore` and the record
 * (`routine:wfl_…` / `bundle:wfb_…`). Anything else is dropped. Dependency-free
 * so proxy.ts can use it.
 */
const ATTRIBUTION_ITEM = /^(routine:wfl|bundle:wfb)_[a-z0-9]{8,32}$/;
export function accessAttribution(from: unknown, item: unknown): { from?: string; item?: string } {
  if (from !== "explore") return {};
  return typeof item === "string" && ATTRIBUTION_ITEM.test(item) ? { from, item } : { from };
}

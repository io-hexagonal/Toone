import { journalListRoute } from "@/components/journal/JournalList";

/** Routines hub, page n ≥ 2. */
const route = journalListRoute("routines");

// Rendered on the first request (or at build), then served from cache. The
// data cache window matches; the signed webhook expires both on publish.
export const revalidate = 600;
// Rendered per request (the CSP nonce, lib/csp.ts); `revalidate` still sets
// the default data-cache lifetime of this page's fetches.
export const generateMetadata = route.generateMetadata;
export default route.Page;

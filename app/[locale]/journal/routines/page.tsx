import { journalListRoute } from "@/components/journal/JournalList";

/** Routines hub: posts of type `spotlight` (Explore routines and bundles). */
const route = journalListRoute("routines");

// Rendered on the first request (or at build), then served from cache. The
// data cache window matches; the signed webhook expires both on publish.
export const revalidate = 600;
export const generateMetadata = route.generateMetadata;
export default route.Page;

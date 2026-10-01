import { journalListRoute } from "@/components/journal/JournalList";

/** Releases hub: posts of type `release` (the `/changelog` redirect target). */
const route = journalListRoute("releases");

// Rendered on the first request (or at build), then served from cache. The
// data cache window matches; the signed webhook expires both on publish.
export const revalidate = 600;
export const generateMetadata = route.generateMetadata;
export default route.Page;

import { journalListRoute } from "@/components/journal/JournalList";

/** Journal index, page 1: every published post, newest first (contract §2). */
const route = journalListRoute(null);

// Rendered on the first request (or at build), then served from cache. The
// data cache window matches; the signed webhook expires both on publish.
export const revalidate = 600;
export const generateMetadata = route.generateMetadata;
export default route.Page;

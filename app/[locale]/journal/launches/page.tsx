import { journalListRoute } from "@/components/journal/JournalList";

/** Launches hub: posts of type `launch`. */
const route = journalListRoute("launches");

// Rendered on the first request (or at build), then served from cache. The
// data cache window matches; the signed webhook expires both on publish.
export const revalidate = 600;
export const generateMetadata = route.generateMetadata;
export default route.Page;

import { journalListRoute } from "@/components/journal/JournalList";

/** Journal index, page n ≥ 2; `/page/1` 308s to the index, a page past the last is a 404. */
const route = journalListRoute(null);

// Rendered on the first request (or at build), then served from cache. The
// data cache window matches; the signed webhook expires both on publish.
export const revalidate = 600;
export const dynamicParams = true;
export function generateStaticParams(): { n: string }[] {
  return [];
}
export const generateMetadata = route.generateMetadata;
export default route.Page;

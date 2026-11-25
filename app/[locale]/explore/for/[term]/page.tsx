import TopicPage, { topicPageMetadata, type TopicPageProps } from "@/components/explore/TopicPage";

// Rendered on the first request, then served from cache like the record pages.
export const revalidate = 600;
// Rendered per request (the CSP nonce, lib/csp.ts); `revalidate` still sets
// the default data-cache lifetime of this page's fetches.
export function generateMetadata(props: TopicPageProps) {
  return topicPageMetadata("useful_for", props);
}
export default function Page(props: TopicPageProps) {
  return <TopicPage kind="useful_for" {...props} />;
}

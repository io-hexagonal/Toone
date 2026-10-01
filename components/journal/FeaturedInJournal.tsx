import { getPostsFeaturing } from "@/lib/journal/api";
import { formatPostDate, listPath, postPath } from "@/lib/journal/presentation";
import { TypeEyebrow } from "./JournalParts";

/**
 * "Featured in the Journal" on an Explore detail page (contract §10): up to
 * three posts whose live revision embeds this routine or bundle, from
 * `GET /v1/journal/posts?explore={slug}` (data cache tag `journal`, so a
 * publish refreshes the Explore page too). Renders nothing when there are
 * none or the Journal is unreachable.
 */
export default async function FeaturedInJournal({ exploreSlug }: { exploreSlug: string }) {
  const posts = await getPostsFeaturing(exploreSlug, 3);
  if (!posts.length) return null;
  return (
    <section className="jr-featured explore-width" aria-labelledby="jr-featured-title">
      <div className="jr-featured-inner">
        <h2 id="jr-featured-title">Featured in the Journal</h2>
        <p>Posts from the Toone Journal that walk through this listing.</p>
        <ul className="jr-featured-list">
          {posts.map((post) => (
            <li key={post.post_id}>
              <a href={postPath(post.slug)}>
                <TypeEyebrow post={post} />
                <strong>{post.title}</strong>
                <time dateTime={post.published_at}>{formatPostDate(post.published_at)}</time>
              </a>
            </li>
          ))}
        </ul>
        <a className="jr-featured-all" href={listPath(null)}>
          Read the Journal →
        </a>
      </div>
    </section>
  );
}

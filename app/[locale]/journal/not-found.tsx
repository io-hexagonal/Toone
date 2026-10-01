import { setRequestLocale } from "next-intl/server";
import { JournalShell } from "@/components/journal/JournalParts";
import { listPath } from "@/lib/journal/presentation";

/**
 * Not-found for every Journal route: unknown slugs, retired posts without a
 * successor (contract §7.2), out-of-range pages and expired previews. Next
 * answers 404 and adds `<meta name="robots" content="noindex">`.
 *
 * A not-found boundary receives no params. The Journal is English-only, so
 * the request locale is set here; without it the footer's translations would
 * read request headers and turn every Journal route dynamic.
 */
export default function JournalNotFound() {
  setRequestLocale("en");
  return (
    <JournalShell>
      <header className="jr-hero">
        <div className="jr-hero-inner">
          <p className="jr-eyebrow">Toone Journal</p>
          <h1>This page is not available</h1>
          <p className="jr-hero-intro">
            The post may have been retired, the link may be mistyped, or the page number is past the
            last page.
          </p>
          <ul className="jr-tabs">
            <li>
              <a href={listPath(null)}>Read the latest posts</a>
            </li>
            <li>
              <a href="/en/explore">Browse Explore</a>
            </li>
          </ul>
        </div>
      </header>
    </JournalShell>
  );
}

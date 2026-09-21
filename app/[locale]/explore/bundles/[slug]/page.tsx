import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getBundle, resolveSlug, resolveCoverUrl } from "@/lib/explore/api";
import {
  exploreMetadata,
  breadcrumbSchema,
  SITE,
} from "@/lib/explore/presentation";
import {
  ExploreShell,
  ExploreUnavailable,
  DetailHero,
  DetailsCard,
  formatDate,
  Cover,
  Counts,
  Tags,
  JsonLd,
  getExploreCopy,
} from "@/components/explore/ExploreView";

type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const detail = await getBundle(slug);
    if (!detail) return { robots: { index: false } };
    return exploreMetadata(
      locale,
      `/explore/bundles/${resolveSlug(detail)}`,
      detail.title,
      detail.summary,
      resolveCoverUrl(detail),
    );
  } catch {
    return { title: "Explore", robots: { index: false, follow: true } };
  }
}
export default async function BundlePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const ui = await getExploreCopy(locale);
  let detail;
  try {
    detail = await getBundle(slug);
  } catch (error) {
    console.error(
      "[explore] bundle unavailable",
      error instanceof Error ? error.name : "unknown",
    );
    return (
      <ExploreUnavailable
        ui={ui}
        locale={locale}
        retryHref={`/${locale}/explore/bundles/${encodeURIComponent(slug)}`}
      />
    );
  }
  if (!detail) notFound();
  const canonical = resolveSlug(detail);
  if (canonical !== slug)
    permanentRedirect(`/${locale}/explore/bundles/${canonical}`);
  const members = [...detail.members].sort((a, b) => a.position - b.position);
  return (
    <ExploreShell>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: detail.title,
          description: detail.summary,
          numberOfItems: members.length,
          itemListElement: members.map((member, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: member.title,
            url: `${SITE}/en/explore/routines/${resolveSlug(member)}`,
          })),
        }}
      />
      <JsonLd
        value={breadcrumbSchema(detail.title, `/explore/bundles/${canonical}`)}
      />
      <DetailHero detail={detail} type="bundle" locale={locale} ui={ui} />
      <main className="explore-detail-body explore-width">
        <div className="explore-body">
          <section className="explore-section" id="routines">
            <h2>{ui.includedRoutines}</h2>
            <p className="explore-lede explore-muted">{ui.bundleDescription}</p>
            <ul className="explore-bundle-members">
              {members.map((member) => (
                <li className="explore-bundle-member" key={member.workflow_id}>
                  <a
                    className="explore-bundle-member-art"
                    href={`/${locale}/explore/routines/${resolveSlug(member)}`}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <Cover entry={member} />
                  </a>
                  <div className="explore-bundle-member-copy">
                    <h3>
                      <a
                        href={`/${locale}/explore/routines/${resolveSlug(member)}`}
                      >
                        {member.title}
                      </a>
                    </h3>
                    <p>{member.summary}</p>
                    <Counts entry={member} ui={ui} />
                    <Tags tags={member.tags} locale={locale} ui={ui} />
                    <div className="explore-bundle-member-foot">
                      <span className="explore-muted">
                        {ui.approved}{" "}
                        <time dateTime={member.approved_at}>
                          {formatDate(locale, member.approved_at)}
                        </time>
                      </span>
                      {member.newer_revision_available && (
                        <span className="explore-newer">{ui.newer}</span>
                      )}
                      <a
                        href={`/${locale}/explore/routines/${resolveSlug(member)}`}
                      >
                        {ui.viewRoutine} →
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="explore-rail">
          <DetailsCard detail={detail} ui={ui} locale={locale} />
          <a className="explore-back" href={`/${locale}/explore`}>
            ← {ui.back}
          </a>
        </aside>
      </main>
    </ExploreShell>
  );
}

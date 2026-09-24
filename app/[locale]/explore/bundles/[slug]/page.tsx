import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { getBundle, findBundleByIdTail, resolveSlug, resolveCoverUrl, getExploreTaxonomy } from "@/lib/explore/api";
import {
  exploreMetadata,
  breadcrumbSchema,
  cardText,
  profileSchema,
  isExploreIndexable,
  SITE,
} from "@/lib/explore/presentation";
import { termLabel } from "@/lib/explore/taxonomy";
import type { BundlePublicDetail } from "@/lib/explore/types";
import { ProfileBody, ProfileHero } from "@/components/explore/ProfileView";
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
  capitalize,
  type ExploreCopy,
} from "@/components/explore/ExploreView";

type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const detail = await getBundle(slug);
    if (!detail) return { robots: { index: false } };
    const path = `/explore/bundles/${resolveSlug(detail)}`;
    const profile = detail.listing_profile;
    if (profile)
      return exploreMetadata(
        locale,
        path,
        profile.search.seo_title,
        profile.search.meta_description,
        resolveCoverUrl(detail),
        { imageAlt: profile.cover_alt, indexable: isExploreIndexable(detail) },
      );
    return exploreMetadata(
      locale,
      path,
      detail.title,
      detail.summary,
      resolveCoverUrl(detail),
      { indexable: false },
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
  if (!detail) {
    const moved = await findBundleByIdTail(slug).catch(() => null);
    if (moved)
      permanentRedirect(`/${locale}/explore/bundles/${resolveSlug(moved)}`);
    notFound();
  }
  const canonical = resolveSlug(detail);
  if (canonical !== slug)
    permanentRedirect(`/${locale}/explore/bundles/${canonical}`);
  const members = [...detail.members].sort((a, b) => a.position - b.position);
  const profile = detail.listing_profile;
  if (profile) {
    const path = `/explore/bundles/${canonical}`;
    const taxonomy = detail.classification
      ? await getExploreTaxonomy().catch(() => null)
      : null;
    const categoryId = detail.classification?.category_id;
    const category = categoryId
      ? { id: categoryId, label: capitalize(termLabel(taxonomy, categoryId)) }
      : null;
    const view = { detail, profile, type: "bundle" as const, locale, ui, taxonomy };
    return (
      <ExploreShell>
        <JsonLd value={profileSchema(detail, profile, path)} />
        <JsonLd
          value={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: profile.search.display_title,
            url: `${SITE}/en${path}`,
            numberOfItems: members.length,
            itemListElement: members.map((member, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: cardText(member).title,
              url: `${SITE}/en/explore/routines/${resolveSlug(member)}`,
            })),
          }}
        />
        <JsonLd value={breadcrumbSchema(profile.search.display_title, path, category)} />
        <ProfileHero {...view} />
        <main>
          <ProfileBody
            {...view}
            routinesInside={<RoutinesInside members={members} locale={locale} ui={ui} />}
          />
        </main>
      </ExploreShell>
    );
  }
  return (
    <ExploreShell>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: detail.title,
          description: detail.summary,
          url: `${SITE}/en/explore/bundles/${canonical}`,
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
                      <time
                        className="explore-muted"
                        dateTime={member.approved_at}
                      >
                        {formatDate(locale, member.approved_at, "medium")}
                      </time>
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

/** "The routines inside": each member in its plain wording, linked. */
function RoutinesInside({
  members,
  locale,
  ui,
}: {
  members: BundlePublicDetail["members"];
  locale: string;
  ui: ExploreCopy;
}): ReactNode {
  return (
    <>
      <p className="explore-lede explore-muted">{ui.bundleDescription}</p>
      <ul className="explore-bundle-members">
        {members.map((member) => {
          const href = `/${locale}/explore/routines/${resolveSlug(member)}`;
          const text = cardText(member);
          return (
            <li className="explore-bundle-member" key={member.workflow_id}>
              <a className="explore-bundle-member-art" href={href} tabIndex={-1} aria-hidden="true">
                <Cover entry={member} />
              </a>
              <div className="explore-bundle-member-copy">
                <h3>
                  <a href={href}>{text.title}</a>
                </h3>
                <p>{text.summary}</p>
                <div className="explore-bundle-member-foot">
                  {!!member.results_count && (
                    <span className="explore-muted">{ui.count("results", member.results_count)}</span>
                  )}
                  {member.newer_revision_available && (
                    <span className="explore-newer">{ui.newer}</span>
                  )}
                  <a href={href}>{ui.viewRoutine} →</a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

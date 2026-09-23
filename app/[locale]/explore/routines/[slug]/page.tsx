import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import {
  getRoutine,
  findRoutineByIdTail,
  resolveSlug,
  resolveCoverUrl,
  getExploreTaxonomy,
} from "@/lib/explore/api";
import {
  exploreMetadata,
  routineSchema,
  breadcrumbSchema,
  profileSchema,
} from "@/lib/explore/presentation";
import { termLabel } from "@/lib/explore/taxonomy";
import {
  ExploreShell,
  ExploreUnavailable,
  DetailHero,
  RoutineContent,
  JsonLd,
  getExploreCopy,
  capitalize,
} from "@/components/explore/ExploreView";
import { ProfileBody, ProfileHero } from "@/components/explore/ProfileView";

type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const detail = await getRoutine(slug);
    if (!detail) return { robots: { index: false } };
    const path = `/explore/routines/${resolveSlug(detail)}`;
    const profile = detail.listing_profile;
    if (profile)
      return exploreMetadata(
        locale,
        path,
        profile.search.seo_title,
        profile.search.meta_description,
        resolveCoverUrl(detail),
        { imageAlt: profile.cover_alt, indexable: detail.indexable },
      );
    return exploreMetadata(
      locale,
      path,
      detail.title,
      detail.summary,
      resolveCoverUrl(detail),
      { indexable: detail.indexable },
    );
  } catch {
    return { title: "Explore", robots: { index: false, follow: true } };
  }
}
export default async function RoutinePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const ui = await getExploreCopy(locale);
  let detail;
  try {
    detail = await getRoutine(slug);
  } catch (error) {
    console.error(
      "[explore] routine unavailable",
      error instanceof Error ? error.name : "unknown",
    );
    return (
      <ExploreUnavailable
        ui={ui}
        locale={locale}
        retryHref={`/${locale}/explore/routines/${encodeURIComponent(slug)}`}
      />
    );
  }
  if (!detail) {
    const moved = await findRoutineByIdTail(slug).catch(() => null);
    if (moved)
      permanentRedirect(`/${locale}/explore/routines/${resolveSlug(moved)}`);
    notFound();
  }
  const canonical = resolveSlug(detail);
  if (canonical !== slug)
    permanentRedirect(`/${locale}/explore/routines/${canonical}`);
  const path = `/explore/routines/${canonical}`;
  const profile = detail.listing_profile;
  if (!profile)
    return (
      <ExploreShell>
        <JsonLd value={routineSchema(detail)} />
        <JsonLd value={breadcrumbSchema(detail.title, path)} />
        <DetailHero detail={detail} type="routine" locale={locale} ui={ui} />
        <main>
          <RoutineContent detail={detail} ui={ui} locale={locale} />
        </main>
      </ExploreShell>
    );
  const taxonomy = detail.classification
    ? await getExploreTaxonomy().catch(() => null)
    : null;
  const categoryId = detail.classification?.category_id;
  const category = categoryId
    ? { id: categoryId, label: capitalize(termLabel(taxonomy, categoryId)) }
    : null;
  const view = { detail, profile, type: "routine" as const, locale, ui, taxonomy };
  return (
    <ExploreShell>
      <JsonLd value={profileSchema(detail, profile, path)} />
      <JsonLd value={breadcrumbSchema(profile.search.display_title, path, category)} />
      <ProfileHero {...view} />
      <main>
        <ProfileBody {...view} />
      </main>
    </ExploreShell>
  );
}

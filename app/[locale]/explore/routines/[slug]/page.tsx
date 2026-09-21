import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getRoutine, resolveSlug, resolveCoverUrl } from "@/lib/explore/api";
import {
  exploreMetadata,
  routineSchema,
  breadcrumbSchema,
} from "@/lib/explore/presentation";
import {
  ExploreShell,
  ExploreUnavailable,
  DetailHero,
  RoutineContent,
  JsonLd,
  getExploreCopy,
} from "@/components/explore/ExploreView";

type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const detail = await getRoutine(slug);
    if (!detail) return { robots: { index: false } };
    return exploreMetadata(
      locale,
      `/explore/routines/${resolveSlug(detail)}`,
      detail.title,
      detail.summary,
      resolveCoverUrl(detail),
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
  if (!detail) notFound();
  const canonical = resolveSlug(detail);
  if (canonical !== slug)
    permanentRedirect(`/${locale}/explore/routines/${canonical}`);
  return (
    <ExploreShell>
      <JsonLd value={routineSchema(detail)} />
      <JsonLd
        value={breadcrumbSchema(detail.title, `/explore/routines/${canonical}`)}
      />
      <DetailHero detail={detail} type="routine" locale={locale} ui={ui} />
      <main>
        <RoutineContent detail={detail} ui={ui} locale={locale} />
      </main>
    </ExploreShell>
  );
}

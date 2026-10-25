import WaitlistPage from "@/components/WaitlistPage";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { openGraphLocale } from "@/i18n/open-graph";
import { localeRobots, localeVersions } from "@/i18n/indexing";

const TITLE = "Request early access to Toone | AI routines on macOS";
const DESCRIPTION =
  "Get free early access to Toone, the macOS app where specialist agents run your recurring workflows under your control. Bring your own Claude Code or Codex.";
const CANONICAL = "https://trytoone.com/en/request-access";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  // This is the public *request* page of the invitation-only funnel: leave an
  // email, receive a personal code, redeem it. `/early-access` is the code
  // gate and stays `noindex`; this page is the indexable conversion
  // destination, so it carries a real title/description, a self-canonical
  // and a sitemap entry. No hreflang: English is the only indexed locale
  // (TECH-021).
  //
  // The seven non-English routes render the form alone — the English content
  // block above it is not translated yet — so they stay `noindex, follow`.
  //
  // `alternates` must still be set explicitly for them: omitting it lets the
  // root layout's metadata merge in, which canonicalised `/pt/request-access`
  // to `https://trytoone.com/pt`. A self-canonical keeps the page honest
  // (TECH-010).
  if (locale !== "en") {
    return {
      title: { absolute: TITLE },
      description: DESCRIPTION,
      alternates: { canonical: `https://trytoone.com/${locale}/request-access` },
      robots: localeRobots(locale),
      // og:url follows the canonical (R7) instead of inheriting the locale home.
      openGraph: {
        type: "website",
        url: `https://trytoone.com/${locale}/request-access`,
        siteName: "Toone",
        ...openGraphLocale(locale, []),
        images: ["https://trytoone.com/assets/og/toone-og.png"],
      },
    };
  }

  return {
    // The title already carries "Toone": `absolute` keeps the root
    // `%s | Toone` template from double-branding it (audit P2-5).
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: CANONICAL },
    robots: localeRobots(locale),
    other: localeVersions("/request-access", ["en"]),
    openGraph: {
      type: "website",
      url: CANONICAL,
      title: "Request early access to Toone",
      description: DESCRIPTION,
      siteName: "Toone",
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}

export default async function RequestAccess({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WaitlistPage />;
}

import WaitlistPage from "@/components/WaitlistPage";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

const TITLE = "Request early access to Toone | AI routines on macOS";
const DESCRIPTION =
  "Toone is a macOS app where specialist agents run your routines. Access is invitation-only: " +
  "leave your email and we send a personal code when a place opens.";
const CANONICAL = "https://trytoone.com/en/request-access";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  // This is the public *request* page of the invitation-only funnel: leave an
  // email, receive a personal code, redeem it. `/early-access` is the code
  // gate and stays `noindex`; this page is the indexable conversion
  // destination, so it carries a real title/description, a self-canonical,
  // `en` + `x-default` hreflang, and a sitemap entry.
  //
  // The seven non-English routes render the form alone — the English content
  // block above it is not translated yet — so they stay `noindex, follow` and
  // emit no alternates (TECH-010 forbids advertising a hreflang set the
  // page's own copy does not back).
  //
  // `alternates` must still be set explicitly for them: omitting it lets the
  // root layout's metadata merge in, which canonicalised `/pt/request-access`
  // to `https://trytoone.com/pt` and attached the nine locale-home hreflang
  // links. A self-canonical plus an empty language map keeps the page honest
  // and silent (TECH-010).
  if (locale !== "en") {
    return {
      title: { absolute: TITLE },
      description: DESCRIPTION,
      alternates: {
        canonical: `https://trytoone.com/${locale}/request-access`,
        languages: {},
      },
      robots: { index: false, follow: true },
      // og:url follows the canonical (R7) instead of inheriting the locale home.
      openGraph: {
        type: "website",
        url: `https://trytoone.com/${locale}/request-access`,
        siteName: "Toone",
        images: ["https://trytoone.com/assets/og/toone-og.png"],
      },
    };
  }

  return {
    // The title already carries "Toone": `absolute` keeps the root
    // `%s | Toone` template from double-branding it (audit P2-5).
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: {
      canonical: CANONICAL,
      languages: { en: CANONICAL, "x-default": CANONICAL },
    },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url: CANONICAL,
      title: "Request early access to Toone",
      description:
        "Toone is the AI workspace for your agentic workflows: a macOS app where specialist " +
        "agents run your workflows and routines under your control. Access is by invitation.",
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

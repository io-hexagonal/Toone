import AuthPage from "@/components/AuthPage";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { openGraphLocale } from "@/i18n/open-graph";
import { localeRobots } from "@/i18n/indexing";
import { isLaunched } from "@/lib/launch";
import { launchRedirect } from "@/lib/launch-routes";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  const url = `https://trytoone.com/${locale}/signup`;
  // From the launch this is the public sign-up page and the sitemap lists
  // `/en/signup`; the other locales stay `noindex, follow` (TECH-021).
  return {
    title: t("signupTitle"),
    description: t("signupSub"),
    alternates: { canonical: url },
    robots: localeRobots(locale),
    // og:url follows the canonical (R7) instead of inheriting the locale home.
    openGraph: { type: "website", url, siteName: "Toone", ...openGraphLocale(locale, []) },
  };
}

/**
 * Open sign-up (AuthPage mode "signup"). Before the launch (lib/launch.ts) the
 * page is a temporary redirect to the access request; proxy.ts answers that
 * on every request already, this is the fallback. A deployment built before
 * the launch renders the page on request; one built after it is static.
 */
export default async function SignUpPage({ params }: Props) {
  const { locale } = await params;
  if (!isLaunched()) {
    await connection();
    const answer = launchRedirect(`/${locale}/signup`, new URLSearchParams());
    if (answer) redirect(answer.location);
  }
  setRequestLocale(locale);
  return <AuthPage mode="signup" />;
}

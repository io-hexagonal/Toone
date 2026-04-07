import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/routing";
import type { Metadata } from "next";
import "../globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `https://trytoone.com/${l}`;
  }

  return {
    title: {
      default: t("siteTitle"),
      template: `%s | Toone`,
    },
    description: t("siteDescription"),
    keywords: ["AI agents", "AI teams", "autonomous agents", "macOS AI", "agent orchestration", "Toone", "AI productivity", "Claude Code", "Codex", "MCP tools", "AI routines", "AI integrations", "Media Marketing AI", "Polymarket AI"],
    applicationName: "Toone",
    metadataBase: new URL("https://trytoone.com"),
    alternates: {
      canonical: `https://trytoone.com/${locale}`,
      languages,
    },
    openGraph: {
      type: "website",
      url: `https://trytoone.com/${locale}`,
      title: t("siteTitle"),
      description: t("ogDescription"),
      siteName: "Toone",
      locale: locale === "en" ? "en_US" : locale,
      images: [
        {
          url: "https://trytoone.com/assets/og/toone-og.png",
          width: 1200,
          height: 630,
          alt: "Toone — AI teams that run your work",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@trytoone",
      creator: "@trytoone",
      title: t("siteTitle"),
      description: t("ogDescription"),
      images: [
        {
          url: "https://trytoone.com/assets/og/toone-twitter.png",
          width: 1200,
          height: 600,
          alt: "Toone — AI teams that run your work",
        },
      ],
    },
    icons: {
      icon: "/assets/profiles/toone-icon-light-512.png",
      apple: "/assets/profiles/toone-icon-light-512.png",
    },
    robots: { index: true, follow: true },
    other: {
      "apple-mobile-web-app-title": "Toone",
      "apple-mobile-web-app-capable": "yes",
      "msapplication-TileColor": "#141622",
      "msapplication-TileImage": "/assets/profiles/toone-icon-light-512.png",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        {locales.map((l) => (
          <link
            key={l}
            rel="alternate"
            hrefLang={l}
            href={`https://trytoone.com/${l}`}
          />
        ))}
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://trytoone.com/en"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  name: "Toone",
                  url: "https://trytoone.com",
                  description: "AI agents that run your work. Built on Claude Code and Codex.",
                  publisher: {
                    "@type": "Organization",
                    name: "Hexagonal.io",
                    url: "https://hexagonal.io",
                  },
                },
                {
                  "@type": "SoftwareApplication",
                  name: "Toone",
                  operatingSystem: "macOS",
                  applicationCategory: "ProductivityApplication",
                  description: "Toone makes working with AI agent teams a breeze. Templates with custom MCP tools, agents, routines and integrations — tools built for professionals. Built on Claude Code and Codex.",
                  url: "https://trytoone.com",
                  downloadUrl: "https://github.com/io-hexagonal/Toone/releases",
                  image: "https://trytoone.com/assets/og/toone-og.png",
                  featureList: "Custom MCP Tools, AI Agents, Routines, Custom Integrations, Browser Automation, Meeting Capture, Calendar, Planning",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                  },
                },
                {
                  "@type": "SiteNavigationElement",
                  name: "Media & Marketing",
                  description: "AI agent templates for content creation, social strategy, and analytics",
                  url: `https://trytoone.com/${locale}/showcase`,
                },
                {
                  "@type": "SiteNavigationElement",
                  name: "Polymarket",
                  description: "Crowd prediction intelligence — distributed agent network for market signals",
                  url: `https://trytoone.com/${locale}/polymarket`,
                },
                {
                  "@type": "SiteNavigationElement",
                  name: "AI Digest",
                  description: "Latest news and insights on AI agents, LLMs, and automation",
                  url: `https://trytoone.com/${locale}/ai-digest`,
                },
                {
                  "@type": "SiteNavigationElement",
                  name: "Showcase",
                  description: "See Toone in action — agent conversations, browser integrations, and more",
                  url: `https://trytoone.com/${locale}/showcase`,
                },
              ],
            }),
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#141622",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        }}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

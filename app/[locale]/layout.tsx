import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/routing";
import type { Metadata, Viewport } from "next";
import type { Graph } from "schema-dts";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Playfair_Display, Rubik } from "next/font/google";
import localFont from "next/font/local";
import "../globals.css";

/** Tints Safari/Chrome UI chrome to the site's dark ground. */
export const viewport: Viewport = {
  themeColor: "#141413",
};

/**
 * Toone's wordmark face — Rubik 600, always lowercase, tracking -0.03em.
 * Locked 2026-07-15; see docs/brand/toone-mark/README.md § The wordmark.
 * Rubik is SIL OFL, which permits wordmark/logo use outright.
 */
const rubik = Rubik({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-wordmark",
  display: "swap",
});

/**
 * Toone's pixel display face, matching the pixel typography used inside the
 * desktop app next to the pixel mark. Reserved for brand moments (the
 * showcases CTA lockup), never for body copy.
 */
const pixel = localFont({
  src: "../../public/assets/fonts/10Pixel-Bold.ttf",
  variable: "--font-pixel",
  display: "swap",
  preload: false,
});

/**
 * Truleaf's brand display face. Loaded only so their wordmark renders in their
 * own typeface wherever we show it (partner marquee, showcases page) — see
 * components/TruleafWordmark.tsx. next/font self-hosts it, so this adds no
 * third-party request at runtime.
 */
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function isSupportedLocale(locale: string): locale is (typeof locales)[number] {
  return locales.includes(locale as (typeof locales)[number]);
}

const siteSchema: Graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://trytoone.com/#organization",
      name: "Toone",
      url: "https://trytoone.com",
      logo: {
        "@type": "ImageObject",
        url: "https://trytoone.com/assets/profiles/toone-icon-light-512.png",
        width: "512",
        height: "512",
      },
      description: "Toone is a local-first, governed AI operating layer for companies and small teams.",
      sameAs: [
        "https://github.com/io-hexagonal/Toone",
        "https://www.producthunt.com/products/toone",
        "https://x.com/trytoone",
      ],
      parentOrganization: {
        "@type": "Organization",
        "@id": "https://hexagonal.io/#organization",
        name: "Hexagonal.io",
        url: "https://hexagonal.io",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://trytoone.com/#website",
      name: "Toone",
      url: "https://trytoone.com",
      description: "Toone turns businesses into AI-native companies. Built on Claude Code and Codex.",
      inLanguage: [...locales],
      publisher: { "@id": "https://trytoone.com/#organization" },
    },
  ],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: "meta" });

  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `https://trytoone.com/${l}`;
  }
  languages["x-default"] = "https://trytoone.com/en";

  return {
    title: {
      default: t("siteTitle"),
      template: `%s | Toone`,
    },
    description: t("siteDescription"),
    // Note: every major engine has ignored the keywords meta since 2009; kept
    // only because it costs nothing. "Media Marketing AI" was dropped — it
    // named the toone-media template, deleted 2026-07-09.
    keywords: ["AI-native", "AI-native business", "AI operating engine", "AI agents", "AI teams", "autonomous agents", "agent orchestration", "Toone", "AI productivity", "Claude Code", "Codex", "MCP tools", "AI routines", "AI integrations", "knowledge graph", "Software Engineering AI", "Science Research AI"],
    applicationName: "Toone",
    metadataBase: new URL("https://trytoone.com"),
    alternates: {
      canonical: `https://trytoone.com/${locale}`,
      languages,
    },
    // og:title is deliberately NOT siteTitle. The <title> carries the SEO tail
    // ("| Built on Claude Code ..."), which social cards give no room for: it
    // pushed the real headline onto a second line on every platform.
    openGraph: {
      type: "website",
      url: `https://trytoone.com/${locale}`,
      title: t("ogTitle"),
      description: t("ogDescription"),
      siteName: "Toone",
      locale: locale === "en" ? "en_US" : locale,
      // Dimensions must match the real files (they were declared at half size,
      // 1200x630, while the assets are 2400x1260). Scrapers use these to
      // reserve layout before the image downloads.
      images: [
        {
          url: "https://trytoone.com/assets/og/toone-og.png",
          width: 2400,
          height: 1260,
          alt: "Toone: AI teams that run your work",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@trytoone",
      creator: "@trytoone",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [
        {
          url: "https://trytoone.com/assets/og/toone-twitter.png",
          width: 2400,
          height: 1200,
          alt: "Toone: AI teams that run your work",
        },
      ],
    },
    icons: {
      // Pixel-fit favicons (16/32 from the brand kit) — a scaled 512 goes
      // mushy in Safari tabs; these are hand-fit at native sizes.
      icon: [
        { url: "/favicon.ico", sizes: "16x16 32x32" },
        { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/assets/profiles/toone-icon-light-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
      other: [
        // Safari pinned-tab: monochrome mask, tinted by `color`.
        { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#1b1b1b" },
      ],
    },
    manifest: "/site.webmanifest",
    robots: { index: true, follow: true },
    other: {
      "apple-mobile-web-app-title": "Toone",
      "apple-mobile-web-app-capable": "yes",
      "msapplication-TileColor": "#141413",
      "msapplication-TileImage": "/assets/profiles/toone-icon-light-512.png",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const clientMessages = {
    auth: messages.auth,
    contact: messages.contact,
    footer: messages.footer,
    landing: messages.landing,
    nav: messages.nav,
  };

  return (
    <html lang={locale} className={`${playfair.variable} ${pixel.variable} ${rubik.variable}`}>
      <head>
        {/* hreflang comes from the metadata API (alternates.languages),
            which subpages override with their own URLs — a hardcoded block
            here would stamp home-page alternates onto every route. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteSchema).replace(/</g, "\\u003c"),
          }}
        />
        {/* Self-hosted, cookieless Umami analytics (see /privacy). data-domains
            keeps localhost/preview traffic out of the production website. */}
        <Script
          src="https://analytics.truleaf.org/script.js"
          data-website-id="70c91dbc-6116-453f-9702-cbd942760e51"
          data-domains="trytoone.com,www.trytoone.com"
          strategy="afterInteractive"
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#141413",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        }}
      >
        <NextIntlClientProvider messages={clientMessages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

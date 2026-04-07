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
    metadataBase: new URL("https://trytoone.com"),
    alternates: {
      canonical: `https://trytoone.com/${locale}`,
      languages,
    },
    openGraph: {
      type: "website",
      url: `https://trytoone.com/${locale}`,
      title: t("siteTitle"),
      description: t("siteDescription"),
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
      title: t("siteTitle"),
      description: t("siteDescription"),
      images: ["https://trytoone.com/assets/og/toone-twitter.png"],
    },
    icons: {
      icon: "/assets/profiles/toone-icon-light-512.png",
    },
    robots: { index: true, follow: true },
    other: {
      "theme-color": "#141622",
      "apple-mobile-web-app-title": "Toone",
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

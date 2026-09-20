import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import TrustPage from "@/components/TrustPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Contact Toone",
    description: "Contact Toone about corrections, product questions, partnerships, or support.",
    alternates: {
      canonical: "https://trytoone.com/en/contact",
      languages: {
        en: "https://trytoone.com/en/contact",
        "x-default": "https://trytoone.com/en/contact",
      },
    },
    robots: locale === "en" ? { index: true, follow: true } : { index: false, follow: true },
    // R7: og:url must equal the canonical. Without a route-level `openGraph`
    // this page inherited the root layout's card, whose og:url is the locale
    // home, so the shared URL and the canonical disagreed.
    openGraph: {
      type: "website",
      url: "https://trytoone.com/en/contact",
      title: "Contact Toone",
      description: "Product questions, partnership enquiries, support requests, and factual corrections.",
      siteName: "Toone",
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== "en") permanentRedirect("/en/contact");
  setRequestLocale(locale);

  return (
    <TrustPage
      eyebrow="Contact"
      title="Contact Toone"
      lede="Send product questions, partnership enquiries, support requests, and factual corrections to the Toone team."
      updated="August 30, 2026"
    >
      <section>
        <h2>LinkedIn</h2>
        <p>
          Reach out to{" "}
          <a href="https://www.linkedin.com/in/matheusbparanhos/">
            Matheus Paranhos on LinkedIn
          </a>
          . Include the page URL and supporting evidence when reporting a correction.
        </p>
      </section>

      <section>
        <h2>Product support</h2>
        <p>
          Questions about the desktop app and existing-user access can be sent to{" "}
          <a href="mailto:hello@trytoone.com">hello@trytoone.com</a>.
        </p>
      </section>

      <section>
        <h2>Response and privacy</h2>
        <p>
          Do not send passwords, API keys, private customer records, or other sensitive data. Toone
          reviews messages according to their subject and cannot promise a fixed response time.
        </p>
      </section>
    </TrustPage>
  );
}

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
      updated="August 14, 2026"
    >
      <section>
        <h2>Email</h2>
        <p>
          Write to <a href="mailto:hello@trytoone.com">hello@trytoone.com</a>. Include the page URL
          and supporting evidence when reporting a correction.
        </p>
      </section>

      <section>
        <h2>Public software issues</h2>
        <p>
          Reproducible defects in the open-source desktop app can also be filed through{" "}
          <a href="https://github.com/io-hexagonal/Toone/issues">GitHub Issues</a>.
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

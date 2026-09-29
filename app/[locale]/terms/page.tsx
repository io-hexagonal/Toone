import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import TrustPage from "@/components/TrustPage";
import {
  APPLE_STANDARD_EULA_URL,
  TERMS_CANONICAL,
  TERMS_UPDATED_DATE,
} from "@/lib/legal/terms";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    // Root template appends "| Toone"; the brand stays out of this title (F33).
    title: "Terms and Licenses",
    description: "Where to find the license terms for Toone from the Mac App Store and Toone downloaded directly.",
    alternates: {
      canonical: TERMS_CANONICAL,
      languages: { en: TERMS_CANONICAL, "x-default": TERMS_CANONICAL },
    },
    robots: { index: locale === "en", follow: true },
    openGraph: {
      type: "website",
      url: TERMS_CANONICAL,
      title: "Toone Terms and Licenses",
      description: "License information for the Mac App Store and direct editions of Toone.",
      siteName: "Toone",
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== "en") permanentRedirect("/en/terms");
  setRequestLocale(locale);

  return (
    <TrustPage
      eyebrow="Legal"
      title="Toone Terms and Licenses"
      lede="The license for Toone depends on where you obtained the app."
      updated={TERMS_UPDATED_DATE}
      updatedLabel="Updated"
    >
      <section>
        <h2>Mac App Store edition</h2>
        <p>
          The Mac App Store edition of Toone uses Apple&apos;s{" "}
          <a href={APPLE_STANDARD_EULA_URL}>standard Licensed Application End User License Agreement</a>.
          Toone has not provided a custom App Store license agreement. Apple presents the applicable
          license when you obtain the app through the Mac App Store.
        </p>
      </section>

      <section>
        <h2>Other distributions</h2>
        <p>
          The Apple standard EULA above describes the Mac App Store edition. For a Toone copy
          obtained elsewhere, use the license terms supplied with that distribution or contact
          Toone if you need a copy.
        </p>
      </section>

      <section>
        <h2>Connected services and privacy</h2>
        <p>
          If you connect an AI provider, your use of that provider is also subject to its own
          terms. For information about Toone accounts, website data, the cloud relay, and AI
          requests, read the <a href="/en/privacy">Privacy Policy</a>.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these licenses can be sent to{" "}
          <a href="mailto:hello@trytoone.com">hello@trytoone.com</a>.
        </p>
      </section>
    </TrustPage>
  );
}

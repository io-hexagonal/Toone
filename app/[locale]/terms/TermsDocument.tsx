import type { Metadata } from "next";
import { localeRobots, localeVersions } from "@/i18n/indexing";
import TrustPage from "@/components/TrustPage";
import { TERMS_CANONICAL, TERMS_PATH } from "@/lib/legal/terms";
import { formatTermsDate, type TermsVersionView } from "@/lib/legal/terms-versions";
import type { TooneProSeller } from "@/lib/legal/seller";
import { termsContentFor } from "./versions";

/**
 * Metadata of the Terms. Every variant points its canonical at `/en/terms`;
 * a `?version=` view is never indexed.
 */
export function termsMetadata(locale: string, versioned = false): Metadata {
  return {
    // Root template appends "| Toone"; the brand stays out of this title (F33).
    title: "Terms and Licenses",
    description:
      "License terms for Toone from the Mac App Store and Toone downloaded directly, and the terms for buying Toone Pro, the free plan, and redeemable codes.",
    alternates: { canonical: TERMS_CANONICAL },
    robots: localeRobots(locale, !versioned),
    other: localeVersions("/terms", ["en"]),
    openGraph: {
      type: "website",
      url: TERMS_CANONICAL,
      title: "Toone Terms and Licenses",
      description:
        "License information for the Mac App Store and direct editions of Toone, and the terms for Toone Pro.",
      siteName: "Toone",
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}

/** Which version this is, when one was asked for. */
export function TermsVersionNote({ view }: { view: TermsVersionView }) {
  if (view.kind === "current") return null;
  if (view.kind === "unknown") {
    return (
      <aside className="trust-note" role="note">
        <p>
          There is no version of these Terms for the date in this link, so this is the current
          version, in force since {view.version.label}.
        </p>
      </aside>
    );
  }
  const onDay = formatTermsDate(view.requested);
  if (view.isCurrent) {
    return (
      <aside className="trust-note" role="note">
        <p>
          This is the version of these Terms that was in force on {onDay}. It is still the current
          version.
        </p>
      </aside>
    );
  }
  return (
    <aside className="trust-note" role="note">
      <p>
        This is the version of these Terms that was in force on {onDay}. It took effect on{" "}
        {view.version.label} and has since been replaced: see the{" "}
        <a href={`/en${TERMS_PATH}`}>current Terms</a>.
      </p>
    </aside>
  );
}

/** The Terms page: one version of the text, with a note when a version was asked for. */
export default function TermsDocument({ view, seller }: { view: TermsVersionView; seller: TooneProSeller | null }) {
  const Content = termsContentFor(view.version);
  return (
    <TrustPage
      eyebrow="Legal"
      title="Toone Terms and Licenses"
      lede="The license for Toone depends on where you obtained the app. Toone Pro, the optional upgrade, has its own purchase terms below."
      updated={view.version.label}
      updatedLabel="Updated"
    >
      <TermsVersionNote view={view} />
      <Content seller={seller} />
    </TrustPage>
  );
}

import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import TrustPage from "@/components/TrustPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Editorial, Sources, and Corrections Policy",
    description:
      "How Toone reviews product claims, cites sources, discloses automated assistance, and handles corrections.",
    alternates: {
      canonical: "https://trytoone.com/en/editorial-policy",
      languages: {
        en: "https://trytoone.com/en/editorial-policy",
        "x-default": "https://trytoone.com/en/editorial-policy",
      },
    },
    robots: locale === "en" ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function EditorialPolicyPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== "en") permanentRedirect("/en/editorial-policy");
  setRequestLocale(locale);

  return (
    <TrustPage
        eyebrow="Standards"
        title="Editorial, sources, and corrections"
        lede="This policy defines who is accountable for Toone content, which evidence supports a claim, and how errors are corrected."
        updated="August 10, 2026"
      >
        <section>
          <h2>Accountability</h2>
          <p>
            Toone publishes content to help readers understand the product, evaluate fit, and use
            governed AI agents responsibly. Utility pages may name Toone as the organizational
            author. Guides, comparisons, research, and first-hand demonstrations name the accountable
            organizational author and their evidence boundary.
          </p>
          <p>
            Product, architecture, privacy, and release claims are checked against the current
            application, repository, release, or reproducible evidence before publication.
          </p>
        </section>

        <section>
          <h2>Sources and citations</h2>
          <ul>
            <li>Product behavior is checked against the current application, repository, or release.</li>
            <li>Technical and policy claims prefer current primary documentation.</li>
            <li>Deployment claims state the organization, date, and evidence boundary.</li>
            <li>Numbers include their source and method; unsupported numbers are removed.</li>
            <li>Quotes and third-party media retain attribution and do not exceed fair-use needs.</li>
          </ul>
        </section>

        <section>
          <h2>Comparisons and hands-on claims</h2>
          <p>
            Comparisons state the evaluation date, source URLs, version or plan limits, and whether
            the products were tested directly. Toone does not invent competitor weaknesses or imply
            hands-on testing that did not happen.
          </p>
        </section>

        <section>
          <h2>Automated assistance</h2>
          <p>
            Automated tools may help collect, organize, or draft information. Toone Content remains
            accountable for the published result. The method is disclosed when automation materially
            affects how evidence was gathered, tested, or synthesized.
          </p>
        </section>

        <section>
          <h2>Corrections</h2>
          <p>
            Factual errors are corrected as soon as they are verified. Material corrections update
            the page&apos;s reviewed date and identify what changed when the prior wording could have
            affected a reader&apos;s decision. Minor spelling and formatting fixes may be made without a
            separate notice.
          </p>
          <p>
            Send correction requests, the affected URL, and supporting evidence to{` `}
            <a href="mailto:hello@trytoone.com">hello@trytoone.com</a>. Public software defects can
            also be reported through <a href="https://github.com/io-hexagonal/Toone/issues">GitHub Issues</a>.
          </p>
        </section>
    </TrustPage>
  );
}

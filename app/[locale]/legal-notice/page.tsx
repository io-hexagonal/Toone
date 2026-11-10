import type { Metadata } from "next";
import { localeRobots, localeVersions } from "@/i18n/indexing";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { setRequestLocale } from "next-intl/server";
import TrustPage from "@/components/TrustPage";
import { LEGAL_TRADER, type TraderField, type TraderKey } from "@/lib/legal/trader";
import { LINK_SUPPORT_URL, LINK_TERMS_URL } from "@/lib/legal/terms";

type Props = { params: Promise<{ locale: string }>; searchParams: PageSearchParams };

const CANONICAL = "https://trytoone.com/en/legal-notice";
const UPDATED = "November 10, 2026";

const TRADER_ROWS: TraderKey[] = [
  "fullName",
  "tradingName",
  "address",
  "email",
  "phone",
  "taxId",
  "activityCode",
];
const COMPLAINT_ROWS: TraderKey[] = ["complaintsBook", "adrEntity"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Legal Notice",
    description:
      "Who publishes Toone and sells Toone Pro: the trader's name, address, contact details and tax number, and where to complain.",
    alternates: { canonical: CANONICAL },
    robots: localeRobots(locale),
    other: localeVersions("/legal-notice", ["en"]),
    openGraph: {
      type: "website",
      url: CANONICAL,
      title: "Toone Legal Notice",
      description: "Trader information for Toone and Toone Pro.",
      siteName: "Toone",
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}

function FieldList({ keys }: { keys: TraderKey[] }) {
  return (
    <dl>
      {keys.map((key) => {
        const field: TraderField = LEGAL_TRADER[key];
        return (
          <div key={key} data-trader-field={key}>
            <dt>{field.label}</dt>
            <dd>{field.href ? <a href={field.href}>{field.value}</a> : field.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export default async function LegalNoticePage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") await redirectToEnglish("/en/legal-notice", searchParams);
  setRequestLocale(locale);

  return (
    <TrustPage
      eyebrow="Legal"
      title="Legal Notice"
      lede="Toone is published, and Toone Pro is provided, by an individual trader in Portugal. These are the trader's details."
      updated={UPDATED}
      updatedLabel="Updated"
    >
      <section id="trader">
        <h2>Trader</h2>
        <FieldList keys={TRADER_ROWS} />
      </section>

      <section id="web-sales">
        <h2>Toone Pro sold on trytoone.com</h2>
        <p>
          Web purchases of Toone Pro are sold through Stripe&apos;s Managed Payments service. The
          seller of the transaction and merchant of record is Sold through Link, LLC, a Stripe
          company, under its <a href={LINK_TERMS_URL}>Sold through Link terms</a>. It collects VAT
          and issues receipts and invoices. Payment support is at{" "}
          <a href={LINK_SUPPORT_URL}>Link support</a>. The trader above provides Toone Pro and its
          product support. The purchase terms are in the{" "}
          <a href="/en/terms#toone-pro">Terms</a>.
        </p>
      </section>

      <section id="complaints">
        <h2>Complaints and dispute resolution</h2>
        <p>
          Please contact us first by email. You can also file a complaint in the Livro de
          Reclamações Eletrónico. If you are a consumer, you can take a dispute to the alternative
          dispute resolution entity below.
        </p>
        <FieldList keys={COMPLAINT_ROWS} />
      </section>

      <section>
        <h2>Privacy</h2>
        <p>
          How the trader handles personal data, and how to contact the data protection authority,
          is described in the <a href="/en/privacy#controller">Privacy Policy</a>.
        </p>
      </section>
    </TrustPage>
  );
}

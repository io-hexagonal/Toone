import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localeRobots, localeVersions } from "@/i18n/indexing";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { setRequestLocale } from "next-intl/server";
import TrustPage from "@/components/TrustPage";
import { LEGAL_TRADER, TRADER_DETAILS_COMPLETE, type TraderField, type TraderKey } from "@/lib/legal/trader";
import { loadSeller } from "@/lib/legal/current-seller";
import WebSales from "./WebSales";

/** The seller model comes from the API (cached like the pricing page), so a switch needs no redeploy. */
export const revalidate = 300;

type Props = { params: Promise<{ locale: string }>; searchParams: PageSearchParams };

const CANONICAL = "https://trytoone.com/en/legal-notice";
const UPDATED = "November 13, 2026";

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
  // Never published with owner placeholders: a 404 until lib/legal/trader.ts is filled in.
  if (!TRADER_DETAILS_COMPLETE) notFound();
  const { locale } = await params;
  if (locale !== "en") await redirectToEnglish("/en/legal-notice", searchParams);
  setRequestLocale(locale);
  const seller = await loadSeller();

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
        <WebSales seller={seller} />
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

import { getTranslations } from "next-intl/server";
import TruleafWordmark from "@/components/TruleafWordmark";
import { Link } from "@/lib/navigation";

/**
 * Partner band — the two real partners, static.
 *
 * Deliberately not a marquee: with exactly two partners, a loop repeats them
 * across the viewport and reads as padding. Two logos, centred, is the honest
 * shape — and it stays honest as the list grows.
 */
export default async function PartnerBand() {
  const t = await getTranslations("landing");

  return (
    <div className="pb-wrap">
      <p className="pb-label">{t("partnersBandLabel")}</p>

      <div className="pb-row">
        <a
          className="pb-item"
          href="https://truleaf.org"
          target="_blank"
          rel="noopener"
          aria-label="Truleaf.org"
          data-umami-event="partner-click"
          data-umami-event-partner="truleaf"
        >
          {/* Transparent variant: the band inks marks via brightness(0), so
              the solid rounded-square icon would render as a black box */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/partners/truleaf-icon-transparent.svg"
            alt=""
            width={32}
            height={32}
            style={{ display: "block" }}
          />
          <TruleafWordmark size={22} />
        </a>

        <span className="pb-sep" aria-hidden="true" />

        {/* micoo has no public URL on file yet — renders unlinked until it does */}
        <span className="pb-item">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/partners/micoo-wordmark.svg"
            alt="micoo"
            style={{ height: 23, width: "auto", display: "block" }}
          />
        </span>
      </div>

      <div className="pb-foot">
        <Link href="/showcases" className="pb-cta">
          {t("partnersBandCta")}
        </Link>
      </div>
    </div>
  );
}

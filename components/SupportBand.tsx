import { getTranslations } from "next-intl/server";
import { CLAUDE_PATH } from "@/components/TechStrip";

/**
 * "Supported by" band — programmes Toone belongs to. Deliberately not
 * customer language ("trusted by"): Anthropic supports Toone, it doesn't use it.
 *
 * Anthropic publishes no member badge for the startups programme (checked
 * claude.com/programs/startups on 2026-10-12), so the lockup is the Claude
 * mark already vendored for TechStrip plus the programme name, set in the
 * Anthropic Serif stand-in loaded as --font-claude-serif (see the locale
 * layout). Swap in an official asset if one is ever provided.
 */
export default async function SupportBand() {
  const t = await getTranslations("landing");

  return (
    <div className="sb-wrap">
      <p className="sb-label">{t("supportBandLabel")}</p>

      <a
        className="sb-item"
        href="https://claude.com/programs/startups"
        target="_blank"
        rel="noopener"
        data-umami-event="support-click"
        data-umami-event-program="claude-startups"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          fillRule="evenodd"
          aria-hidden="true"
          focusable="false"
          className="sb-mark"
        >
          <path d={CLAUDE_PATH} />
        </svg>
        <span>Claude Startups</span>
      </a>
    </div>
  );
}

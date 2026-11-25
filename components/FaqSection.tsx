import { getTranslations } from "next-intl/server";
import { TOONE_PRO_FREE_ROUTINE_CREATIONS } from "@/lib/legal/terms";

/**
 * Landing FAQ — native <details> accordion. Questions are the objections
 * people raise first (is it n8n with AI, what a run costs, do I need to
 * code), so assistants and search engines quote our answers instead of
 * guessing. Also emitted as FAQPage structured data with the same text.
 * Server-rendered; no client JS beyond the browser's own disclosure widget.
 */
export default async function FaqSection() {
  const t = await getTranslations("faq");
  const items = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;
  const answer = (i: (typeof items)[number]) => t(`a${i}`, { free: TOONE_PRO_FREE_ROUTINE_CREATIONS });
  const structured = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: t(`q${i}`),
      acceptedAnswer: { "@type": "Answer", text: answer(i) },
    })),
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* Two columns: the heading holds still on the left while the
               questions scroll on the right. */
            .faq {
              display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 7fr);
              gap: 64px; align-items: start;
            }
            .faq-head { position: sticky; top: 120px; }
            .faq-head .sub { margin-bottom: 0; }
            .faq-list { max-width: 760px; }
            .faq-list details {
              border-top: 1px solid rgba(29,28,25,0.12);
              padding: 2px 0;
            }
            @media (max-width: 900px) {
              .faq { grid-template-columns: 1fr; gap: 32px; }
              .faq-head { position: static; }
            }
            .faq-list details:last-of-type { border-bottom: 1px solid rgba(29,28,25,0.12); }
            .faq-list summary {
              cursor: pointer; list-style: none;
              display: flex; justify-content: space-between; align-items: center; gap: 18px;
              padding: 20px 2px;
              color: #1d1c19; font-size: 17px; font-weight: 500;
              letter-spacing: -0.005em;
            }
            .faq-list summary::-webkit-details-marker { display: none; }
            .faq-list summary::after {
              content: '+'; color: rgba(29,28,25,0.45); font-size: 20px; font-weight: 400;
              transition: transform 0.2s ease; flex-shrink: 0;
            }
            .faq-list details[open] summary::after { transform: rotate(45deg); }
            .faq-list summary:focus-visible { outline: 2px solid #1d1c19; outline-offset: 2px; border-radius: 4px; }
            .faq-list details p {
              color: rgba(29,28,25,0.66); font-size: 16px; line-height: 1.65;
              padding: 0 2px 22px; max-width: 64ch;
            }
          `,
        }}
      />
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }}
      />
      <section className="section faq" id="faq">
        <div className="faq-head">
          <h2>{t("title")}</h2>
          <p className="sub">
            {t.rich("sub", { link: (chunks) => <a className="text-link" href="/en/how-to">{chunks}</a> })}
          </p>
        </div>
        <div className="faq-list">
          {items.map((i) => (
            <details key={i}>
              <summary>{t(`q${i}`)}</summary>
              <p>{answer(i)}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

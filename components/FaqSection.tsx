import { getTranslations } from "next-intl/server";

/**
 * Landing FAQ — native <details> accordion, styled to sit with the pillars.
 * Server-rendered; no client JS beyond the browser's own disclosure widget.
 */
export default async function FaqSection() {
  const t = await getTranslations("faq");
  const items = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .faq-list details {
              border-top: 1px solid rgba(29,28,25,0.12);
              padding: 2px 0;
            }
            .faq-list details:last-of-type { border-bottom: 1px solid rgba(29,28,25,0.12); }
            .faq-list summary {
              cursor: pointer; list-style: none;
              display: flex; justify-content: space-between; align-items: center; gap: 18px;
              padding: 17px 2px;
              color: rgba(29,28,25,0.92); font-size: 15.5px; font-weight: 600;
              letter-spacing: -0.005em;
            }
            .faq-list summary::-webkit-details-marker { display: none; }
            .faq-list summary::after {
              content: '+'; color: rgba(29,28,25,0.45); font-size: 20px; font-weight: 400;
              transition: transform 0.2s ease; flex-shrink: 0;
            }
            .faq-list details[open] summary::after { transform: rotate(45deg); }
            .faq-list details p {
              color: rgba(29,28,25,0.6); font-size: 14px; line-height: 1.65;
              padding: 0 2px 18px; max-width: 68ch;
            }
          `,
        }}
      />
      <section className="section" id="faq">
        <h2>{t("title")}</h2>
        <p className="sub">{t("sub")}</p>
        <div className="faq-list">
          {items.map((i) => (
            <details key={i}>
              <summary>{t(`q${i}`)}</summary>
              <p>{t(`a${i}`)}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

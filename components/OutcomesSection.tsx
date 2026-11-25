import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

/**
 * "What you get": four outcomes, not features. Each names what changes for
 * the person and why, in one sentence, so the page sells results the way the
 * graph above shows them. 2 × 2 on desktop, one column on phones.
 */
const OUTCOMES: readonly { key: "cost" | "same" | "wire" | "control"; icon: ReactNode }[] = [
  {
    key: "cost",
    icon: <path d="M5.6 4.6 2.2 8l3.4 3.4M10.4 4.6 13.8 8l-3.4 3.4M9 3.2 7 12.8" />,
  },
  {
    key: "same",
    icon: (
      <>
        <path d="M8 2.2 3.4 3.9v3.5c0 3 2 5.1 4.6 6.2 2.6-1.1 4.6-3.2 4.6-6.2V3.9L8 2.2Z" />
        <path d="m6 7.9 1.4 1.4 2.7-2.9" />
      </>
    ),
  },
  {
    key: "wire",
    icon: (
      <>
        <path d="M2.8 4.2h10.4M2.8 8h7M2.8 11.8h4.6" />
        <path d="M11.6 10.2c.3 1.3.9 1.9 2.2 2.2-1.3.3-1.9.9-2.2 2.2-.3-1.3-.9-1.9-2.2-2.2 1.3-.3 1.9-.9 2.2-2.2Z" />
      </>
    ),
  },
  {
    key: "control",
    icon: (
      <>
        <circle cx="8" cy="8" r="5.75" />
        <path d="M6.6 5.9v4.2M9.4 5.9v4.2" />
      </>
    ),
  },
];

export default async function OutcomesSection() {
  const t = await getTranslations("landing.outcomes");

  return (
    <section className="section oc" aria-labelledby="oc-title">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .oc-grid {
              display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
              border-top: 1px solid rgba(29,28,25,0.12); list-style: none; margin: 0; padding: 0;
            }
            .oc-item { padding: 30px 32px 34px 0; border-bottom: 1px solid rgba(29,28,25,0.12); }
            .oc-item:nth-child(even) { padding: 30px 0 34px 32px; border-left: 1px solid rgba(29,28,25,0.12); }
            .oc-icon { display: block; width: 18px; height: 18px; margin-bottom: 18px; color: rgba(29,28,25,0.6); }
            .oc-icon svg { width: 18px; height: 18px; display: block; }
            .oc-item h3 { color: #1d1c19; font-size: 19px; font-weight: 600; letter-spacing: -0.014em; margin-bottom: 8px; }
            .oc-item p { color: rgba(29,28,25,0.66); font-size: 16px; line-height: 1.6; max-width: 52ch; text-wrap: pretty; }
            @media (max-width: 720px) {
              .oc-grid { grid-template-columns: 1fr; }
              .oc-item, .oc-item:nth-child(even) { padding: 22px 0 24px; border-left: 0; }
            }
          `,
        }}
      />
      <h2 id="oc-title">{t("title")}</h2>
      <p className="sub">{t("sub")}</p>
      <ul className="oc-grid">
        {OUTCOMES.map((o) => (
          <li className="oc-item" key={o.key}>
            <span className="oc-icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {o.icon}
              </svg>
            </span>
            <h3>{t(`items.${o.key}.title`)}</h3>
            <p>{t(`items.${o.key}.body`)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

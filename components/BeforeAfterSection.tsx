import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";
import AfterRoutineRun from "@/components/AfterRoutineRun";
import { Icon, type IconName } from "@/components/HowItWorksGraph";

/**
 * "Why Toone": a prompt on a timer against a routine. Left, the category
 * Toone is compared with (a scheduled prompt in a chat assistant, no brands):
 * one prompt and three runs that drift, repeating leads, losing sources and
 * falling short with nothing to say so. Right, the same work as a Toone
 * routine: the hero's chain with its contract and fallback, and the ledger
 * that carries over between runs. Then a light comparison, row by row.
 */

/** Lead rows in each past run, by bar width; a repeat reuses an earlier width. */
const RUNS: readonly { leads: number; noSources?: boolean; rows: readonly (readonly [number, boolean])[] }[] = [
  { leads: 20, rows: [[64, false], [48, false], [72, false]] },
  { leads: 20, noSources: true, rows: [[64, true], [72, true], [56, false]] },
  { leads: 8, rows: [[48, true], [40, false]] },
];

const COMPARE: readonly (readonly [string, IconName])[] = [
  ["structure", "graph"],
  ["memory", "ledger"],
  ["control", "pause"],
  ["checks", "shield"],
  ["failures", "retry"],
  ["models", "spark"],
];

const CSS = `
.ba-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 16px; }
.ba-panel {
  position: relative; display: flex; flex-direction: column;
  padding: 26px 28px 30px;
  border: 1px solid rgba(29,28,25,0.1); border-radius: 18px;
}
.ba-panel--prompt { background: rgba(29,28,25,0.03); }
.ba-panel--routine {
  background:
    radial-gradient(rgba(29,28,25,0.065) 1px, transparent 1.2px) 0 0 / 18px 18px,
    #f6f4ef;
}
.ba-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 22px; }
.ba-label {
  display: block; font-family: var(--font-wordmark), system-ui, sans-serif;
  font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: #1d1c19;
}
.ba-panel--prompt .ba-label { color: rgba(29,28,25,0.6); }
.ba-note { display: block; margin-top: 4px; color: rgba(29,28,25,0.52); font-size: 13.5px; line-height: 1.5; }
.ba-when {
  display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0; height: 26px; padding: 0 11px 0 9px;
  border-radius: 999px; background: #fff; box-shadow: inset 0 0 0 1px rgba(29,28,25,0.14);
  color: rgba(29,28,25,0.78); font-size: 11.5px; font-weight: 600; white-space: nowrap;
}
.ba-when svg, .ba-card-head svg { width: 12px; height: 12px; flex-shrink: 0; color: rgba(29,28,25,0.55); }

/* --- left: the prompt, then three runs that drift --- */
.ba-card {
  padding: 13px 15px 14px; border-radius: 14px; background: #fff;
  box-shadow: inset 0 0 0 1px rgba(29,28,25,0.1), 0 1px 2px rgba(29,28,25,0.04), 0 6px 18px rgba(29,28,25,0.05);
}
.ba-card-head {
  display: flex; align-items: center; gap: 7px; margin-bottom: 6px;
  color: rgba(29,28,25,0.5); font-size: 11px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
}
.ba-prompt { color: rgba(29,28,25,0.84); font-size: 14px; line-height: 1.5; text-wrap: pretty; }
.ba-runs { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
.ba-run-card {
  padding: 10px 13px 12px; border-radius: 12px; background: rgba(255,255,255,0.55);
  box-shadow: inset 0 0 0 1px rgba(29,28,25,0.08);
  transform: translateX(var(--x)) rotate(var(--r)); opacity: var(--o);
  animation: ba-drift 9s ease-in-out var(--delay) infinite alternate;
}
@keyframes ba-drift {
  to { transform: translate(calc(var(--x) + var(--dx)), 2px) rotate(calc(var(--r) * 1.6)); }
}
.ba-run-head {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
  color: rgba(29,28,25,0.55); font-size: 12px; font-weight: 600;
}
.ba-run-meta { margin-left: auto; color: rgba(29,28,25,0.45); font-weight: 500; font-variant-numeric: tabular-nums; }
.ba-tag {
  display: inline-flex; align-items: center; height: 17px; padding: 0 7px; border-radius: 999px;
  color: rgba(29,28,25,0.5); font-size: 10.5px; font-weight: 550; white-space: nowrap;
  box-shadow: inset 0 0 0 1px rgba(29,28,25,0.13);
}
.ba-tag--dashed { box-shadow: none; outline: 1px dashed rgba(29,28,25,0.24); outline-offset: -1px; }
.ba-leads { display: flex; flex-direction: column; gap: 6px; list-style: none; }
.ba-lead { display: flex; align-items: center; gap: 8px; height: 17px; }
.ba-lead b { width: 12px; height: 12px; border-radius: 50%; background: rgba(29,28,25,0.1); flex-shrink: 0; }
.ba-lead i { display: block; height: 5px; border-radius: 3px; background: rgba(29,28,25,0.11); }
.ba-lead .ba-tag { margin-left: auto; }

/* --- right: the routine and its ledger --- */
.ba-run { flex: 1; display: flex; flex-direction: column; }
.ba-chain { flex: 1; display: grid; place-items: center; padding: 6px 0 24px; }
.ba-ledger {
  display: flex; flex-direction: column; gap: 5px;
  padding: 11px 15px 12px; border-radius: 12px; background: #fff;
  box-shadow: inset 0 0 0 1px rgba(29,28,25,0.1), 0 1px 2px rgba(29,28,25,0.04);
  transition: box-shadow .4s ease;
}
.ba-ledger[data-s="writing"] { box-shadow: inset 0 0 0 1px rgba(29,28,25,0.34), 0 1px 2px rgba(29,28,25,0.04); }
.ba-ledger-name {
  display: flex; align-items: center; gap: 7px;
  color: rgba(29,28,25,0.5); font-size: 11px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
}
.ba-ledger-name svg { width: 12px; height: 12px; flex-shrink: 0; color: rgba(29,28,25,0.55); }
.ba-ledger-items {
  display: flex; flex-wrap: wrap; gap: 0 5px;
  color: rgba(29,28,25,0.84); font-size: 13px; line-height: 1.5; font-variant-numeric: tabular-nums;
}
.ba-ledger-items span { white-space: nowrap; }
.ba-ledger-items span + span::before { content: '·'; margin-right: 5px; color: rgba(29,28,25,0.3); }

/* --- the comparison: thin rules, no boxes --- */
.ba-compare { width: 100%; margin-top: clamp(40px, 4.5vw, 56px); border-collapse: collapse; font-size: 14px; line-height: 1.5; }
.ba-compare th, .ba-compare td { text-align: left; vertical-align: top; padding: 14px 0; font-weight: inherit; }
.ba-compare tr > * + * { padding-left: 28px; }
.ba-compare tbody tr { border-top: 1px solid rgba(29,28,25,0.1); }
.ba-compare tbody tr:last-child { border-bottom: 1px solid rgba(29,28,25,0.1); }
.ba-compare thead th {
  padding-top: 0; padding-bottom: 12px; color: rgba(29,28,25,0.42); font-size: 11px; font-weight: 600;
  letter-spacing: 0.16em; text-transform: uppercase;
}
.ba-compare thead th:last-child { color: rgba(29,28,25,0.72); }
.ba-compare col.ba-col-k { width: 24%; }
.ba-compare col.ba-col-p { width: 32%; }
.ba-compare col.ba-col-t { width: 44%; }
.ba-k { display: flex; align-items: flex-start; gap: 9px; color: rgba(29,28,25,0.86); font-weight: 550; }
.ba-k svg { width: 15px; height: 15px; flex-shrink: 0; margin-top: 2.5px; color: rgba(29,28,25,0.55); }
.ba-compare td.ba-p { color: rgba(29,28,25,0.5); }
.ba-compare td.ba-t { color: rgba(29,28,25,0.86); }
.ba-foot { margin-top: 18px; color: rgba(29,28,25,0.52); font-size: 13.5px; line-height: 1.55; }

@media (max-width: 960px) {
  .ba-grid { grid-template-columns: 1fr; gap: 16px; }
}
@media (max-width: 640px) {
  .ba-panel { padding: 18px 16px 22px; border-radius: 16px; }
  .ba-head { margin-bottom: 18px; }
  .ba-label { font-size: 16px; }
  .ba-note { font-size: 13px; }
  .ba-when { height: 24px; font-size: 11px; }
  .ba-prompt { font-size: 13.5px; }
  .ba-chain { padding-bottom: 20px; }
  .ba-ledger { padding: 10px 13px 11px; }
  .ba-ledger-items { flex-direction: column; font-size: 12.5px; }
  .ba-ledger-items span + span::before { content: none; }
  .ba-run-card { --x: 0px !important; }
  /* stacked pairs: the row, then each side with its own small label */
  .ba-compare thead { display: none; }
  .ba-compare, .ba-compare tbody, .ba-compare tr, .ba-compare th, .ba-compare td { display: block; }
  .ba-compare tbody tr { padding: 16px 0 18px; }
  .ba-compare th, .ba-compare td { padding: 0; }
  .ba-compare tr > * + * { padding-left: 24px; margin-top: 8px; }
  .ba-compare td::before {
    content: attr(data-side); display: block; margin-bottom: 1px;
    color: rgba(29,28,25,0.42); font-size: 10px; font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase;
  }
  .ba-compare th { margin-bottom: 2px; }
}
@media (prefers-reduced-motion: reduce) {
  .ba-run-card { animation: none; }
  .ba-ledger { transition: none; }
}
`;

export default async function BeforeAfterSection() {
  const t = await getTranslations("landing.whyToone");
  const g = await getTranslations("landing.routineGraph");
  const h = await getTranslations("landing.howItWorks.graph");

  return (
    <section className="section ba" id="why-toone">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <p className="eyebrow">{t("eyebrow")}</p>
      <h2>{t("title")}</h2>
      <p className="sub">{t("sub")}</p>

      <div className="ba-grid">
        <figure className="ba-panel ba-panel--prompt">
          <figcaption className="ba-head">
            <span>
              <span className="ba-label">{t("prompt.label")}</span>
              <span className="ba-note">{t("prompt.note")}</span>
            </span>
          </figcaption>
          <div className="ba-card" aria-hidden="true">
            <p className="ba-card-head">
              <Icon name="clock" />
              {t("prompt.when")}
            </p>
            <p className="ba-prompt">{t("prompt.text")}</p>
          </div>
          <div className="ba-runs" aria-hidden="true">
            {RUNS.map((run, i) => (
              <div
                className="ba-run-card"
                key={i}
                style={
                  {
                    "--x": `${[0, 10, 3][i]}px`,
                    "--r": `${[-0.4, 0.7, -1.1][i]}deg`,
                    "--o": [0.95, 0.85, 0.74][i],
                    "--dx": `${[4, -5, 6][i]}px`,
                    "--delay": `${-i * 2.6}s`,
                  } as CSSProperties
                }
              >
                <p className="ba-run-head">
                  {t("prompt.run", { n: i + 1 })}
                  {run.noSources && <span className="ba-tag ba-tag--dashed">{t("prompt.noSources")}</span>}
                  <span className="ba-run-meta">{t("prompt.leads", { n: run.leads })}</span>
                </p>
                <ul className="ba-leads">
                  {run.rows.map(([width, repeat], j) => (
                    <li className="ba-lead" key={j}>
                      <b />
                      <i style={{ width: `${width}%` }} />
                      {repeat && <span className="ba-tag">{t("prompt.duplicate")}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </figure>

        <figure className="ba-panel ba-panel--routine">
          <figcaption className="ba-head">
            <span>
              <span className="ba-label">{t("routine.label")}</span>
              <span className="ba-note">{t("routine.note")}</span>
            </span>
            <span className="ba-when" aria-hidden="true">
              <Icon name="clock" />
              {h("schedule")}
            </span>
          </figcaption>
          <AfterRoutineRun
            steps={[
              { title: g("research"), tiles: ["claude", "openai"] },
              { title: g("findLeads"), tiles: ["linkedin"] },
              { title: g("designFiles"), tiles: ["figma", "higgsfield"] },
              { title: g("publishSocial"), tiles: ["threads", "facebook", "instagram"] },
            ]}
            labels={{
              running: g("running"),
              paused: g("paused"),
              min: h("min"),
              fallback: h("fallback"),
              ledger: t("routine.ledger"),
              known: t("routine.known"),
              fresh: t("routine.fresh"),
              duplicates: t("routine.duplicates"),
            }}
          />
        </figure>
      </div>

      <table className="ba-compare">
        <colgroup>
          <col className="ba-col-k" />
          <col className="ba-col-p" />
          <col className="ba-col-t" />
        </colgroup>
        <thead>
          <tr>
            <td />
            <th scope="col">{t("compare.prompt")}</th>
            <th scope="col">{t("compare.toone")}</th>
          </tr>
        </thead>
        <tbody>
          {COMPARE.map(([row, icon]) => (
            <tr key={row}>
              <th scope="row">
                <span className="ba-k">
                  <Icon name={icon} />
                  {t(`compare.rows.${row}.label`)}
                </span>
              </th>
              <td className="ba-p" data-side={t("compare.prompt")}>{t(`compare.rows.${row}.prompt`)}</td>
              <td className="ba-t" data-side={t("compare.toone")}>{t(`compare.rows.${row}.toone`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ba-foot">{t("compare.foot")}</p>
    </section>
  );
}

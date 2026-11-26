import { getTranslations } from "next-intl/server";

/**
 * "Built differently": the same six-step job built three ways.
 *
 *   node automation    ■ ■ ■ ✦ ■ ■   every node wired by hand, AI is one node
 *   agents on a timer  ✦ ✦ ✦ ✦ ✦ ✦   every step through a model
 *   Toone              </> </> ✦ ✦ </> </>   scripts for the fixed steps, agents for judgment
 *
 * The tiles reuse the How it works graph's shapes (square = automatic step,
 * rounded = agent); a dot under a tile marks a step that runs through an AI
 * model; a short line links each step to the next. Rivals are named only as examples of a category. The detailed table
 * lives on /compare. Server-rendered, no JS.
 */
type Tile = "node" | "ai" | "auto";
const WAYS: readonly { key: "nodes" | "agents" | "toone"; tiles: readonly Tile[] }[] = [
  { key: "nodes", tiles: ["node", "node", "node", "ai", "node", "node"] },
  { key: "agents", tiles: ["ai", "ai", "ai", "ai", "ai", "ai"] },
  { key: "toone", tiles: ["auto", "auto", "ai", "ai", "auto", "auto"] },
];

function TileIcon({ tile }: { tile: Tile }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {tile === "ai" ? (
        <path d="M8 2.3c.5 2.9 2 4.5 5 5-3 .6-4.5 2.1-5 5.2-.5-3.1-2-4.6-5-5.2 3-.5 4.5-2.1 5-5Z" />
      ) : tile === "auto" ? (
        <path d="M5.6 4.6 2.2 8l3.4 3.4M10.4 4.6 13.8 8l-3.4 3.4M9 3.2 7 12.8" />
      ) : (
        <>
          <circle cx="4" cy="8" r="1.6" />
          <circle cx="12" cy="8" r="1.6" />
          <path d="M5.6 8h4.8" />
        </>
      )}
    </svg>
  );
}

export default async function BuiltDifferentlySection() {
  const t = await getTranslations("landing.built");

  return (
    <section className="section bd" aria-labelledby="bd-title">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .bd-ways { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; list-style: none; margin: 0; padding: 0; }
            .bd-way {
              display: flex; flex-direction: column; gap: 18px;
              padding: 26px 26px 28px; border-radius: var(--r-m);
              box-shadow: 0 0 0 1px rgba(29,28,25,0.09);
            }
            .bd-way--toone { background: #fff; box-shadow: var(--e2); }
            .bd-head { display: flex; flex-direction: column; gap: 4px; }
            .bd-name { display: inline-flex; align-items: center; gap: 8px; color: #1d1c19; font-size: 18px; font-weight: 600; letter-spacing: -0.012em; }
            .bd-name img { width: 22px; height: 22px; flex: none; }
            .bd-like { color: rgba(29,28,25,0.52); font-size: 14px; line-height: 1.45; }
            /* side by side, the strips line up even when one "like" line wraps */
            @media (min-width: 861px) { .bd-like { min-height: 2.9em; } }
            .bd-strip { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 7px; align-items: center; padding-bottom: 8px; }
            .bd-tile {
              position: relative; display: grid; place-items: center; height: 38px;
              color: rgba(29,28,25,0.55);
            }
            .bd-tile svg { width: 15px; height: 15px; }
            .bd-tile[data-t="node"] { border-radius: 6px; box-shadow: inset 0 0 0 1px rgba(29,28,25,0.16); }
            .bd-tile[data-t="auto"] { border-radius: 6px; background: rgba(29,28,25,0.055); color: rgba(29,28,25,0.6); }
            .bd-tile[data-t="ai"] { border-radius: 11px; background: #fff; box-shadow: var(--e1); color: rgba(29,28,25,0.75); }
            .bd-way--toone .bd-tile[data-t="ai"] { box-shadow: inset 0 0 0 1px rgba(29,28,25,0.18), 0 1px 2px rgba(29,28,25,0.06); }
            /* the line linking each step to the next */
            .bd-tile + .bd-tile::before {
              content: ''; position: absolute; left: -8px; top: 50%; width: 7px; height: 1px; background: rgba(29,28,25,0.28);
            }
            /* a dot under every step that runs through a model */
            .bd-tile[data-t="ai"]::after {
              content: ''; position: absolute; bottom: -10px; left: 50%; width: 4px; height: 4px; margin-left: -2px;
              border-radius: 50%; background: #1d1c19;
            }
            .bd-count { color: rgba(29,28,25,0.55); font-size: 14px; font-variant-numeric: tabular-nums; }
            .bd-verdict { color: rgba(29,28,25,0.68); font-size: 16px; line-height: 1.55; text-wrap: pretty; }
            .bd-way--toone .bd-verdict { color: #1d1c19; }
            .bd-verdict b { color: #1d1c19; font-weight: 600; }
            .bd .text-link { display: inline-block; margin-top: 28px; }
            @media (max-width: 860px) { .bd-ways { grid-template-columns: 1fr; } }
          `,
        }}
      />
      <h2 id="bd-title">{t("title")}</h2>
      <p className="sub">{t("sub")}</p>

      <ul className="bd-ways">
        {WAYS.map((way) => (
          <li className={`bd-way${way.key === "toone" ? " bd-way--toone" : ""}`} key={way.key}>
            <div className="bd-head">
              <span className="bd-name">
                {way.key === "toone" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/assets/brand/toone-mark-light.svg" alt="" aria-hidden="true" />
                )}
                {t(`ways.${way.key}.name`)}
              </span>
              <span className="bd-like">{t(`ways.${way.key}.like`)}</span>
            </div>
            <div className="bd-strip" data-k={way.key} aria-hidden="true">
              {way.tiles.map((tile, i) => (
                <span className="bd-tile" data-t={tile} key={i}>
                  <TileIcon tile={tile} />
                </span>
              ))}
            </div>
            <span className="bd-count">
              {t("tokens", { n: way.tiles.filter((tile) => tile === "ai").length })}
            </span>
            <p className="bd-verdict">{t.rich(`ways.${way.key}.verdict`, { b: (chunks) => <b>{chunks}</b> })}</p>
          </li>
        ))}
      </ul>
      <a className="text-link" href="/en/compare">{t("more")}</a>
    </section>
  );
}

import { getTranslations } from "next-intl/server";
import AfterRoutineRun from "@/components/AfterRoutineRun";
import type { LogoKey } from "@/components/RoutineChain";

/**
 * "Why Toone" — Kota's before/after. Before: the scattered state of AI work,
 * a muted collage of tabs, notes and to-dos drawn in HTML. After: the same
 * work as one routine graph in the app's style (the hero's chain, vertical).
 */

function Logo({ name, size = 14 }: { name: LogoKey; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="ba-logo" src={`/assets/logos/${name}.svg`} alt="" width={size} height={size} />;
}

export default async function BeforeAfterSection() {
  const t = await getTranslations("landing.whyToone");
  const g = await getTranslations("landing.routineGraph");

  return (
    <section className="section ba" id="why-toone">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .ba-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .ba-panel {
              position: relative; min-height: 420px; padding: 24px 26px 28px;
              border: 1px solid rgba(29,28,25,0.1); border-radius: 18px; overflow: hidden;
            }
            .ba-panel--before { background: rgba(29,28,25,0.035); }
            .ba-panel--after {
              display: flex; flex-direction: column;
              background:
                radial-gradient(rgba(29,28,25,0.07) 1px, transparent 1.2px) 0 0 / 18px 18px,
                #f6f4ef;
            }
            .ba-label {
              position: relative; z-index: 2;
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-size: 17px; font-weight: 600; letter-spacing: -0.01em;
            }
            .ba-panel--before .ba-label { color: rgba(29,28,25,0.5); }
            .ba-panel--after .ba-label { color: #1d1c19; }
            .ba-caption {
              color: rgba(29,28,25,0.62); font-size: 14.5px; line-height: 1.6;
              margin-top: 16px; max-width: 46ch;
            }
            .ba-after-stage { flex: 1; display: grid; place-items: center; padding-top: 14px; }

            /* --- the before collage: calm, muted, slightly off-kilter --- */
            .ba-mess { position: absolute; inset: 58px 18px 18px; }
            .ba-chip {
              position: absolute; display: flex; align-items: center; gap: 8px;
              padding: 9px 12px; border-radius: 10px; background: #fbfaf7;
              box-shadow: inset 0 0 0 1px rgba(29,28,25,0.1), 0 4px 14px rgba(29,28,25,0.06);
              color: rgba(29,28,25,0.7); font-size: 12px; font-weight: 500;
              white-space: nowrap; transform: rotate(var(--r));
            }
            .ba-logo { display: block; flex-shrink: 0; object-fit: contain; opacity: 0.85; }
            .ba-tab { border-radius: 10px 10px 4px 4px; padding-right: 10px; }
            .ba-x { color: rgba(29,28,25,0.35); font-size: 13px; line-height: 1; margin-left: 4px; }
            .ba-doc {
              flex-direction: column; align-items: stretch; gap: 6px;
              width: 168px; padding: 11px 13px 13px; white-space: normal;
            }
            .ba-doc-name { display: flex; align-items: center; gap: 7px; font-family: ui-monospace, Menlo, monospace; font-size: 11px; }
            .ba-lines { display: flex; flex-direction: column; gap: 5px; }
            .ba-lines i { display: block; height: 4px; border-radius: 2px; background: rgba(29,28,25,0.1); }
            .ba-lines i:nth-child(2) { width: 84%; }
            .ba-lines i:nth-child(3) { width: 62%; }
            .ba-list { width: 178px; }
            .ba-row { display: flex; align-items: center; gap: 6px; }
            .ba-row b { width: 11px; height: 11px; border-radius: 50%; background: rgba(29,28,25,0.1); flex-shrink: 0; }
            .ba-row i { flex: 1; }
            .ba-todo-box {
              width: 13px; height: 13px; border-radius: 4px; flex-shrink: 0;
              box-shadow: inset 0 0 0 1.25px rgba(29,28,25,0.35);
            }
            .ba-sticky {
              position: absolute; width: 132px; padding: 12px 13px 16px;
              background: #ece3c6; color: rgba(29,28,25,0.68);
              font-size: 12px; line-height: 1.4; font-weight: 500;
              box-shadow: 0 6px 16px rgba(29,28,25,0.08);
              transform: rotate(var(--r)); border-radius: 2px 2px 10px 2px;
            }

            .ba-chatgpt { top: 2%;  left: 0;    --r: -3deg; }
            .ba-claude  { top: 11%; left: 30%;  --r: 2deg; z-index: 1; }
            .ba-sticky  { top: 0;   right: 2%;  --r: 5deg; }
            .ba-prompt  { top: 30%; left: 4%;   --r: 3.5deg; }
            .ba-list    { top: 42%; right: 3%;  --r: -2.5deg; }
            .ba-figma   { top: 66%; left: 0;    --r: -4deg; }
            .ba-insta   { top: 80%; left: 33%;  --r: 2.5deg; z-index: 1; }

            @media (max-width: 860px) {
              .ba-grid { grid-template-columns: 1fr; gap: 32px; }
            }
            @media (max-width: 640px) {
              .ba-panel { min-height: 350px; padding: 18px 16px 22px; }
              .ba-mess { inset: 52px 10px 12px; }
              .ba-chip { font-size: 11px; padding: 8px 10px; gap: 6px; }
              .ba-doc { width: 140px; }
              .ba-list { width: 150px; }
              .ba-sticky { width: 112px; font-size: 11px; }
              .ba-claude { left: 7%; top: 13%; }
              .ba-sticky { width: 104px; }
              .ba-list { top: 40%; }
              .ba-insta { left: 16%; top: 79%; }
            }
          `,
        }}
      />
      <p className="eyebrow">{t("eyebrow")}</p>
      <h2>{t("title")}</h2>
      <p className="sub">{t("sub")}</p>

      <div className="ba-grid">
        <figure>
          <div className="ba-panel ba-panel--before">
            <p className="ba-label">{t("before")}</p>
            <div className="ba-mess" aria-hidden="true">
              <span className="ba-chip ba-tab ba-chatgpt">
                <Logo name="openai" />
                {t("chips.chatgpt")}
                <span className="ba-x">×</span>
              </span>
              <span className="ba-chip ba-tab ba-claude">
                <Logo name="claude" />
                {t("chips.claude")}
                <span className="ba-x">×</span>
              </span>
              <span className="ba-sticky">{t("chips.sticky")}</span>
              <span className="ba-chip ba-doc ba-prompt">
                <span className="ba-doc-name">{t("chips.prompt")}</span>
                <span className="ba-lines"><i /><i /><i /></span>
              </span>
              <span className="ba-chip ba-doc ba-list">
                <span className="ba-row"><Logo name="linkedin" size={13} />{t("chips.leads")}</span>
                <span className="ba-lines">
                  <span className="ba-row"><b /><i /></span>
                  <span className="ba-row"><b /><i /></span>
                  <span className="ba-row"><b /><i /></span>
                </span>
              </span>
              <span className="ba-chip ba-figma">
                <Logo name="figma" />
                {t("chips.figma")}
              </span>
              <span className="ba-chip ba-insta">
                <span className="ba-todo-box" />
                {t("chips.instagram")}
                <Logo name="instagram" size={13} />
              </span>
            </div>
          </div>
          <figcaption className="ba-caption">{t("beforeCaption")}</figcaption>
        </figure>

        <figure>
          <div className="ba-panel ba-panel--after">
            <p className="ba-label">{t("after")}</p>
            <div className="ba-after-stage">
              <AfterRoutineRun
                rows={[
                  { title: g("research"), tiles: ["claude", "openai"] },
                  { title: g("findLeads"), tiles: ["linkedin"] },
                  { title: g("designFiles"), tiles: ["figma", "higgsfield"] },
                  { title: g("publishSocial"), tiles: ["threads", "facebook", "instagram"] },
                ]}
                labels={{ running: g("running"), paused: g("paused") }}
              />
            </div>
          </div>
          <figcaption className="ba-caption">{t("afterCaption")}</figcaption>
        </figure>
      </div>
    </section>
  );
}

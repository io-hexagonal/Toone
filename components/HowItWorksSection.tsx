"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import RoutineChain, { type ChainRow, type RowState } from "@/components/RoutineChain";

/**
 * "How it works" — Kota-style stepper: a numbered list on the left (the
 * active step expanded), a framed panel on the right with a small routine
 * graph in the app's style that changes per step: draft → running → paused.
 *
 * The active tab's progress bar is a 6s CSS animation and its `animationend`
 * advances the step, so pausing it (out of view, pointer over the stepper)
 * pauses the auto-advance with no timers to keep in sync. Reduced motion
 * removes the bar, so the stepper only moves when clicked.
 */
const STEPS = ["describe", "run", "resume"] as const;
const RUN_STEP = 1;
const RUN_TICK_MS = 1900;
const CARD_COUNT = 3;

export default function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");
  const g = useTranslations("landing.routineGraph");
  const id = useId();
  const rootRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [runIndex, setRunIndex] = useState(0);
  const [live, setLive] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(root);
    return () => io.disconnect();
  }, []);

  // While "Watch it run" is up, the cards run one at a time.
  useEffect(() => {
    if (active !== RUN_STEP || reduced) return;
    const timer = window.setInterval(
      () => setRunIndex((i) => Math.min(i + 1, CARD_COUNT - 1)),
      RUN_TICK_MS,
    );
    return () => window.clearInterval(timer);
  }, [active, reduced]);

  const rows: ChainRow[] = [
    { title: g("research"), tiles: ["claude", "openai"] },
    { title: g("findLeads"), tiles: ["linkedin"] },
    { title: g("designFiles"), tiles: ["figma"] },
  ];

  function select(index: number, focus = false) {
    setActive(index);
    // Reduced motion shows one still frame of the run: first card done, second running.
    setRunIndex(reduced ? 1 : 0);
    if (focus) tabRefs.current[index]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = STEPS.length - 1;
    const next =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? active === last ? 0 : active + 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? active === 0 ? last : active - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    select(next, true);
  }

  const states: RowState[] = rows.map((_, i) => {
    if (active === 0) return "draft";
    if (active === RUN_STEP) return i < runIndex ? "done" : i === runIndex ? "running" : "idle";
    return i === 0 ? "done" : i === 1 ? "paused" : "idle";
  });

  const panelId = `${id}-panel`;

  return (
    <section className="section hiw" id="how-it-works" ref={rootRef} data-live={live ? "" : undefined}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .hiw-grid {
              display: grid; grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
              gap: 44px; align-items: stretch;
            }
            .hiw-steps { display: flex; flex-direction: column; align-self: center; }
            .hiw-step { border-bottom: 1px solid rgba(29,28,25,0.1); }
            .hiw-step:first-child { border-top: 1px solid rgba(29,28,25,0.1); }
            .hiw-tab {
              all: unset; box-sizing: border-box; cursor: pointer;
              display: flex; align-items: baseline; gap: 14px; width: 100%;
              padding: 20px 2px 18px;
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-size: 20px; font-weight: 500; letter-spacing: -0.015em;
              color: rgba(29,28,25,0.4); transition: color 0.25s;
            }
            .hiw-tab:hover { color: rgba(29,28,25,0.72); }
            .hiw-tab[aria-selected="true"] { color: #1d1c19; }
            .hiw-tab:focus-visible { outline: 2px solid #1d1c19; outline-offset: 3px; border-radius: 6px; }
            .hiw-num { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; min-width: 18px; }
            .hiw-desc {
              color: rgba(29,28,25,0.6); font-size: 14.5px; line-height: 1.6;
              padding: 0 2px 20px 34px; max-width: 40ch;
            }
            .hiw-track {
              display: block; height: 2px; margin: 0 2px -1px 34px;
              background: rgba(29,28,25,0.08); border-radius: 2px; overflow: hidden;
            }
            .hiw-bar {
              display: block; height: 100%; background: #1d1c19; transform-origin: left;
              animation: hiw-progress 6s linear forwards;
              animation-play-state: paused;
            }
            .hiw[data-live] .hiw-bar { animation-play-state: running; }
            .hiw[data-live] .hiw-grid:hover .hiw-bar,
            .hiw[data-live] .hiw-grid:has(:focus-visible) .hiw-bar { animation-play-state: paused; }
            @keyframes hiw-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }

            /* the framed panel: the app's graph container, on cream */
            .hiw-panel {
              position: relative; display: flex; flex-direction: column;
              min-height: 392px; padding: 22px 26px 30px;
              border: 1px solid rgba(29,28,25,0.1); border-radius: 18px;
              background:
                radial-gradient(rgba(29,28,25,0.07) 1px, transparent 1.2px) 0 0 / 18px 18px,
                #f6f4ef;
            }
            .hiw-head {
              display: flex; align-items: center; justify-content: space-between; gap: 12px;
              min-height: 44px; margin-bottom: 18px;
            }
            .hiw-name { color: rgba(29,28,25,0.62); font-size: 12.5px; font-weight: 600; }
            .hiw-chip {
              display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
              border-radius: 999px; padding: 5px 10px;
              font-size: 11px; font-weight: 600; color: rgba(29,28,25,0.8);
              background: rgba(29,28,25,0.06); box-shadow: inset 0 0 0 .75px rgba(29,28,25,0.28);
            }
            .hiw-chip svg { width: 11px; height: 11px; }
            .hiw-resume {
              display: inline-flex; align-items: center; gap: 7px; flex-shrink: 0;
              border-radius: 999px; padding: 7px 13px 7px 11px;
              background: #141311; color: #f0ede6; font-size: 11.5px; font-weight: 600;
            }
            .hiw-resume svg { width: 9px; height: 9px; }
            .hiw-prompt {
              flex: 1; padding: 11px 14px; border-radius: 12px 12px 12px 4px;
              background: #fff; box-shadow: inset 0 0 0 1px rgba(29,28,25,0.1);
              color: rgba(29,28,25,0.82); font-size: 13px; line-height: 1.5;
            }
            .hiw-caret {
              display: inline-block; width: 1.5px; height: 1.05em; margin-left: 2px;
              vertical-align: -0.15em; background: rgba(29,28,25,0.7);
              animation: hiw-blink 1.1s steps(1) infinite;
            }
            @keyframes hiw-blink { 50% { opacity: 0; } }
            .hiw-stage { flex: 1; display: grid; place-items: center; }
            /* the draft pops in, card by card, each time "Describe it" comes up */
            .hiw-stage[data-step="0"] .rg-card { animation: hiw-in 0.5s cubic-bezier(0.34, 1.36, 0.64, 1) both; }
            .hiw-stage[data-step="0"] .rg-row:nth-child(2) .rg-card { animation-delay: 0.12s; }
            .hiw-stage[data-step="0"] .rg-row:nth-child(3) .rg-card { animation-delay: 0.24s; }
            @keyframes hiw-in { from { opacity: 0; transform: scale(0.94); } }

            @media (max-width: 860px) {
              .hiw-grid { grid-template-columns: 1fr; gap: 28px; }
              .hiw-steps { align-self: stretch; }
            }
            @media (max-width: 640px) {
              .hiw-tab { font-size: 18px; padding: 17px 2px 15px; }
              .hiw-panel { min-height: 344px; padding: 16px 14px 24px; }
              .hiw-head { min-height: 40px; margin-bottom: 16px; }
              .hiw-prompt { font-size: 12.5px; }
            }
            @media (prefers-reduced-motion: reduce) {
              .hiw-tab { transition: none; }
              .hiw-bar, .hiw-track { display: none; }
              .hiw-caret { animation: none; }
              .hiw-stage[data-step="0"] .rg-card { animation: none; }
            }
          `,
        }}
      />
      <p className="eyebrow">{t("eyebrow")}</p>
      <h2>{t("title")}</h2>
      <p className="sub">{t("sub")}</p>

      <div className="hiw-grid">
        <div className="hiw-steps" role="tablist" aria-orientation="vertical" aria-label={t("eyebrow")} onKeyDown={onKeyDown}>
          {STEPS.map((step, i) => {
            const selected = i === active;
            return (
              <div className="hiw-step" key={step}>
                <button
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${i}`}
                  aria-selected={selected}
                  aria-controls={panelId}
                  aria-describedby={selected ? `${id}-desc` : undefined}
                  tabIndex={selected ? 0 : -1}
                  className="hiw-tab"
                  onClick={() => select(i)}
                >
                  <span className="hiw-num">{i + 1}.</span>
                  <span>{t(`steps.${step}.title`)}</span>
                </button>
                {selected && (
                  <>
                    <p className="hiw-desc" id={`${id}-desc`}>
                      {t(`steps.${step}.body`)}
                    </p>
                    {!reduced && (
                      <span className="hiw-track" aria-hidden="true">
                        <span
                          className="hiw-bar"
                          key={active}
                          onAnimationEnd={() => select((active + 1) % STEPS.length)}
                        />
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="hiw-panel" role="tabpanel" id={panelId} aria-labelledby={`${id}-tab-${active}`}>
          <div className="hiw-head" aria-hidden="true">
            {active === 0 ? (
              <p className="hiw-prompt">
                {t("prompt")}
                <span className="hiw-caret" />
              </p>
            ) : (
              <>
                <span className="hiw-name">{g("routineName")}</span>
                {active === RUN_STEP ? (
                  <span className="hiw-chip">
                    {/* waveform.path.ecg, the app's live status chip glyph */}
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 6.5h2.2l1.4-3.5 2.2 6 1.5-3.6.7 1.1H11" />
                    </svg>
                    {g("running")}
                  </span>
                ) : (
                  <span className="hiw-resume">
                    <svg viewBox="0 0 10 10" fill="currentColor">
                      <path d="M2 1.2v7.6a.5.5 0 0 0 .76.43l6.1-3.8a.5.5 0 0 0 0-.86L2.76.77A.5.5 0 0 0 2 1.2Z" />
                    </svg>
                    {g("resume")}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="hiw-stage" data-step={active}>
            <RoutineChain
              rows={rows}
              states={states}
              labels={{ running: g("running"), paused: g("paused") }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

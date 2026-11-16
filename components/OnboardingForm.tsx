"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { saveOnboarding, type OnboardingAnswers } from "@/lib/api";
import { useStoredSession } from "@/lib/hooks/useStoredSession";

const USE = ["marketing", "seo", "video", "research", "sales", "engineering", "other"] as const;
const TEAM = ["me", "team", "clients"] as const;
const TOOLS = ["claude", "openai", "cursor", "none"] as const;
const SOURCE = ["producthunt", "appsumo", "youtube", "friend", "search", "other"] as const;

/**
 * Four optional questions right after sign-up. Answers are saved to the
 * account when the API accepts them; either way the visitor goes on to the
 * download page, so a failed save never blocks anyone.
 */
export default function OnboardingForm() {
  const t = useTranslations("auth.onboarding");
  const router = useRouter();
  const { session } = useStoredSession();
  const [use, setUse] = useState<string[]>([]);
  const [team, setTeam] = useState<string | null>(null);
  const [tools, setTools] = useState<string[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = (list: string[], set: (next: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  // "None yet" and a tool exclude each other.
  const toggleTool = (value: string) =>
    setTools(value === "none" ? (tools.includes("none") ? [] : ["none"]) : (tools.includes(value) ? tools.filter((v) => v !== value) : [...tools.filter((v) => v !== "none"), value]));

  async function finish(save: boolean) {
    if (busy) return;
    setBusy(true);
    const answers: OnboardingAnswers = { use_cases: use, audience: team, ai_tools: tools, source };
    if (save && session) await saveOnboarding(session.token, answers).catch(() => {});
    router.replace("/downloads");
  }

  const chip = (label: string, on: boolean, onClick: () => void, key: string) => (
    <button type="button" className="ob-chip" aria-pressed={on} onClick={onClick} key={key}>
      {label}
    </button>
  );
  const answered = use.length > 0 || team !== null || tools.length > 0 || source !== null;

  return (
    <form className="ob-form" onSubmit={(e) => { e.preventDefault(); void finish(true); }}>
      <fieldset>
        <legend>{t("use.q")} <span>{t("hintAny")}</span></legend>
        <div className="ob-chips">{USE.map((k) => chip(t(`use.${k}`), use.includes(k), () => toggle(use, setUse, k), k))}</div>
      </fieldset>
      <fieldset>
        <legend>{t("team.q")}</legend>
        <div className="ob-chips">{TEAM.map((k) => chip(t(`team.${k}`), team === k, () => setTeam(team === k ? null : k), k))}</div>
      </fieldset>
      <fieldset>
        <legend>{t("tools.q")} <span>{t("hintAny")}</span></legend>
        <div className="ob-chips">{TOOLS.map((k) => chip(t(`tools.${k}`), tools.includes(k), () => toggleTool(k), k))}</div>
      </fieldset>
      <fieldset>
        <legend>{t("source.q")}</legend>
        <div className="ob-chips">{SOURCE.map((k) => chip(t(`source.${k}`), source === k, () => setSource(source === k ? null : k), k))}</div>
      </fieldset>
      <div className="ob-actions">
        <button type="submit" className="ob-continue" disabled={busy || !answered}>{t("continue")}</button>
        <button type="button" className="ob-skip" disabled={busy} onClick={() => void finish(false)}>{t("skip")}</button>
      </div>
    </form>
  );
}

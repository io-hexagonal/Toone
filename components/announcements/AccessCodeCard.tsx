"use client";

import { useState } from "react";
import { Link, useRouter } from "@/lib/navigation";
import type { AccessCodeAnnouncement } from "@/content/announcements";
import { daysLeft, focusEarlyAccessInput, track } from "@/lib/announcements";
import type { CardProps } from "./AnnouncementModal";

/**
 * Body of an invitation-code campaign. Mac visitors get the code and an install
 * button that carries it into the invite flow; everyone else is offered a
 * notification for the Windows and Linux builds through the early-access form.
 */
export default function AccessCodeCard({ announcement, platform, close }: CardProps<AccessCodeAnnouncement>) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const { mac, otherPlatforms: other } = announcement;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(mac.code);
      setCopied(true);
      track(`announcement-copy-${announcement.id}`);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* the code is visible and selectable */ }
  }

  /** Close the card and hand the visitor the early-access email field. */
  function notifyMe() {
    close("notify");
    if (focusEarlyAccessInput()) return;
    // Pages without the hero form: the request page focuses its field on #notify.
    router.push("/request-access#notify");
  }

  if (platform !== "mac") {
    return (
      <>
        {other.eyebrow && <p className="an-eyebrow">{other.eyebrow}</p>}
        <h2 id="an-title" className="an-title">{other.title}</h2>
        <p className="an-text">{other.body}</p>
        <div className="an-actions">
          <button type="button" className="an-primary" onClick={notifyMe}>{other.ctaLabel}</button>
          <button type="button" className="an-secondary" onClick={() => close("dismiss")}>{other.dismissLabel}</button>
        </div>
      </>
    );
  }

  const left = daysLeft(announcement.endsAt, Date.now());
  const deadline = new Date(announcement.endsAt).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  return (
    <>
      {mac.eyebrow && <p className="an-eyebrow">{mac.eyebrow}</p>}
      <h2 id="an-title" className="an-title">{mac.title}</h2>
      <p className="an-text">{mac.body}</p>
      <div className="an-code">
        <div>
          <p className="an-code-label">Your code</p>
          <p className="an-code-value">{mac.code}</p>
        </div>
        <button type="button" className="an-copy" onClick={() => void copyCode()} aria-live="polite">{copied ? "Copied" : "Copy"}</button>
      </div>
      <p className="an-deadline">Valid until <strong>{deadline}</strong>{left > 0 ? ` · ${left} ${left === 1 ? "day" : "days"} left` : " · last day"}</p>
      <div className="an-actions">
        <Link href={mac.cta.href} className="an-primary" onClick={() => close("cta")}>{mac.cta.label}</Link>
        <button type="button" className="an-secondary" onClick={() => close("dismiss")}>{mac.dismissLabel}</button>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { track } from "@/lib/announcements";
import type { LaunchAnnouncement } from "@/content/announcements";
import type { CardProps } from "./AnnouncementModal";

type LaunchContent = Omit<LaunchAnnouncement, "startsAt" | "endsAt">;
type CardLink = LaunchContent["otherPlatforms"]["link"];

/**
 * Body of a public launch. Mac visitors get the download button, the offer
 * code (copyable, as on the access-code card) and a secondary link; everyone
 * else learns the app is for Mac and gets the same link.
 */
export default function LaunchCard({ announcement, platform, close }: CardProps<LaunchContent>) {
  const t = useTranslations("announcement");
  const [copied, setCopied] = useState(false);
  const { mac, otherPlatforms: other } = announcement;

  function outLink(link: CardLink, primary = false) {
    const className = primary ? "an-primary" : "an-secondary";
    const onClick = () => track(`announcement-link-${announcement.id}`);
    return link.external ? (
      <a className={className} href={link.href} target="_blank" rel="noopener noreferrer" onClick={onClick}>{link.label}</a>
    ) : (
      <Link className={className} href={link.href} onClick={() => { onClick(); close("cta"); }}>{link.label}</Link>
    );
  }

  if (platform !== "mac") {
    return (
      <>
        {other.eyebrow && <p className="an-eyebrow">{other.eyebrow}</p>}
        <h2 id="an-title" className="an-title">{other.title}</h2>
        <p className="an-text">{other.body}</p>
        {other.note && <p className="an-note">{other.note}</p>}
        <div className="an-actions">
          {outLink(other.link, true)}
          {other.dismissLabel && <button type="button" className="an-secondary" onClick={() => close("dismiss")}>{other.dismissLabel}</button>}
        </div>
      </>
    );
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      track(`announcement-copy-${announcement.id}`);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* the code is visible and selectable */ }
  }

  return (
    <>
      {mac.eyebrow && <p className="an-eyebrow">{mac.eyebrow}</p>}
      <h2 id="an-title" className="an-title">{mac.title}</h2>
      <p className="an-text">{mac.body}</p>
      {mac.note && <p className="an-note">{mac.note}</p>}
      {mac.offer && (
        <>
          <div className="an-code">
            <div>
              <p className="an-code-label">{mac.offer.label}</p>
              <p className="an-code-value">{mac.offer.code}</p>
            </div>
            <button type="button" className="an-copy" onClick={() => void copyCode(mac.offer!.code)} aria-live="polite">{copied ? t("copied") : t("copy")}</button>
          </div>
          <p className="an-deadline">{mac.offer.terms}</p>
        </>
      )}
      <div className="an-actions">
        <Link href={mac.cta.href} className="an-primary" data-umami-event="download-cta" data-umami-event-placement="launch-modal"
          onClick={() => close("cta")}>{mac.cta.label}</Link>
        {mac.link && outLink(mac.link)}
        {mac.dismissLabel && <button type="button" className="an-secondary" onClick={() => close("dismiss")}>{mac.dismissLabel}</button>}
      </div>
    </>
  );
}

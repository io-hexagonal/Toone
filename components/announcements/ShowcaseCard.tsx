"use client";

import type { AnnouncementShowcasePanel } from "@/content/announcements";
import { Link } from "@/lib/navigation";
import type { CardProps, CloseReason } from "./AnnouncementModal";

type Panel = Omit<AnnouncementShowcasePanel, "id" | "image">;

export default function ShowcaseCard({ panel, close }: {
  panel: Panel;
  close: (reason: CloseReason) => void;
}) {
  const poster = panel.layout === "poster";
  const external = /^https?:\/\//.test(panel.cta.href);
  return (
    <>
      {panel.ribbon && (
        <div className="an-ribbon">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/announcements/laurel-left.png" alt="" width={24} height={50} />
          <div>
            <p className="an-ribbon-kicker">{panel.ribbon.kicker}</p>
            <p className="an-ribbon-title">{panel.ribbon.title}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/announcements/laurel-right.png" alt="" width={24} height={50} />
        </div>
      )}
      {panel.eyebrow && !poster && <p className="an-eyebrow">{panel.eyebrow}</p>}
      <h2 id="an-title" className={poster ? "an-title an-poster-copy" : "an-title"}>{panel.title}</h2>
      {panel.body && <p className={poster ? "an-text an-poster-copy" : "an-text"}>{panel.body}</p>}
      {panel.items?.length ? (
        <ol className="an-features">
          {panel.items.map((item, index) => (
            <li key={item.title}>
              <span className="an-feature-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{item.title}</h3><p>{item.description}</p></div>
            </li>
          ))}
        </ol>
      ) : null}
      <div className="an-actions">
        {external
          ? <a href={panel.cta.href} target="_blank" rel="noopener" className="an-primary" onClick={() => close("cta")}>{panel.cta.label}</a>
          : <Link href={panel.cta.href} className="an-primary" onClick={() => close("cta")}>{panel.cta.label}</Link>}
      </div>
      {panel.note && <p className={poster ? "an-deadline an-poster-note" : "an-deadline"}>{panel.note}</p>}
    </>
  );
}

/** First panel of a "showcase" campaign. */
export function ShowcaseIntroCard({ announcement, close }: CardProps) {
  if (announcement.kind !== "showcase") return null;
  return <ShowcaseCard panel={announcement.intro} close={close} />;
}

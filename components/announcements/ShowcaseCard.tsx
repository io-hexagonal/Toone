"use client";

import type { AnnouncementShowcasePanel } from "@/content/announcements";
import { Link } from "@/lib/navigation";
import type { CloseReason } from "./AnnouncementModal";

export default function ShowcaseCard({ panel, close }: {
  panel: AnnouncementShowcasePanel;
  close: (reason: CloseReason) => void;
}) {
  return (
    <>
      {panel.eyebrow && <p className="an-eyebrow">{panel.eyebrow}</p>}
      <h2 id="an-title" className="an-title">{panel.title}</h2>
      <p className="an-text">{panel.body}</p>
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
        <Link href={panel.cta.href} className="an-primary" onClick={() => close("cta")}>{panel.cta.label}</Link>
      </div>
    </>
  );
}

"use client";
import { useEffect, useRef } from "react";
import { createOpenAttempt, requestAccessHref } from "@/lib/explore/presentation";

/**
 * "Open in Toone" CTA (contract §2 deep links, plan §4.3).
 *
 * Server-rendered as a plain download link so crawlers and no-JS visitors
 * get a usable anchor. With JavaScript it assigns the validated `toone://`
 * URL and starts a 1.5 s timer; if the page is still visible when it fires,
 * the app is not installed and the visitor goes to the download page.
 * Losing visibility, page hide, blur, unmount or a repeated click cancels
 * the pending fallback so returning from the app never redirects.
 */
export default function OpenInToone({
  url,
  label,
  locale,
  item,
}: {
  url: string | null;
  label: string;
  locale: string;
  /** `routine:<id>` or `bundle:<id>`, for the click event. */
  item?: string;
}) {
  const cancel = useRef<(() => void) | null>(null);
  useEffect(() => () => cancel.current?.(), []);
  const fallback = requestAccessHref(locale, item);
  return (
    <a
      className="explore-button"
      href={fallback}
      data-umami-event="explore-open-in-toone"
      data-umami-event-item={item}
      onClick={(event) => {
        if (
          !url ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        cancel.current?.();
        cancel.current = createOpenAttempt(
          {
            listen: (name, fn) => {
              const target = name === "visibilitychange" ? document : window;
              target.addEventListener(name, fn);
              return () => target.removeEventListener(name, fn);
            },
            later: (fn, ms) => {
              const timer = window.setTimeout(fn, ms);
              return () => window.clearTimeout(timer);
            },
            visible: () => document.visibilityState === "visible",
            navigate: (destination) => window.location.assign(destination),
          },
          url,
          fallback,
        );
      }}
    >
      {label}
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}

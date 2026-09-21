"use client";
import { useEffect, useRef } from "react";
import { createOpenAttempt } from "@/lib/explore/presentation";

export default function OpenInToone({
  url,
  label,
}: {
  url: string | null;
  label: string;
}) {
  const cancel = useRef<(() => void) | null>(null);
  useEffect(() => () => cancel.current?.(), []);
  const fallback = "/en/download?from=explore";
  return (
    <a
      className="explore-button"
      href={fallback}
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

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/lib/navigation";
import { readAlternates } from "@/lib/locale-preference";

/**
 * This page's hreflang alternates, by locale. Empty on the server and on the
 * first client render, so language links hydrate with the same `/xx` homes
 * the server sent, then point at the page's own versions. Re-read after each
 * navigation; metadata can arrive a beat after render.
 */
export function usePageAlternates() {
  const pathname = usePathname();
  const [alternates, setAlternates] = useState<ReturnType<typeof readAlternates>>({});
  useEffect(() => {
    const read = () => setAlternates(readAlternates(document, window.location.origin));
    read();
    const timer = window.setTimeout(read, 600);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  return alternates;
}

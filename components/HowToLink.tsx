"use client";

import type { ReactNode } from "react";
import { useStoredSession } from "@/lib/hooks/useStoredSession";

/**
 * A link into the /how-to guides. They are for signed-in accounts only and
 * ship `noindex, nofollow` (lib/how-to-access.ts), so the server HTML, which
 * is what crawlers read, never links to them (A7): indexable pages spend
 * their links on indexable pages. Signed-in visitors get the link once the
 * session is read. Until then, and for everyone signed out (who would only
 * meet the sign-in wall), `fallback` decides what shows:
 *
 * - `"none"`: nothing (a standalone call to action);
 * - `"text"`: the words alone, so a sentence still reads;
 * - `"block"`: the same content in a `<div>` with the same class, for cards.
 */
export default function HowToLink({
  href,
  className,
  fallback,
  children,
}: {
  href: string;
  className?: string;
  fallback: "none" | "text" | "block";
  children: ReactNode;
}) {
  const { session, ready } = useStoredSession();
  if (ready && session) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  if (fallback === "none") return null;
  if (fallback === "text") return <>{children}</>;
  return (
    <div className={className} data-howto-static="">
      {children}
    </div>
  );
}

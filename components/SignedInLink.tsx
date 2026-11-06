"use client";

import type { ComponentProps } from "react";
import { Link } from "@/lib/navigation";
import { useStoredSession } from "@/lib/hooks/useStoredSession";

/**
 * A site link shown only to signed-in visitors. The server HTML never
 * contains it, so signed-out visitors and crawlers do not see the entry
 * point; the target pages themselves stay public and indexed.
 */
export default function SignedInLink(props: ComponentProps<typeof Link>) {
  const { session, ready } = useStoredSession();
  if (!ready || !session) return null;
  return <Link {...props} />;
}

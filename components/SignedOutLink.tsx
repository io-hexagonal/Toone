"use client";

import type { ComponentProps } from "react";
import { Link } from "@/lib/navigation";
import { useStoredSession } from "@/lib/hooks/useStoredSession";

/**
 * A site link for visitors who are not signed in (sign in, create account).
 * The server HTML contains it, so crawlers and signed-out visitors see the
 * entry point; it leaves once a stored session is read.
 */
export default function SignedOutLink(props: ComponentProps<typeof Link>) {
  const { session, ready } = useStoredSession();
  if (ready && session) return null;
  return <Link {...props} />;
}

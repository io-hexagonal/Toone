"use client";

import type { ReactNode } from "react";
import { useStoredSession } from "@/lib/hooks/useStoredSession";

/**
 * Content for signed-in visitors only, rendered once the session is read.
 * The server HTML and signed-out visitors get nothing, so a block whose only
 * action needs an account (a /how-to call to action, see HowToLink) is not
 * left behind as a heading with a dead end.
 */
export default function SignedInOnly({ children }: { children: ReactNode }) {
  const { session, ready } = useStoredSession();
  return ready && session ? <>{children}</> : null;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { clearSession, loadSession, type ToneSession } from "@/lib/api";

/**
 * The session stored under `toone.session`, kept in sync with other tabs.
 * `ready` is false until the first client read, so pages can show a neutral
 * "Checking your account…" state instead of flashing the sign-in form.
 */
export function useStoredSession() {
  const [session, setSession] = useState<ToneSession | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const syncSession = () => setSession(loadSession());
    syncSession();
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === "toone.session" || event.key === null) syncSession();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const endSession = useCallback(() => { clearSession(); setSession(null); }, []);
  return { session, ready, setSession, endSession };
}

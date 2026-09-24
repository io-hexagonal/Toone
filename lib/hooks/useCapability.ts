"use client";

import { useEffect, useState } from "react";
import { hasCapability, loadSession } from "@/lib/api";

/**
 * True once the stored session (`toone.session`) is confirmed to hold
 * `capability` by `GET /me/capabilities`. False before hydration, while
 * checking, when signed out and on any error, so server-rendered output is
 * identical for everyone. Follows sign-in/out in other tabs. Discovery only:
 * the API authorizes every operation.
 */
export function useCapability(capability: string, token?: string): boolean {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let generation = 0;
    const check = (currentToken?: string) => {
      const request = ++generation;
      setAllowed(false);
      if (!currentToken) return;
      hasCapability(currentToken, capability)
        .then(value => { if (!cancelled && request === generation) setAllowed(value); })
        .catch(() => { if (!cancelled && request === generation) setAllowed(false); });
    };
    check(token || loadSession()?.token);
    const onStorage = (event: StorageEvent) => {
      if (event.key === "toone.session" || event.key === null) check(loadSession()?.token);
    };
    window.addEventListener("storage", onStorage);
    return () => { cancelled = true; window.removeEventListener("storage", onStorage); };
  }, [capability, token]);
  return allowed;
}

"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { LAUNCH_AT_MS, isLaunched } from "@/lib/launch";

/**
 * Hydration-safe view of the launch gate (lib/launch.ts) for client code.
 *
 * Statically built pages keep the HTML they were rendered with, which can be
 * from before the launch. The root layout passes the launch state *at render
 * time* down here; hydration uses exactly that value, so the client never
 * disagrees with the server HTML, and the clock takes over right after. An
 * open tab also flips at the launch instant.
 */
const RenderedLaunch = createContext<boolean | null>(null);

export function LaunchProvider({ launched, children }: { launched: boolean; children: ReactNode }) {
  return <RenderedLaunch.Provider value={launched}>{children}</RenderedLaunch.Provider>;
}

/** setTimeout holds at most 2^31-1 ms; past that the tab flips on its next render. */
const MAX_TIMER_MS = 2_147_483_647;

function subscribe(onChange: () => void): () => void {
  const wait = LAUNCH_AT_MS - Date.now();
  if (wait < 0 || wait > MAX_TIMER_MS) return () => {};
  const timer = window.setTimeout(onChange, wait + 25);
  return () => window.clearTimeout(timer);
}

/** Whether the launch has happened, for this render. */
export function useLaunched(): boolean {
  const rendered = useContext(RenderedLaunch);
  return useSyncExternalStore(
    subscribe,
    // The launch never un-happens: HTML rendered after it stays launched even
    // on a device whose clock is behind.
    () => rendered === true || isLaunched(),
    // Server render and hydration: the value the HTML was rendered with.
    () => rendered ?? isLaunched(),
  );
}

/**
 * Shows `before` until the launch and `after` from then on.
 *
 * HTML rendered before the launch carries both variants, each in a
 * `display: contents` wrapper, with the launched one hidden (app/globals.css).
 * When such HTML is served after the launch, the inline head script
 * (LAUNCH_MARKER_SCRIPT) marks <html data-launched> before first paint and the
 * CSS swaps the two, so there is no flash before hydration; hydration then
 * drops the stale variant. HTML rendered after the launch only contains
 * `after`.
 */
export function LaunchSwitch({ before, after }: { before: ReactNode; after: ReactNode }) {
  const launched = useLaunched();
  if (launched) return <>{after}</>;
  return (
    <>
      <span data-launch="before">{before}</span>
      <span data-launch="after">{after}</span>
    </>
  );
}

import { TRADER_DETAILS_COMPLETE } from "./trader";

/**
 * Release gate for selling Toone Pro on the web: a production build never
 * offers checkout while the trader details (lib/legal/trader.ts) still wait
 * for the owner, because the Legal notice, with the trader's address and tax
 * number, must be published before anyone can buy.
 *
 * `TOONE_RELEASE_BUILD` is set by next.config.ts at build time ("1" for a
 * Vercel production build or with `LEGAL_RELEASE_CHECK=1`) and inlined into
 * the server and browser bundles. Local, preview and test builds keep
 * checkout available so it can be tried before the details are filled in.
 * The prebuild step (scripts/legal/release-check.ts) also fails a production
 * build outright while the API already has web checkout on.
 */
export function isReleaseBuildEnv(env: Record<string, string | undefined>): boolean {
  return env.VERCEL_ENV === "production" || env.LEGAL_RELEASE_CHECK === "1";
}

/** Whether this bundle is a release build (inlined at build time). */
export const RELEASE_BUILD: boolean = process.env.TOONE_RELEASE_BUILD === "1";

/** Web checkout may be offered: the trader details are complete, or this is not a release build. */
export function webSalesLegallyReady(traderComplete: boolean = TRADER_DETAILS_COMPLETE, releaseBuild: boolean = RELEASE_BUILD): boolean {
  return traderComplete || !releaseBuild;
}

export const WEB_SALES_LEGALLY_READY: boolean = webSalesLegallyReady();

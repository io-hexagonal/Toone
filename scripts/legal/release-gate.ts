/**
 * Prebuild release gate (runs before every `npm run build`, including the
 * Vercel build). In a release build (Vercel production, or
 * LEGAL_RELEASE_CHECK=1) with trader details still missing:
 *
 * - the build FAILS when the API already offers web checkout, because the
 *   site would then sell Toone Pro without a published Legal notice;
 * - otherwise it passes with a warning: the built site keeps every purchase
 *   surface hidden (lib/legal/release.ts) until the details are filled in.
 *
 * An unreachable API counts as "checkout off": the built site hides checkout
 * on its own, so the deploy stays safe either way.
 */
import { isReleaseBuildEnv } from "../../lib/legal/release";

const DEFAULT_API_BASE = "https://api.trytoone.com/v1";

export async function checkoutLive(apiBase: string, fetcher: typeof fetch = fetch): Promise<boolean | null> {
  try {
    const response = await fetcher(`${apiBase}/capabilities`, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return null;
    const body = (await response.json()) as { features?: { stripe_pro_checkout?: unknown } } | null;
    return body?.features?.stripe_pro_checkout === true;
  } catch {
    return null;
  }
}

export type ReleaseCheck = { ok: true; message: string | null } | { ok: false; message: string };

export async function releaseCheck(
  env: Record<string, string | undefined>,
  missing: readonly string[],
  live: (apiBase: string) => Promise<boolean | null> = (base) => checkoutLive(base),
): Promise<ReleaseCheck> {
  if (!isReleaseBuildEnv(env) || missing.length === 0) return { ok: true, message: null };
  const fields = missing.join(", ");
  const on = await live(env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE);
  if (on === true) {
    return {
      ok: false,
      message: `Release gate: web checkout is on, but lib/legal/trader.ts is missing: ${fields}. Fill it in before deploying to production.`,
    };
  }
  return {
    ok: true,
    message: `Release gate: lib/legal/trader.ts is missing: ${fields}. This build hides web checkout until it is filled in.`,
  };
}

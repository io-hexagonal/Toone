import "server-only";
import { headers } from "next/headers";
import { NONCE_HEADER } from "./csp";

/**
 * This request's script nonce (proxy.ts, lib/csp.ts), for the site's own
 * inline scripts. Next.js puts it on its framework scripts by itself.
 */
export async function cspNonce(): Promise<string | undefined> {
  return (await headers()).get(NONCE_HEADER) ?? undefined;
}

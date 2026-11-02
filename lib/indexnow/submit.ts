/**
 * The one IndexNow request shape used by every sender on the site: the
 * Journal webhook, the Explore approval path and the deploy notice
 * (`scripts/indexnow/notify-site.ts`). The key file is `public/<key>.txt`.
 */
export const INDEXNOW_SITE = "https://trytoone.com";
export const INDEXNOW_KEY = "kpdkez871rpzxfa3q11m2d2fvpqq4cyg"; // public/<key>.txt
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export function indexNowPayload(urls: string[]) {
  return {
    host: new URL(INDEXNOW_SITE).host,
    key: INDEXNOW_KEY,
    keyLocation: `${INDEXNOW_SITE}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };
}

/** POSTs the URLs and returns the HTTP status (200 or 202 means received). */
export async function submitToIndexNow(urls: string[]): Promise<number> {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(indexNowPayload(urls)),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  return response.status;
}

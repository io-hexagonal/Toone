import type { Metadata } from "next";

/**
 * The pages Stripe returns to (`/success`, `/cancel`) are private: never
 * indexed or followed, a self-canonical without any query, and no referrer,
 * so a checkout id can never travel to another site.
 */
export function checkoutReturnMetadata(locale: string, path: "/success" | "/cancel", title: string): Metadata {
  return {
    title,
    alternates: { canonical: `https://trytoone.com/${locale}${path}` },
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

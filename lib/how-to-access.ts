import type { Metadata } from "next";

/**
 * /how-to is for signed-in accounts only, so no guide is indexed or followed
 * (and none is listed in sitemap.xml).
 */
export const GUIDE_ROBOTS: NonNullable<Metadata["robots"]> = { index: false, follow: false };

/** Metadata for the sign-in wall: nothing about the guide behind it. */
export function GATED_GUIDE_METADATA(path: string): Metadata {
  return {
    title: { absolute: "Product guide | Toone" },
    description: "Sign in to read Toone's product guides.",
    alternates: { canonical: `https://trytoone.com/en${path}` },
    robots: GUIDE_ROBOTS,
  };
}

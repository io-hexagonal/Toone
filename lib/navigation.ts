import { createElement, type ComponentProps } from "react";
import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

const navigation = createNavigation(routing);

export const { redirect, usePathname, useRouter } = navigation;

/**
 * Routes that only exist in English. Every other locale's page for these
 * paths is a 308 to `/en/…`, so a locale-prefixed link to them is a link to a
 * redirect (Ahrefs F01, TECH-020/021). Keep in sync with the pages that call
 * `permanentRedirect("/en/…")` for non-English locales.
 */
const ENGLISH_ONLY_PATHS = [
  "/about",
  "/contact",
  "/editorial-policy",
  "/how-to",
  "/journal",
  "/privacy",
  "/terms",
];

function isEnglishOnly(href: ComponentProps<typeof navigation.Link>["href"]) {
  const pathname = typeof href === "string" ? href : href.pathname;
  if (!pathname) return false;
  const path = pathname.split(/[?#]/)[0];
  return ENGLISH_ONLY_PATHS.some(
    (base) => path === base || path.startsWith(`${base}/`),
  );
}

/**
 * next-intl's Link, except English-only routes always resolve to `/en/…`
 * instead of the current locale's redirecting URL.
 */
export function Link(props: ComponentProps<typeof navigation.Link>) {
  return createElement(navigation.Link, {
    ...props,
    locale: props.locale ?? (isEnglishOnly(props.href) ? "en" : undefined),
  });
}

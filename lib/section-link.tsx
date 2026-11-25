"use client";

import { createElement, type ComponentProps, type MouseEvent } from "react";
import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";
import { isStrictPath } from "@/lib/csp";

const navigation = createNavigation(routing);

/**
 * True when following a link to `href` must load a new document instead of
 * navigating in place: it goes to a strict-CSP section (lib/csp.ts) of this
 * site while the current document was served with the static policy (no
 * nonce on its scripts). A browser applies a document's CSP for its whole
 * life, so a client-side navigation would render the strict page under the
 * static policy.
 */
export function needsFullLoad(href: string, origin: string, documentHasNonce: boolean): boolean {
  if (documentHasNonce) return false;
  let url: URL;
  try {
    url = new URL(href, origin);
  } catch {
    return false;
  }
  return url.origin === origin && isStrictPath(url.pathname);
}

/** Pages served with the strict policy carry the nonce on Next's scripts. */
export function documentHasNonce(): boolean {
  return document.querySelector("script[nonce]") !== null;
}

/** Navigates in place, except into a strict section from a static page: then a full load. */
export function hardNavigateIfStrict(href: string): boolean {
  if (!needsFullLoad(href, window.location.origin, documentHasNonce())) return false;
  window.location.assign(new URL(href, window.location.origin).href);
  return true;
}

/** next-intl's Link, with the full-load rule above for plain left clicks. */
export default function SectionLink(props: ComponentProps<typeof navigation.Link>) {
  const { onClick } = props;
  return createElement(navigation.Link, {
    ...props,
    onClick(event: MouseEvent<HTMLAnchorElement>) {
      onClick?.(event);
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.currentTarget;
      if (anchor.target && anchor.target !== "_self") return;
      if (needsFullLoad(anchor.href, window.location.origin, documentHasNonce())) {
        event.preventDefault();
        window.location.assign(anchor.href);
      }
    },
  });
}

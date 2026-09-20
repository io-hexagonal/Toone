import type { Announcement, AnnouncementRepeat, AnnouncementRoutes } from "@/content/announcements";

const STORAGE_PREFIX = "toone.announcement.";

/** Strips the language prefix so routes can be written once for all locales. */
export function localeRelativePath(pathname: string): string {
  return pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
}

export function matchesRoute(routes: AnnouncementRoutes, pathname: string): boolean {
  if (routes === "all") return true;
  const path = localeRelativePath(pathname).replace(/\/$/, "") || "/";
  return routes.some(route => {
    if (route.endsWith("/*")) {
      const base = route.slice(0, -2) || "/";
      return path === base || path.startsWith(base === "/" ? "/" : base + "/");
    }
    return path === (route.replace(/\/$/, "") || "/");
  });
}

/** The first announcement active at `now` on this page. */
export function activeAnnouncement(list: Announcement[], now: number, pathname: string): Announcement | null {
  return list.find(item => {
    const start = Date.parse(item.startsAt);
    const end = Date.parse(item.endsAt);
    return !Number.isNaN(start) && !Number.isNaN(end) && start <= now && now <= end && matchesRoute(item.routes, pathname);
  }) ?? null;
}

function dismissalKey(item: Pick<Announcement, "id" | "version">) {
  return `${STORAGE_PREFIX}${item.id}.v${item.version}`;
}

function storageFor(repeat: AnnouncementRepeat): Storage | null {
  try {
    if (repeat === "once") return window.localStorage;
    if (repeat === "every-session") return window.sessionStorage;
  } catch { /* storage blocked: behave like every-visit */ }
  return null;
}

export function wasDismissed(item: Pick<Announcement, "id" | "version" | "repeat">): boolean {
  try { return storageFor(item.repeat)?.getItem(dismissalKey(item)) === "1"; } catch { return false; }
}

export function rememberDismissal(item: Pick<Announcement, "id" | "version" | "repeat">) {
  try { storageFor(item.repeat)?.setItem(dismissalKey(item), "1"); } catch { /* private mode: show again next time */ }
}

/**
 * True on a real Mac. Chromium reports the platform directly; Safari and
 * Firefox need the user agent. iPads call themselves Macs in Safari, so a
 * touch screen rules them out.
 */
export function isMacDesktop(): boolean {
  const data = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  if (data?.platform) return data.platform === "macOS";
  return /Macintosh|Mac OS X/.test(navigator.userAgent) && navigator.maxTouchPoints <= 1;
}

/** Scrolls to and focuses the early-access email field when the page has one. */
export function focusEarlyAccessInput(): boolean {
  const input = document.querySelector<HTMLInputElement>("[data-early-access-input]");
  if (!input) return false;
  input.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => input.focus({ preventScroll: true }), 350);
  return true;
}

/** Whole calendar days between today and the end date, in the visitor's timezone. */
export function daysLeft(endsAt: string, now: number) {
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const end = new Date(endsAt); end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((end.getTime() - today.getTime()) / 86_400_000));
}

export function track(event: string) {
  (window as unknown as { umami?: { track: (name: string) => void } }).umami?.track(event);
}

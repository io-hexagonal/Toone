/**
 * `?return=app` on the account page: the Stripe billing page (opened from
 * the desktop app) sends the person back here. The page then offers "Return
 * to Toone" first, with or without a web session.
 */

type ReturnWindow = {
  location: { pathname: string; search: string; hash: string };
  history: { state: unknown; replaceState(data: unknown, unused: string, url?: string | URL | null): void };
};

/** True when the address carries `return=app`; the parameter is removed from the address either way. */
export function takeAppReturn(win: ReturnWindow | undefined): boolean {
  if (!win) return false;
  const params = new URLSearchParams(win.location.search);
  if (!params.has("return")) return false;
  const fromApp = params.get("return") === "app";
  params.delete("return");
  const rest = params.toString();
  win.history.replaceState(win.history.state, "", `${win.location.pathname}${rest ? `?${rest}` : ""}${win.location.hash}`);
  return fromApp;
}

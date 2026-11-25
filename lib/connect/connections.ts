/**
 * The account's connected apps (`/en/connections`): assistants such as Claude
 * that the person allowed on /connect. Bearer-authenticated; no cookies.
 *
 * `GET /v1/me/connector/connections` lists them and
 * `DELETE /v1/me/connector/connections/{id}` ends one and all its tokens.
 */

import { authedRequest } from "@/lib/api";
import type { AccessMode, Scope } from "./consent";

export type Connection = {
  id: string;
  /** What the app called itself. Never shown without where it sends codes. */
  clientName: string;
  redirectHost: string;
  scopes: Scope[];
  /** RFC 3339; empty when the API sent nothing readable. */
  createdAt: string;
  lastUsedAt: string;
  accessMode: AccessMode;
};

const text = (value: unknown) => (typeof value === "string" ? value : "");
const CONNECTION_ID = /^[A-Za-z0-9_-]{1,80}$/;

export function normalizeConnections(raw: unknown): Connection[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const entry = (item ?? {}) as Record<string, unknown>;
    const id = text(entry.id);
    if (!CONNECTION_ID.test(id)) return [];
    const scopes = Array.isArray(entry.scopes)
      ? entry.scopes.filter((scope): scope is Scope => scope === "read" || scope === "act")
      : [];
    return [{
      id,
      clientName: text(entry.client_name).trim(),
      redirectHost: text(entry.redirect_host).trim().toLowerCase(),
      scopes,
      createdAt: text(entry.created_at),
      lastUsedAt: text(entry.last_used_at),
      accessMode: entry.access_mode === "auto" ? "auto" : "ask",
    }];
  });
}

export async function listConnections(token: string): Promise<Connection[]> {
  return normalizeConnections(await authedRequest<unknown>(token, "/me/connector/connections"));
}

export async function disconnect(token: string, id: string): Promise<void> {
  if (!CONNECTION_ID.test(id)) throw new Error("invalid connection id");
  await authedRequest<void>(token, `/me/connector/connections/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** "Claude (claude.ai)", or the app's own name with where it sends codes. */
export function connectionLabel(connection: Pick<Connection, "clientName" | "redirectHost">): string {
  const host = connection.redirectHost || "an unknown address";
  // Only Claude's own callbacks (claude.ai, claude.com) are allowed for it, so the host vouches.
  if (host === "claude.ai" || host === "claude.com") return `Claude (${host})`;
  return connection.clientName ? `${connection.clientName} (${host})` : `An app (${host})`;
}

/** "25 November 2026", or empty for an unreadable date. */
export function formatConnectionDate(value: string, locale = "en-GB"): string {
  const at = Date.parse(value);
  if (!Number.isFinite(at) || at <= 0) return "";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(at);
}

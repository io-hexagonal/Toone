/** Typed client for account authentication and private desktop downloads. */

const DEFAULT_API_BASE = "https://api.trytoone.com/v1";

const SESSION_KEY = "toone.session";

export function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE;
}

/** Error codes: invalid_input (400), unauthorized (401), already_exists (409), rate_limit_exceeded (429). */
export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export type ToneUser = {
  /** Public @handle, empty until claimed. */
  handle?: string;
  id: string;
  email: string;
  name: string;
};

export type ToneSession = {
  token: string;
  /** RFC3339 */
  expiresAt: string;
  user: ToneUser;
};

/* ---- raw backend shapes (Capitalized keys — do not leak past this file) */

type RawUser = {
  ID: string;
  Email: string;
  Name: string;
  Handle?: string;
  AvatarURL?: string;
  Provider?: string;
  ProviderID?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
};

type RawSession = {
  UserID: string;
  Token: string;
  ExpiresAt: string;
  IssuedAt: string;
};

type RawAuthPayload = {
  User: RawUser;
  Session: RawSession;
  IsNewUser?: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, init);
  if (res.status === 204) return undefined as T;

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON body (proxy error page etc.) — handled below
  }

  if (!res.ok) {
    const err = (body ?? {}) as { code?: string; message?: string };
    throw new ApiError(
      err.code ?? "unknown",
      err.message ?? `Request failed (${res.status})`,
      res.status,
    );
  }

  return (body as { data: T }).data;
}

function jsonPost(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function normalizeSession(raw: RawAuthPayload): ToneSession {
  return {
    token: raw.Session.Token,
    expiresAt: raw.Session.ExpiresAt,
    user: {
      id: raw.User.ID,
      email: raw.User.Email,
      name: raw.User.Name,
      handle: raw.User.Handle || "",
    },
  };
}

/* ---- session persistence */

export function saveSession(session: ToneSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // storage full / private mode — the in-memory session still works
  }
}

export function loadSession(): ToneSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ToneSession;
    if (!parsed?.token || !parsed?.user?.email) return null;
    const expiresAt = Date.parse(parsed.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

/* ---- auth calls (each stores the session on success) */

export type InvitationPreview = { valid: boolean; shared: boolean; label: string; expires_at: string };

/** Confirms a code is still redeemable without consuming it; 403 invalid_invitation otherwise. */
export async function checkInvitation(code: string): Promise<InvitationPreview> {
  return request<InvitationPreview>("/auth/invite/check", { ...jsonPost({ code }), cache: "no-store" });
}

export async function signupInvitation(email: string, password: string, name: string, code: string): Promise<ToneSession> {
 const raw = await request<RawAuthPayload>("/auth/invite", jsonPost({ email, password, name, code }));
 const session = normalizeSession(raw);
 saveSession(session);
 return session;
}

type RawDesktopDownload = { URL: string; ExpiresAt: string };

/**
 * Asks the backend to broker a short-lived signed link to the private release asset.
 * Fails with 503 when the broker is not configured; callers fall back to the stream.
 */
export async function resolveDesktopDownload(token: string, variant: "standard" | "liquid-glass"): Promise<{ url: string; expiresAt: string }> {
  const raw = await request<RawDesktopDownload>(`/downloads/desktop/${variant}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
  });
  return { url: raw.URL, expiresAt: raw.ExpiresAt };
}

export async function downloadDesktop(token: string, variant: "standard" | "liquid-glass"): Promise<Blob> {
 const res = await fetch(`${apiBase()}/downloads/desktop/${variant}/file`, {
  headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
 });
 if (!res.ok) {
  const error = await res.json().catch(() => ({}));
  throw new ApiError(error.code || "unknown", error.message || "Download unavailable", res.status);
 }
 return res.blob();
}

export async function loginEmail(
  email: string,
  password: string,
): Promise<ToneSession> {
  const raw = await request<RawAuthPayload>(
    "/auth/email/login",
    jsonPost({ email, password }),
  );
  const session = normalizeSession(raw);
  saveSession(session);
  return session;
}

/** Google sign-in; with an invitation code a brand-new identity may register while signup is closed. */
export async function loginGoogle(idToken: string, code?: string): Promise<ToneSession> {
  const raw = await request<RawAuthPayload>(
    "/auth/google",
    jsonPost(code ? { id_token: idToken, code } : { id_token: idToken }),
  );
  const session = normalizeSession(raw);
  saveSession(session);
  return session;
}

export async function getMe(token: string): Promise<ToneUser> {
  const raw = await request<RawUser>("/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { id: raw.ID, email: raw.Email, name: raw.Name, handle: raw.Handle || "" };
}

/** Claims the public @handle for the signed-in account and refreshes the stored session. */
export async function claimHandle(session: ToneSession, handle: string): Promise<ToneSession> {
  const raw = await request<RawUser>("/me/handle", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
    body: JSON.stringify({ handle }),
    cache: "no-store",
  });
  const updated = { ...session, user: { ...session.user, handle: raw.Handle || "" } };
  saveSession(updated);
  return updated;
}

export type InvitationRecord = {
  id: string;
  recipient_name: string;
  code_hint: string;
  status: "pending" | "redeemed" | "expired" | "revoked";
  email: string;
  user_id: string;
  account_name: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  /** 0 means unlimited; 1 is a personal single-use code. */
  max_uses: number;
  use_count: number;
};

export type CreatedInvitation = {
  id: string;
  recipient_name: string;
  code: string;
  expires_at: string;
  /** 0 means unlimited; 1 is a personal single-use code. */
  max_uses: number;
  signup_url: string;
  /** Delivery address given at creation, when any. */
  email?: string;
  /** True when the server handed an email to the mailer (delivery is best-effort). */
  email_queued?: boolean;
};

export async function canManageInvitations(token: string): Promise<boolean> {
  const result = await request<{ capabilities: string[] }>("/me/capabilities", {
    headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
  });
  return result.capabilities.includes("invitation.manage");
}

export async function listInvitations(token: string): Promise<InvitationRecord[]> {
  return request<InvitationRecord[]>("/admin/invitations", {
    headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
  });
}

export async function createInvitation(
  token: string,
  input: { recipient_name: string; code: string; days: number; max_uses?: number; expires_at?: string; email?: string },
): Promise<CreatedInvitation> {
  return request<CreatedInvitation>("/admin/invitations", {
    ...jsonPost(input),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}

/** Stops an invitation from admitting further signups; accounts already created keep working. */
export async function revokeInvitation(token: string, id: string): Promise<void> {
  await request<void>(`/admin/invitations/${encodeURIComponent(id)}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
  });
}

export async function logout(token: string): Promise<void> {
  try {
    // Best-effort server-side revocation — the local session is cleared
    // regardless of the outcome.
    await request<void>("/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // network error / already-expired token — nothing actionable
  } finally {
    clearSession();
  }
}

export type EarlyAccessRequest = {
  id: string;
  email: string;
  source: string;
  created_at: string;
  /** Set once an administrator has sent an invitation for this request. */
  invitation_id?: string;
  invited_at?: string;
};

export type EarlyAccessRequestStatus = "" | "pending" | "invited";

export type EarlyAccessRequestPage = {
  entries: EarlyAccessRequest[];
  has_more: boolean;
  limit: number;
};

export async function listEarlyAccessRequests(
  token: string, search: string, status: EarlyAccessRequestStatus, offset: number, signal?: AbortSignal,
): Promise<EarlyAccessRequestPage> {
  const query = new URLSearchParams({ search, status, offset: String(offset) });
  return request<EarlyAccessRequestPage>(`/admin/waitlist?${query}`, {
    headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal,
  });
}

/** Issues a personal invitation for one request and emails it to the requester. */
export async function inviteEarlyAccessRequest(token: string, id: string): Promise<CreatedInvitation> {
  return request<CreatedInvitation>(`/admin/waitlist/${encodeURIComponent(id)}/invite`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
  });
}

/**
 * Tiny typed client for the Toone auth API (Go backend, hexagonal).
 *
 * Base URL comes from NEXT_PUBLIC_API_BASE_URL and defaults to the
 * api.truleaf.org route — the only DNS-live path to the backend today.
 * Success responses are `{"data": {...}}` with Go-style Capitalized keys
 * (structs without json tags); this module is the boundary where those get
 * normalized to lowercase, and where the session is persisted to
 * localStorage under `toone.session`.
 */

const DEFAULT_API_BASE = "https://api.truleaf.org/api/v1/toone";

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

export async function signupEmail(
  email: string,
  password: string,
  name?: string,
): Promise<ToneSession> {
  const raw = await request<RawAuthPayload>(
    "/auth/email/signup",
    jsonPost({ email, password, ...(name ? { name } : {}) }),
  );
  const session = normalizeSession(raw);
  saveSession(session);
  return session;
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

export async function loginGoogle(idToken: string): Promise<ToneSession> {
  const raw = await request<RawAuthPayload>(
    "/auth/google",
    jsonPost({ id_token: idToken }),
  );
  const session = normalizeSession(raw);
  saveSession(session);
  return session;
}

export async function getMe(token: string): Promise<ToneUser> {
  const raw = await request<RawUser>("/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { id: raw.ID, email: raw.Email, name: raw.Name };
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

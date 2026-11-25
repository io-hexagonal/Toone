import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiBase } from "@/lib/api";
import { clientIp, createRateLimiter, honeypotFilled, originAllowed } from "@/lib/contact-guard";

// Share the auth API configuration. The legacy WAITLIST_UPSTREAM override can
// silently send this form to a retired host while the rest of the site works.
const UPSTREAM = `${apiBase().replace(/\/$/, "")}/waitlist`;

/**
 * Same abuse guards as `/api/contact` (lib/contact-guard.ts): a foreign
 * `Origin` gets 403, more than 5 requests per visitor IP in 10 minutes get 429
 * (in memory, per serverless instance: best effort), and a filled honeypot
 * looks like success without reaching the API.
 *
 * The visitor's IP goes upstream in `X-Forwarded-For`. The API keys its own
 * limit on the nearest hop it does not trust (Vercel's egress address), so it
 * cannot be steered by a header; the per-visitor limit here is what keeps one
 * client from using up the shared upstream budget.
 *
 * New and already-registered addresses get the same answer, so the form does
 * not reveal who is on the waitlist.
 */
const limiter = createRateLimiter();

function joined(source: string) {
  return NextResponse.json(
    {
      message: "Added to waitlist",
      outcome_id: randomUUID(),
      outcome_state: "created",
      source,
    },
    { status: 201 },
  );
}

export async function POST(req: NextRequest) {
  if (!originAllowed(req.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ip = clientIp(req.headers);
  if (!limiter.allow(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }
  try {
    const body = await req.json().catch(() => null);
    const email = body?.email;
    const source = body?.source;

    if (typeof email !== "string" || email.trim().length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const normalizedSource = ["desktop", "general", "hero-auth", "web"].includes(
      source,
    )
      ? source
      : "general";

    // A bot filled the hidden field: look like success, send nothing.
    if (honeypotFilled(body)) return joined(normalizedSource);

    const res = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ip !== "unknown" ? { "X-Forwarded-For": ip } : {}),
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        source: normalizedSource,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    // Created and duplicate answer alike (no waitlist membership oracle).
    if (res.status === 201 || res.status === 409) return joined(normalizedSource);

    if (res.status === 400) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (res.status === 429) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
    console.error(`[waitlist] Upstream responded ${res.status}`);
    return NextResponse.json({ error: "Server error" }, { status: 502 });
  } catch (err) {
    const timeout = err instanceof Error && err.name === "TimeoutError";
    console.error("[waitlist] Upstream unavailable", { timeout });
    return NextResponse.json({ error: "Server error" }, { status: timeout ? 504 : 502 });
  }
}

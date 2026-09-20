import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiBase } from "@/lib/api";

// Share the auth API configuration. The legacy WAITLIST_UPSTREAM override can
// silently send this form to a retired host while the rest of the site works.
const UPSTREAM = `${apiBase().replace(/\/$/, "")}/waitlist`;

export async function POST(req: NextRequest) {
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

    const res = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        source: normalizedSource,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 201) {
      return NextResponse.json(
        {
          message: "Added to waitlist",
          outcome_id: randomUUID(),
          outcome_state: "created",
          source: normalizedSource,
        },
        { status: 201 },
      );
    }

    // A duplicate is still visitor-visible success, but the distinct outcome
    // prevents the client from counting it as a new signup.
    if (res.status === 409) {
      return NextResponse.json({
        message: "Already registered",
        outcome_state: "already_registered",
        source: normalizedSource,
      });
    }

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

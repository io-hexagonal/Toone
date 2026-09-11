import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

/** Forward early-access requests to the configured Toone waitlist endpoint. */
const UPSTREAM = process.env.WAITLIST_UPSTREAM || "https://api.trytoone.com/v1/waitlist";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email;
    const source = body?.source;

    if (!email || typeof email !== "string" || !email.includes("@")) {
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

    console.error(`[waitlist] Upstream responded ${res.status}`);
    return NextResponse.json({ error: "Server error" }, { status: 502 });
  } catch (err) {
    console.error("[waitlist] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

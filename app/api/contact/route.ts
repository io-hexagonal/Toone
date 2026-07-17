import { NextRequest, NextResponse } from "next/server";

/**
 * Forwards contact-modal submissions to the team's Discord channel via an
 * incoming webhook. DISCORD_WEBHOOK_URL is a server-side Vercel env var (the
 * URL embeds the credential, so it must never be NEXT_PUBLIC_*).
 */
const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

/** Discord hard-caps embed field values at 1024 chars. */
function clip(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const company = typeof body?.company === "string" ? body.company.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const source = typeof body?.source === "string" && body.source ? body.source : "landing";

    if (!name || !message || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (!WEBHOOK) {
      console.error("[contact] DISCORD_WEBHOOK_URL is not configured");
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const fields = [
      { name: "Name", value: clip(name, 1024), inline: true },
      { name: "Email", value: clip(email, 1024), inline: true },
    ];
    if (company) fields.push({ name: "Company", value: clip(company, 1024), inline: true });
    fields.push({ name: "Message", value: clip(message, 1024), inline: false });
    fields.push({ name: "Source", value: clip(source, 1024), inline: true });

    const res = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "💬 New contact from trytoone.com",
            color: 0xf0ede6,
            fields,
          },
        ],
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(`[contact] Discord webhook responded ${res.status}`);
      return NextResponse.json({ error: "Server error" }, { status: 502 });
    }

    return NextResponse.json({ message: "Sent" });
  } catch (err) {
    console.error("[contact] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

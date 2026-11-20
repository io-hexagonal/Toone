import { NextRequest, NextResponse } from "next/server";
import { GOODWILL_REFUND_KIND, goodwillDiscordMessage, goodwillRefundFrom } from "@/lib/billing/goodwill-refund";

/**
 * Forwards contact-modal submissions to the team's Discord channel via an
 * incoming webhook. DISCORD_WEBHOOK_URL is a server-side Vercel env var (the
 * URL embeds the credential, so it must never be NEXT_PUBLIC_*).
 *
 * A body with `kind: "goodwill_refund"` is a goodwill refund request for
 * Toone Pro Lifetime from /cancel-contract#goodwill-refund
 * (lib/billing/goodwill-refund.ts): it is checked again here and posted as
 * its own structured message. Any other body is a contact message, as before.
 */
const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

/** Discord hard-caps embed field values at 1024 chars. */
function clip(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Posts a goodwill refund request to Discord; 400 for invalid input, 500/502 when it could not be delivered. */
async function goodwillRefund(body: Record<string, unknown>) {
  const checked = goodwillRefundFrom(body);
  if (!checked.ok) {
    return NextResponse.json({ error: "Invalid input", field: checked.error }, { status: 400 });
  }
  if (!WEBHOOK) {
    console.error("[contact] DISCORD_WEBHOOK_URL is not configured");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
  const res = await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(goodwillDiscordMessage(checked.request, new Date())),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    console.error(`[contact] Discord webhook responded ${res.status} (goodwill refund request)`);
    return NextResponse.json({ error: "Server error" }, { status: 502 });
  }
  return NextResponse.json({ message: "Sent" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body?.kind === GOODWILL_REFUND_KIND) return await goodwillRefund(body);
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

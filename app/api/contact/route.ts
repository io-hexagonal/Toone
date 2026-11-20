import { NextRequest, NextResponse } from "next/server";
import { GOODWILL_REFUND_KIND, goodwillDiscordMessage, goodwillRefundFrom } from "@/lib/billing/goodwill-refund";
import { clientIp, createRateLimiter, honeypotFilled, originAllowed } from "@/lib/contact-guard";

/**
 * Forwards contact-modal submissions to the team's Discord channel via an
 * incoming webhook. DISCORD_WEBHOOK_URL is a server-side Vercel env var (the
 * URL embeds the credential, so it must never be NEXT_PUBLIC_*).
 *
 * A body with `kind: "goodwill_refund"` is a goodwill refund request for
 * Toone Pro Lifetime from /cancel-contract#goodwill-refund
 * (lib/billing/goodwill-refund.ts): it is checked again here and posted as
 * its own structured message. Any other body is a contact message, as before.
 *
 * Abuse guards (lib/contact-guard.ts), in order: a foreign `Origin` is
 * refused (403); more than 5 requests per IP in 10 minutes get a 429 (kept in
 * memory, so per serverless instance: best effort only); a filled honeypot
 * answers 200 without posting. Every Discord body sets `allowed_mentions`
 * to parse nothing, so user text can never ping @everyone, @here or a role.
 */
const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

const limiter = createRateLimiter();

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
  if (!originAllowed(req.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!limiter.allow(clientIp(req.headers))) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }
  try {
    const body = await req.json();
    // A bot filled the hidden field: look like success, post nothing.
    if (honeypotFilled(body)) return NextResponse.json({ message: "Sent" });
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
        allowed_mentions: { parse: [] },
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

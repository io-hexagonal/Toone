import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const WAITLIST_FILE = path.join(process.cwd(), "data", "waitlist.json");

interface WaitlistEntry {
  email: string;
  source: string;
  timestamp: string;
}

async function readWaitlist(): Promise<WaitlistEntry[]> {
  try {
    const data = await fs.readFile(WAITLIST_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeWaitlist(entries: WaitlistEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(WAITLIST_FILE), { recursive: true });
  await fs.writeFile(WAITLIST_FILE, JSON.stringify(entries, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email;
    const source = body?.source;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const sanitized = email.toLowerCase().trim();

    const entries = await readWaitlist();

    if (entries.some((e) => e.email === sanitized)) {
      return NextResponse.json({ message: "Already registered" });
    }

    entries.push({
      email: sanitized,
      source: source || "unknown",
      timestamp: new Date().toISOString(),
    });

    await writeWaitlist(entries);

    console.log(`[waitlist] New signup: ${sanitized} (${source})`);

    return NextResponse.json({ message: "Added to waitlist" });
  } catch (err) {
    console.error("[waitlist] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

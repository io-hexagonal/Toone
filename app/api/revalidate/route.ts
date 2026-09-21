import { revalidateTag } from "next/cache";
import {
  parseRevalidateEvent,
  verifySignature,
} from "@/lib/explore/revalidation";

/**
 * Server -> web revalidation webhook (contract §9).
 * 401 on a missing or wrong signature, 400 on a signed but malformed body,
 * 413 on an oversized body, 503 when the secret is not configured.
 */

export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.EXPLORE_REVALIDATE_SECRET;
  if (!secret) return Response.json({ revalidated: false }, { status: 503 });
  // Bound even chunked request bodies before buffering them in memory.
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ revalidated: false }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 8192) {
      await reader.cancel();
      return Response.json({ revalidated: false }, { status: 413 });
    }
    chunks.push(value);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!verifySignature(raw, request.headers.get("x-explore-signature"), secret))
    return Response.json({ revalidated: false }, { status: 401 });
  const event = parseRevalidateEvent(raw);
  if (!event) return Response.json({ revalidated: false }, { status: 400 });
  revalidateTag("explore", { expire: 0 });
  revalidateTag(`explore:${event.slug}`, { expire: 0 });
  revalidateTag(`explore:${event.id}`, { expire: 0 });
  return Response.json({ revalidated: true });
}

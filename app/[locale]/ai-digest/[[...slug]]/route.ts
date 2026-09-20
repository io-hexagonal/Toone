/**
 * The `/ai-digest/*` tree was retired. Google still holds ~2,663
 * crawled-not-indexed URLs under it (GSC, 2026-09-20) and a bare 404 keeps
 * them in that bucket. There is no same-intent replacement, so a 308 would be
 * a soft redirect to an unrelated page: return 410 Gone instead and let the
 * tree drain (audit P1-6, remediation R3).
 */
export const dynamic = "force-dynamic";

const BODY = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Gone | Toone</title></head>
<body><h1>Gone</h1><p>The Toone AI digest has been retired. Start at <a href="https://trytoone.com/en">trytoone.com</a>.</p></body></html>`;

function gone() {
  return new Response(BODY, {
    status: 410,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function GET() {
  return gone();
}

export async function HEAD() {
  return gone();
}

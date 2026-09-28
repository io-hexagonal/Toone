import { NextRequest, NextResponse } from "next/server";

/**
 * Return URL registered on the Sign in with Apple Services ID
 * (NEXT_PUBLIC_APPLE_REDIRECT_URI). The site uses Apple JS in popup mode, so
 * Apple hands the result to the opener page and normally never navigates
 * here. If a browser does land here (Apple's `form_post`, or a direct visit),
 * the body — which can carry an identity token and a single-use authorization
 * code — is never read, stored or logged; the visitor is sent to sign-in.
 */
function toSignIn(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/signin", req.url), 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export function GET(req: NextRequest) {
  return toSignIn(req);
}

export function POST(req: NextRequest) {
  return toSignIn(req);
}

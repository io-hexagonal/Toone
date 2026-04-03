export function GET() {
  return new Response(
    "google-site-verification: google90ae4607f81bae7d.html",
    { headers: { "Content-Type": "text/html" } },
  );
}

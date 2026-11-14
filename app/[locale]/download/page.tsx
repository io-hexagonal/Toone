import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { launchRedirect } from "@/lib/launch-routes";
import { SITE_SESSION_COOKIE } from "@/lib/site-session-cookie";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * /download is a request-time redirect, never a page. proxy.ts answers it on
 * every request (lib/launch-routes.ts); this is the fallback with the same
 * answer: before the launch the access request, after it the downloads grid
 * for a signed-in visitor and sign-up (back to the grid) for everyone else.
 * Explore attribution (`?from=explore&item=…`) is kept either way.
 */
export default async function Download({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }
  const signedIn = Boolean((await cookies()).get(SITE_SESSION_COOKIE)?.value);
  const answer = launchRedirect(`/${locale}/download`, query, { signedIn });
  redirect(answer?.location ?? `/${locale}/downloads`);
}

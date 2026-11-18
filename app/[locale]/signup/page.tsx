import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
/**
 * Sign-up is open since the public launch (2026-11-18): `/signup` leads to the
 * open sign-up at `/create-account`, keeping any query (for example `next`, the
 * page to return to). Temporary (307) while the final address for these legacy
 * paths is open; a settled move becomes a 308 (TECH-020).
 */
export default async function Redirect({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const v of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, v);
  }
  const qs = query.toString();
  redirect(`/${locale}/create-account${qs ? `?${qs}` : ""}`);
}

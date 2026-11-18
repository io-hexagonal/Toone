import { redirect } from "next/navigation";
import { accessAttribution } from "@/lib/explore/presentation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
/**
 * `/download` is the address directories, Product Hunt and older Explore links
 * use. Since the public launch (2026-11-18) it leads to the open sign-up, not
 * the early-access request. Temporary (307) while the final address for
 * these legacy paths is open; a settled move becomes a 308 (TECH-020).
 */
export default async function Redirect({ params, searchParams }: Props) {
  const { locale } = await params;
  const { from, item } = await searchParams;
  // Keep Explore attribution (older links use /download?from=explore).
  const query = new URLSearchParams(accessAttribution(from, item)).toString();
  redirect(`/${locale}/create-account${query ? `?${query}` : ""}`);
}

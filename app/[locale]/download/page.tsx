import { permanentRedirect } from "next/navigation";
import { accessAttribution } from "@/lib/explore/presentation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export default async function Redirect({ params, searchParams }: Props) {
  const { locale } = await params;
  const { from, item } = await searchParams;
  // Keep Explore attribution (older links use /download?from=explore).
  const query = new URLSearchParams(accessAttribution(from, item)).toString();
  permanentRedirect(`/${locale}/request-access${query ? `?${query}` : ""}`);
}

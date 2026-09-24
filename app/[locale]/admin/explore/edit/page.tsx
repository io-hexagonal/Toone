import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import ListingEditPage from "@/components/explore/admin/ListingEditPage";

export const metadata: Metadata = {
  title: "Edit listing",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** `?kind=routine|bundle&id=<id or slug>`; read on the client (useSearchParams). */
export default async function ExploreListingEdit({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={null}>
      <ListingEditPage />
    </Suspense>
  );
}

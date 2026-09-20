import { permanentRedirect } from "next/navigation";
export default async function Redirect({ params }: { params: Promise<{ locale: string }> }) {
 const { locale } = await params;
 permanentRedirect(`/${locale}/request-access`);
}

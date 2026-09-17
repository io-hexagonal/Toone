import { permanentRedirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function LegacyProductGuideRoute({ params }: Props) {
  const { slug } = await params;
  permanentRedirect(`/en/how-to/${slug.join("/")}`);
}

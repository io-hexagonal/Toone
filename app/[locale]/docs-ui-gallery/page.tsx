import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ToonUiFigure from "@/components/docs-ui/ToonUiFigure";
import { SCENES } from "@/components/docs-ui/registry";

/**
 * Dev-only review gallery for the docs UI figures (components/docs-ui).
 * Renders every registered scene on the cream guide background at the guide's
 * column width. Production builds return 404.
 */

export const metadata: Metadata = {
  title: { absolute: "Docs UI figures (dev gallery)" },
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ locale: string }> };

export default async function DocsUiGalleryPage({ params }: Props) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  const scenes = Object.values(SCENES);

  return (
    <main style={{ minHeight: "100vh", background: "#f0ede6", color: "#1d1c19", padding: "48px 24px 96px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 620, letterSpacing: "-0.025em" }}>
          Docs UI figures
        </h1>
        <p style={{ margin: "0 0 40px", color: "#6e6a62", fontSize: 15 }}>
          {scenes.length} registered scene{scenes.length === 1 ? "" : "s"}. Dev only; this page 404s in production.
          The column is the guide&apos;s 760px article width.
        </p>
        {scenes.map((scene) => (
          <section data-scene={scene.id} id={scene.id} key={scene.id} style={{ marginBottom: 56 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 650, fontFamily: "ui-monospace, Menlo, monospace" }}>
              {scene.id}
            </h2>
            <p style={{ margin: 0, color: "#6e6a62", fontSize: 13 }}>
              natural width {scene.width}px · frame radius {scene.radius}
            </p>
            <ToonUiFigure id={scene.id} />
          </section>
        ))}
      </div>
    </main>
  );
}

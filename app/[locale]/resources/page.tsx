import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { Link } from "@/lib/navigation";
import { getPublications } from "@/lib/content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const url = "https://trytoone.com/en/resources";
  return {
    title: "Resources for Building an AI-Native Company",
    description: "Practical Toone guides for AI-native operating models, agent governance, evidence, and implementation decisions.",
    alternates: { canonical: url, languages: { en: url, "x-default": url } },
    robots: locale === "en" ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "website",
      url,
      title: "Toone Resources",
      description: "Practical guides for designing AI-native operations with accountable agents.",
      siteName: "Toone",
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}

export default async function ResourcesPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== "en") permanentRedirect("/en/resources");
  setRequestLocale(locale);
  const publications = getPublications();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .resources-page { min-height: 100vh; background: #f0ede6; color: #1d1c19; }
        .resources-hero {
          position: relative; overflow: hidden; padding: 148px 24px 92px;
          background: #141413; color: white;
        }
        .resources-hero::after {
          content: ''; position: absolute; width: 720px; height: 520px;
          right: -180px; top: -160px; border-radius: 50%;
          background: radial-gradient(circle, rgba(113,130,224,0.2), transparent 68%);
        }
        .resources-hero-inner { position: relative; z-index: 1; max-width: 1080px; margin: 0 auto; }
        .resources-eyebrow {
          color: #aebaf4; font-size: 11px; font-weight: 750;
          letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 18px;
        }
        .resources-hero h1 {
          max-width: 12ch; font-size: clamp(46px, 8vw, 82px); line-height: 0.98;
          letter-spacing: -0.055em; font-weight: 620; text-wrap: balance;
        }
        .resources-hero p:last-child {
          max-width: 620px; color: rgba(255,255,255,0.62); font-size: 19px;
          line-height: 1.65; margin-top: 26px;
        }
        .resources-grid {
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px; max-width: 1080px; margin: 0 auto; padding: 82px 24px 120px;
        }
        .resource-card {
          position: relative; display: flex; min-height: 360px; flex-direction: column;
          padding: 34px; color: inherit; text-decoration: none; overflow: hidden;
          border: 1px solid rgba(29,28,25,0.11); border-radius: 22px;
          background: rgba(255,255,255,0.48); transition: transform .25s, border-color .25s;
        }
        .resource-card::after {
          content: ''; position: absolute; width: 260px; height: 260px;
          right: -100px; bottom: -120px; border-radius: 50%;
          background: radial-gradient(circle, rgba(92,124,114,0.16), transparent 68%);
        }
        .resource-card:nth-child(2)::after { background: radial-gradient(circle, rgba(118,104,127,0.16), transparent 68%); }
        .resource-card:hover { transform: translateY(-5px); border-color: rgba(29,28,25,0.3); }
        .resource-card-meta {
          color: rgba(29,28,25,0.48); font-size: 10px; font-weight: 750;
          letter-spacing: .14em; text-transform: uppercase;
        }
        .resource-card h2 {
          position: relative; z-index: 1; max-width: 15ch; margin-top: 48px;
          font-size: clamp(28px, 4vw, 41px); line-height: 1.08;
          letter-spacing: -.04em; font-weight: 640;
        }
        .resource-card p {
          position: relative; z-index: 1; max-width: 52ch; margin-top: 18px;
          color: rgba(29,28,25,0.62); font-size: 14px; line-height: 1.65;
        }
        .resource-card-foot {
          position: relative; z-index: 1; display: flex; gap: 16px; margin-top: auto;
          padding-top: 30px; color: rgba(29,28,25,0.5); font-size: 11px;
        }
        @media (max-width: 740px) {
          .resources-hero { padding-top: 120px; padding-bottom: 70px; }
          .resources-grid { grid-template-columns: 1fr; padding-top: 58px; }
          .resource-card { min-height: 320px; }
        }
      ` }} />
      <div className="resources-page">
        <SiteHeader />
        <header className="resources-hero">
          <div className="resources-hero-inner">
            <p className="resources-eyebrow">Toone field guides</p>
            <h1>Design the work, not only the prompt.</h1>
            <p>Evidence-led guides for encoding company operations, governing agent actions, and deciding where AI belongs.</p>
          </div>
        </header>
        <main className="resources-grid">
          {publications.map((publication) => (
            <Link key={publication.slug} href={publication.canonicalPath} className="resource-card">
              <span className="resource-card-meta">{publication.eyebrow}</span>
              <h2>{publication.title}</h2>
              <p>{publication.description}</p>
              <span className="resource-card-foot">
                <span>{publication.updated}</span>
                <span>{publication.readTime}</span>
              </span>
            </Link>
          ))}
        </main>
        <Footer />
      </div>
    </>
  );
}

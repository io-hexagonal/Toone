import type { Components } from "react-markdown";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { Link } from "@/lib/navigation";
import {
  getTableOfContents,
  headingId,
  type Publication,
} from "@/lib/content";

const markdownComponents: Components = {
  h2: ({ children }) => <h2 id={headingId(String(children))}>{children}</h2>,
  h3: ({ children }) => <h3 id={headingId(String(children))}>{children}</h3>,
  a: ({ href = "", children }) => {
    const external = href.startsWith("http");
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener" : undefined}>
        {children}
      </a>
    );
  },
  img: ({ src = "", alt = "" }) => (
    <Image
      className="article-image"
      src={String(src)}
      alt={alt}
      width={1200}
      height={630}
      sizes="(max-width: 860px) calc(100vw - 48px), 760px"
    />
  ),
};

type Props = { publication: Publication };

export default function ArticlePage({ publication }: Props) {
  const toc = getTableOfContents(publication.body).filter((item) => item.level === 2);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .article-shell { min-height: 100vh; background: #f0ede6; color: #1d1c19; }
            .article-hero {
              position: relative; overflow: hidden; background: #141413;
              padding: 146px 24px 96px; color: white;
            }
            .article-hero::before {
              content: ''; position: absolute; inset: auto auto -300px 50%;
              width: 900px; height: 620px; transform: translateX(-50%);
              background: radial-gradient(circle, rgba(119,139,255,0.16), transparent 66%);
              pointer-events: none;
            }
            .article-hero-inner { position: relative; max-width: 900px; margin: 0 auto; }
            .article-breadcrumb {
              display: flex; flex-wrap: wrap; gap: 8px; color: rgba(255,255,255,0.55);
              font-size: 12px; margin-bottom: 40px;
            }
            .article-breadcrumb a { color: inherit; text-decoration: none; }
            .article-breadcrumb a:hover { color: rgba(255,255,255,0.9); }
            .article-eyebrow {
              color: #aebaf4; font-size: 11px; font-weight: 750;
              letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 18px;
            }
            .article-hero h1 {
              max-width: 18ch; color: rgba(255,255,255,0.97);
              font-size: clamp(42px, 7vw, 74px); line-height: 0.99;
              letter-spacing: -0.052em; font-weight: 620; text-wrap: balance;
            }
            .article-deck {
              max-width: 690px; color: rgba(255,255,255,0.66);
              font-size: clamp(17px, 2vw, 21px); line-height: 1.65; margin-top: 26px;
            }
            .article-byline {
              display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 34px;
              color: rgba(255,255,255,0.5); font-size: 12px;
            }
            .article-layout {
              display: grid; grid-template-columns: minmax(0, 760px) 190px;
              gap: 70px; max-width: 1050px; margin: 0 auto; padding: 92px 24px 120px;
              align-items: start;
            }
            .article-body { min-width: 0; }
            .article-body > p:first-child {
              font-size: 21px; line-height: 1.72; color: rgba(29,28,25,0.82);
            }
            .article-body h2 {
              scroll-margin-top: 30px; margin: 72px 0 20px; color: #1d1c19;
              font-size: clamp(28px, 4vw, 38px); line-height: 1.14;
              letter-spacing: -0.035em; font-weight: 650;
            }
            .article-body h3 {
              scroll-margin-top: 30px; margin: 42px 0 14px; color: #26241f;
              font-size: 22px; line-height: 1.25; letter-spacing: -0.02em;
            }
            .article-body p, .article-body li {
              color: rgba(29,28,25,0.74); font-size: 16.5px; line-height: 1.78;
            }
            .article-body p + p { margin-top: 18px; }
            .article-body ul, .article-body ol { padding-left: 24px; margin: 20px 0; }
            .article-body li + li { margin-top: 9px; }
            .article-body a { color: #334bc0; text-underline-offset: 3px; }
            .article-body a:hover { color: #1e318f; }
            .article-body strong { color: rgba(29,28,25,0.94); }
            .article-body blockquote {
              margin: 28px 0; padding: 20px 24px; border-left: 3px solid #566ccf;
              background: rgba(255,255,255,0.5); border-radius: 0 12px 12px 0;
            }
            .article-body table {
              display: block; width: 100%; overflow-x: auto; margin: 30px 0 38px;
              border-spacing: 0; border: 1px solid rgba(29,28,25,0.13); border-radius: 14px;
              background: rgba(255,255,255,0.46);
            }
            .article-body th, .article-body td {
              min-width: 150px; padding: 14px 16px; text-align: left; vertical-align: top;
              border-bottom: 1px solid rgba(29,28,25,0.1);
              border-right: 1px solid rgba(29,28,25,0.08);
              font-size: 13.5px; line-height: 1.55;
            }
            .article-body th { color: #1d1c19; background: rgba(29,28,25,0.045); font-weight: 700; }
            .article-body tr:last-child td { border-bottom: 0; }
            .article-image {
              width: 100%; height: auto; margin: 32px 0 10px; border-radius: 20px;
              box-shadow: 0 18px 60px rgba(20,19,17,0.1);
            }
            .article-toc { position: sticky; top: 30px; }
            .article-toc-title {
              color: rgba(29,28,25,0.45); font-size: 10px; font-weight: 750;
              letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 16px;
            }
            .article-toc a {
              display: block; color: rgba(29,28,25,0.55); font-size: 12px;
              line-height: 1.45; text-decoration: none; padding: 7px 0;
              border-bottom: 1px solid rgba(29,28,25,0.08);
            }
            .article-toc a:hover { color: #1d1c19; }
            .article-close {
              margin-top: 58px; padding: 32px; border-radius: 18px;
              background: #1d1c19; color: rgba(255,255,255,0.75);
            }
            .article-close h2 { color: white; margin: 0 0 10px; font-size: 24px; }
            .article-close p { color: rgba(255,255,255,0.62); font-size: 14px; }
            .article-close a { display: inline-block; margin-top: 18px; color: white; }
            @media (max-width: 900px) {
              .article-layout { grid-template-columns: 1fr; }
              .article-toc { display: none; }
            }
            @media (max-width: 640px) {
              .article-hero { padding-top: 118px; padding-bottom: 68px; }
              .article-layout { padding-top: 58px; }
              .article-body > p:first-child { font-size: 18px; }
              .article-body p, .article-body li { font-size: 15.5px; }
              .article-body th, .article-body td { min-width: 220px; }
            }
          `,
        }}
      />
      <div className="article-shell">
        <SiteHeader />
        <header className="article-hero">
          <div className="article-hero-inner">
            <nav className="article-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">→</span>
              <Link href="/resources">Resources</Link>
              <span aria-hidden="true">→</span>
              <span aria-current="page">{publication.title}</span>
            </nav>
            <p className="article-eyebrow">{publication.eyebrow}</p>
            <h1>{publication.title}</h1>
            <p className="article-deck">{publication.description}</p>
            <div className="article-byline">
              <span>By {publication.author}</span>
              <span>Published {publication.published}</span>
              <span>Updated {publication.updated}</span>
              <span>{publication.readTime}</span>
            </div>
          </div>
        </header>
        <main className="article-layout">
          <article className="article-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {publication.body}
            </ReactMarkdown>
            <aside className="article-close">
              <h2>Continue with evidence</h2>
              <p>See what currently runs on Toone before deciding whether the operating model fits your work.</p>
              <Link href="/showcases">View Toone showcases</Link>
            </aside>
          </article>
          <aside className="article-toc" aria-label="On this page">
            <p className="article-toc-title">On this page</p>
            {toc.map((item) => (
              <a key={item.id} href={`#${item.id}`}>{item.label}</a>
            ))}
          </aside>
        </main>
        <Footer />
      </div>
    </>
  );
}

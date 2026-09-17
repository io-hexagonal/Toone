import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LandingAudienceBar from "@/components/LandingAudienceBar";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import ProductGuideNavScroll from "./ProductGuideNavScroll";
import {
  PRODUCT_GUIDE_NAV,
  getAdjacentProductGuidePages,
  type ProductGuidePage,
} from "@/lib/product-showcase";
import styles from "./ProductShowcase.module.css";

type Props = {
  locale: string;
  page: ProductGuidePage;
};

type Heading = {
  depth: 2 | 3;
  id: string;
  label: string;
};

function headingId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getHeadings(markdown: string): Heading[] {
  return markdown
    .split("\n")
    .map((line) => {
      const match = /^(##|###)\s+(.+)$/.exec(line);
      if (!match) return null;
      const label = match[2].replace(/[*_`]/g, "").trim();
      return {
        depth: match[1].length as 2 | 3,
        id: headingId(label),
        label,
      };
    })
    .filter((heading): heading is Heading => heading !== null);
}

function textFromChildren(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textFromChildren).join("");
  return "";
}

function guideHref(locale: string, slug: string): string {
  return `/${locale}/how-to${slug ? `/${slug}` : ""}`;
}

function GuideNavigation({ locale, activeSlug }: { locale: string; activeSlug: string }) {
  return (
    <>
      {PRODUCT_GUIDE_NAV.map((section) => (
        <section className={styles.navSection} key={section.title}>
          <p className={styles.navHeading}>{section.title}</p>
          {section.items.map((item) => {
            const active = item.slug === activeSlug;
            return (
              <a
                aria-current={active ? "page" : undefined}
                className={`${styles.navLink} ${item.nested ? styles.navLinkNested : ""} ${active ? styles.navLinkActive : ""}`}
                href={guideHref(locale, item.slug)}
                key={item.slug || "overview"}
              >
                {item.label}
              </a>
            );
          })}
        </section>
      ))}
    </>
  );
}

export default function ProductShowcasePage({ locale, page }: Props) {
  const headings = getHeadings(page.body);
  const adjacent = getAdjacentProductGuidePages(page.slug);

  return (
    <div className={styles.page}>
      <LandingAudienceBar activeAudience="personal" />
      <SiteHeader landingPath="/" showcasesPath="/how-to" scrollThreshold={260} />

      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p className={styles.lede}>{page.description}</p>
        </div>
      </header>

      <main className={styles.readingArea}>
        <aside
          className={styles.sideNav}
          aria-label="Product guide"
          data-product-guide-nav="desktop"
        >
          <ProductGuideNavScroll activeSlug={page.slug} />
          <GuideNavigation locale={locale} activeSlug={page.slug} />
        </aside>

        <article className={styles.article}>
          <details className={styles.mobileNav}>
            <summary>Product guide · {page.navTitle}</summary>
            <div className={styles.mobileNavBody}>
              <GuideNavigation locale={locale} activeSlug={page.slug} />
            </div>
          </details>

          <div className={styles.articleMeta}>
            {page.estimatedTime ? `Estimated time: ${page.estimatedTime}` : "Toone product guide"}
          </div>

          <div className={styles.prose}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => {
                  const label = textFromChildren(children);
                  return <h2 id={headingId(label)}>{children}</h2>;
                },
                h3: ({ children }) => {
                  const label = textFromChildren(children);
                  return <h3 id={headingId(label)}>{children}</h3>;
                },
                a: ({ href = "", children }) => {
                  if (href.startsWith("/how-to")) {
                    return <a href={`/${locale}${href}`}>{children}</a>;
                  }
                  const external = href.startsWith("http");
                  return (
                    <a
                      href={href}
                      rel={external ? "noopener noreferrer" : undefined}
                      target={external ? "_blank" : undefined}
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {page.body}
            </ReactMarkdown>
          </div>

          <nav className={styles.pager} aria-label="Guide pagination">
            {adjacent.previous ? (
              <a className={styles.pagerLink} href={guideHref(locale, adjacent.previous.slug)}>
                <span className={styles.pagerDirection}>Previous</span>
                <span className={styles.pagerTitle}>{adjacent.previous.label}</span>
              </a>
            ) : null}
            {adjacent.next ? (
              <a
                className={`${styles.pagerLink} ${styles.pagerNext}`}
                href={guideHref(locale, adjacent.next.slug)}
              >
                <span className={styles.pagerDirection}>Next</span>
                <span className={styles.pagerTitle}>{adjacent.next.label}</span>
              </a>
            ) : null}
          </nav>
        </article>

        <aside className={styles.toc} aria-label="On this page">
          <p className={styles.tocHeading}>On this page</p>
          {headings.map((heading) => (
            <a
              className={`${styles.tocLink} ${heading.depth === 3 ? styles.tocLinkNested : ""}`}
              href={`#${heading.id}`}
              key={`${heading.depth}-${heading.id}`}
            >
              {heading.label}
            </a>
          ))}
        </aside>
      </main>

      <Footer landingPath="/" showcasesPath="/how-to" />
    </div>
  );
}

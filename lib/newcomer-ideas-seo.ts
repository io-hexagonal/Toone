import type { Metadata } from "next";
import { localeRobots, localeVersions } from "@/i18n/indexing";
import { CREATOR_IDEAS, type CreatorIdea } from "@/lib/creator-ideas";

/**
 * Search metadata and structured data for the public /newcomers/ideas pages.
 * English only: other locales redirect to /en (proxy.ts, ENGLISH_ONLY_PATHS).
 */

export const SITE = "https://trytoone.com";
export const NEWCOMER_IDEAS_PATH = "/newcomers/ideas";

export const NEWCOMER_INDEX = {
  title: "Routine ideas for new Toone users",
  description:
    "Ready-made ideas for your first Toone routines: a Reddit watcher, a YouTube channel that improves with every review, and market watchers. Copy a prompt to start.",
  heading: "Routine ideas to start with",
  lede:
    "New to Toone? Each idea below is something Toone already runs. Open one, copy its prompt into a new Toone conversation, and Toone builds the routine with you, asks for what it needs and shows it to you before the first run.",
};

/** The three setup steps shown on every newcomer page and published as HowTo steps. */
export const SETUP_STEPS = [
  "Download Toone for your Mac and start a new conversation.",
  "Copy the idea's prompt and paste it into the conversation.",
  "Answer Toone's setup questions. It shows you the routine before the first run, and nothing runs until you say so.",
];

export const NEWCOMER_FAQ = [
  {
    q: "What is a routine?",
    a: "A routine is a set of steps Toone runs the same way every time, on a schedule or when you ask. Plain scripts do the repeat checks with no AI, and AI steps run only when there is something to read, write or decide.",
  },
  {
    q: "Do I need to code?",
    a: "No. You describe the work in plain words, or paste a prompt from these pages, and Toone drafts the routine with you. You can change any step later by asking.",
  },
  {
    q: "Which AI does Toone use?",
    a: "Toone runs on your own Claude Code or Codex, on your Mac. Each step can use the model that suits it.",
  },
  {
    q: "Do the ideas get better over time?",
    a: "Yes. Each idea keeps a page where you leave notes, and Toone turns every note into a rule for the next run, so you never have to give the same note twice.",
  },
];

const OG_IMAGE = { url: `${SITE}/assets/og/toone-og.png`, width: 2400, height: 1260, alt: "Toone", type: "image/png" };

export function newcomerIndexMetadata(locale: string): Metadata {
  const canonical = `${SITE}/en${NEWCOMER_IDEAS_PATH}`;
  return {
    title: { absolute: `${NEWCOMER_INDEX.title} | Toone` },
    description: NEWCOMER_INDEX.description,
    alternates: { canonical },
    robots: localeRobots(locale),
    other: localeVersions(NEWCOMER_IDEAS_PATH, ["en"]),
    openGraph: {
      type: "website",
      url: canonical,
      title: NEWCOMER_INDEX.title,
      description: NEWCOMER_INDEX.description,
      siteName: "Toone",
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: NEWCOMER_INDEX.title, description: NEWCOMER_INDEX.description, images: [OG_IMAGE.url] },
  };
}

export function newcomerIdeaMetadata(locale: string, idea: CreatorIdea): Metadata {
  const path = `${NEWCOMER_IDEAS_PATH}/${idea.slug}`;
  const canonical = `${SITE}/en${path}`;
  const { metaTitle, metaDescription } = idea.newcomer;
  const image = { url: `${SITE}${idea.image}`, width: 1600, height: 900, alt: idea.title };
  return {
    title: { absolute: `${metaTitle} | Toone` },
    description: metaDescription,
    alternates: { canonical },
    robots: localeRobots(locale),
    other: localeVersions(path, ["en"]),
    openGraph: { type: "article", url: canonical, title: metaTitle, description: metaDescription, siteName: "Toone", images: [image] },
    twitter: { card: "summary_large_image", title: metaTitle, description: metaDescription, images: [image.url] },
  };
}

const breadcrumb = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: item.url })),
});

const faqPage = (faq: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
});

const INDEX_URL = `${SITE}/en${NEWCOMER_IDEAS_PATH}`;

export function newcomerIndexSchemas() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: NEWCOMER_INDEX.title,
      description: NEWCOMER_INDEX.description,
      url: INDEX_URL,
      inLanguage: "en",
      isPartOf: { "@type": "WebSite", name: "Toone", url: SITE },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: CREATOR_IDEAS.map((idea, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${INDEX_URL}/${idea.slug}`,
          name: idea.title,
        })),
      },
    },
    breadcrumb([
      { name: "Toone", url: `${SITE}/en` },
      { name: "Ideas for newcomers", url: INDEX_URL },
    ]),
    faqPage(NEWCOMER_FAQ),
  ];
}

export function newcomerIdeaSchemas(idea: CreatorIdea) {
  const url = `${INDEX_URL}/${idea.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to set up ${idea.label.replace(/^Outreach: /, "")} in Toone`,
      description: idea.newcomer.metaDescription,
      url,
      inLanguage: "en",
      image: `${SITE}${idea.image}`,
      tool: [{ "@type": "HowToTool", name: "Toone for Mac" }],
      supply: idea.newcomer.needs.map((need) => ({ "@type": "HowToSupply", name: need })),
      step: SETUP_STEPS.map((text, i) => ({ "@type": "HowToStep", position: i + 1, text })),
    },
    breadcrumb([
      { name: "Toone", url: `${SITE}/en` },
      { name: "Ideas for newcomers", url: INDEX_URL },
      { name: idea.label, url },
    ]),
    faqPage(idea.newcomer.faq),
  ];
}

/** One <script type="application/ld+json"> body, safe to inline. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

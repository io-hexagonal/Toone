import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { getAllUsers, getUserById } from "@/lib/users";
import { locales } from "@/i18n/routing";
import type { User } from "@/lib/types";
import type { Metadata } from "next";
import BlogPost from "@/components/BlogPost";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    const posts = getAllPosts(locale);
    for (const post of posts) {
      params.push({ locale, slug: post.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(locale, slug);
  if (!post) return {};

  const author = getUserById(post.authorId);

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `https://trytoone.com/${locale}/ai-digest/${post.slug}`,
      publishedTime: post.date,
      authors: author ? [author.name] : undefined,
      tags: post.tags,
      locale: locale === "en" ? "en_US" : locale,
    },
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        articleSection: post.category,
        author: author
          ? {
              "@type": "Person",
              name: author.name,
            }
          : undefined,
        publisher: {
          "@type": "Organization",
          name: "Toone",
          url: "https://trytoone.com",
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://trytoone.com/${locale}/ai-digest/${post.slug}`,
        },
        url: `https://trytoone.com/${locale}/ai-digest/${post.slug}`,
        keywords: post.tags.join(", "),
        commentCount: post.comments.length,
        inLanguage: locale === "en" ? "en-US" : locale,
      }),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });

  const post = getPostBySlug(locale, slug);
  if (!post) notFound();

  const author = getUserById(post.authorId);
  const allPosts = getAllPosts(locale);
  const allUsers = getAllUsers();

  const usersMap = new Map<string, User>();
  for (const u of allUsers) usersMap.set(u.id, u);

  // Related posts: same tags, excluding current, max 3
  const relatedPosts = allPosts
    .filter(
      (p) =>
        p.id !== post.id &&
        p.tags.some((tag) => post.tags.includes(tag))
    )
    .slice(0, 3);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .digest-content h1 { font-size: 28px; font-weight: 700; color: rgba(255,255,255,0.95); margin: 32px 0 16px; letter-spacing: -0.01em; }
            .digest-content h2 { font-size: 20px; font-weight: 600; color: rgba(255,255,255,0.9); margin: 28px 0 12px; }
            .digest-content h3 { font-size: 17px; font-weight: 600; color: rgba(255,255,255,0.85); margin: 24px 0 10px; }
            .digest-content p { font-size: 15px; color: rgba(255,255,255,0.65); line-height: 1.8; margin-bottom: 16px; }
            .digest-content ul { padding-left: 20px; margin-bottom: 16px; }
            .digest-content li { font-size: 15px; color: rgba(255,255,255,0.6); line-height: 1.7; margin-bottom: 6px; }
            .digest-content strong { color: rgba(255,255,255,0.85); font-weight: 600; }
            .digest-content em { color: rgba(255,255,255,0.7); font-style: italic; }
            .digest-content code { background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-size: 13px; color: rgba(255,255,255,0.75); font-family: 'SF Mono', 'Fira Code', monospace; }
            .digest-content pre { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 16px 20px; overflow-x: auto; margin-bottom: 16px; }
            .digest-content pre code { background: none; padding: 0; font-size: 13px; line-height: 1.6; }
            .digest-content a { color: rgba(100,180,255,0.8); text-decoration: none; border-bottom: 1px solid rgba(100,180,255,0.2); transition: color 0.2s, border-color 0.2s; }
            .digest-content a:hover { color: rgba(100,180,255,1); border-bottom-color: rgba(100,180,255,0.5); }
          `,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            articleSection: post.category,
            author: author
              ? { "@type": "Person", name: author.name }
              : undefined,
            publisher: {
              "@type": "Organization",
              name: "Toone",
              url: "https://trytoone.com",
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://trytoone.com/${locale}/ai-digest/${post.slug}`,
            },
            url: `https://trytoone.com/${locale}/ai-digest/${post.slug}`,
            keywords: post.tags.join(", "),
            commentCount: post.comments.length,
            inLanguage: locale === "en" ? "en-US" : locale,
          }),
        }}
      />
      <BlogPost
        post={post}
        author={author}
        relatedPosts={relatedPosts}
        users={usersMap}
        labels={{
          tags: t("tags"),
          relatedPosts: t("relatedPosts"),
          comments: t("comments"),
          readMore: t("readMore"),
          publishedOn: t("publishedOn"),
          by: t("by"),
        }}
      />
    </>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPaginatedPosts, getCategoryCounts, CATEGORIES } from "@/lib/posts";
import { getAllUsers } from "@/lib/users";
import type { User } from "@/lib/types";
import BlogList from "@/components/BlogList";
import Pagination from "@/components/Pagination";
import CategoryFilter from "@/components/CategoryFilter";
import { Link } from "@/lib/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; category?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("blog"),
    description: t("downloadCTADescription"),
  };
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });

  const page = Math.max(1, parseInt(sp.page || "1", 10));
  const category = sp.category || null;
  const { posts, totalPages } = getPaginatedPosts(
    locale,
    page,
    20,
    category || undefined
  );

  const counts = getCategoryCounts(locale);
  const totalPosts = Object.values(counts).reduce((a, b) => a + b, 0);

  const categoryItems = [
    { key: "all", label: t("categories.all"), count: totalPosts },
    ...CATEGORIES.map((key) => ({
      key,
      label: t(`categories.${key}`),
      count: counts[key] || 0,
    })),
  ];

  const allUsers = getAllUsers();
  const usersMap = new Map<string, User>();
  for (const u of allUsers) usersMap.set(u.id, u);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#141622",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "60px 24px 80px",
        }}
      >
        {/* Back */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "rgba(255,255,255,0.35)",
            textDecoration: "none",
            fontSize: 13,
            letterSpacing: "0.04em",
            marginBottom: 40,
            transition: "color 0.2s",
          }}
        >
          <svg
            viewBox="0 0 16 16"
            style={{ width: 14, height: 14, fill: "currentColor" }}
          >
            <path d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" />
          </svg>
          Toone
        </Link>

        <h1
          style={{
            color: "rgba(255,255,255,0.95)",
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 24,
            letterSpacing: "-0.02em",
          }}
        >
          {t("blog")}
        </h1>

        <CategoryFilter categories={categoryItems} active={category} />

        {posts.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>
            {t("noPosts")}
          </p>
        ) : (
          <>
            <BlogList
              posts={posts}
              users={usersMap}
              readMoreLabel={t("readMore")}
              byLabel={t("by")}
            />
            <Pagination
              page={page}
              totalPages={totalPages}
              category={category}
            />
          </>
        )}
      </div>
    </div>
  );
}

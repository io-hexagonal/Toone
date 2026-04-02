import { Link } from "@/lib/navigation";
import type { Post } from "@/lib/types";
import type { User } from "@/lib/types";

interface Props {
  posts: Post[];
  users: Map<string, User>;
  readMoreLabel: string;
  byLabel: string;
}

export default function BlogList({
  posts,
  users,
  readMoreLabel,
  byLabel,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 24,
      }}
    >
      {posts.map((post) => {
        const author = users.get(post.authorId);
        return (
          <Link
            key={post.id}
            href={`/ai-digest/${post.slug}`}
            style={{
              display: "block",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14,
              padding: "24px 28px",
              textDecoration: "none",
              transition: "background 0.2s, border-color 0.2s",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 12,
                }}
              >
                {post.date}
              </span>
              {author && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.15)" }}>
                    &middot;
                  </span>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontSize: 12,
                    }}
                  >
                    {byLabel} {author.name}
                  </span>
                </>
              )}
            </div>
            <h2
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 8,
                lineHeight: 1.3,
              }}
            >
              {post.title}
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              {post.description}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.35)",
                      background: "rgba(255,255,255,0.05)",
                      padding: "3px 10px",
                      borderRadius: 20,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span
                style={{
                  color: "rgba(100,180,255,0.7)",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {readMoreLabel}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

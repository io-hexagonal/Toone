import type { Post, User } from "@/lib/types";
import { markdownToHtml } from "@/lib/markdown";
import AuthorCard from "./AuthorCard";
import CommentSection from "./CommentSection";
import DownloadCTA from "./DownloadCTA";
import { Link } from "@/lib/navigation";

interface Props {
  post: Post;
  author: User | undefined;
  relatedPosts: Post[];
  users: Map<string, User>;
  labels: {
    tags: string;
    relatedPosts: string;
    comments: string;
    readMore: string;
    publishedOn: string;
    by: string;
  };
}

export default function BlogPost({
  post,
  author,
  relatedPosts,
  users,
  labels,
}: Props) {
  const contentHtml = markdownToHtml(post.content);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#141622",
        color: "rgba(255,255,255,0.8)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "60px 24px 80px",
        }}
      >
        {/* Back link */}
        <Link
          href="/ai-digest"
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
          AI Digest
        </Link>

        {/* Download CTA top */}
        <div style={{ marginBottom: 40 }}>
          <DownloadCTA />
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "rgba(255,255,255,0.95)",
            lineHeight: 1.2,
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          {post.title}
        </h1>

        {/* Meta */}
        <div
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          {labels.publishedOn} {post.date} {author && `${labels.by} ${author.name}`}
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {post.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.4)",
                background: "rgba(255,255,255,0.06)",
                padding: "4px 12px",
                borderRadius: 20,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Author card */}
        {author && <AuthorCard user={author} />}

        {/* Divider */}
        <hr
          style={{
            border: "none",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            margin: "24px 0 32px",
          }}
        />

        {/* Content */}
        <div
          className="digest-content"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* Download CTA bottom */}
        <div style={{ marginTop: 48 }}>
          <DownloadCTA />
        </div>

        {/* Comments */}
        <CommentSection
          comments={post.comments}
          users={users}
          label={labels.comments}
        />

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h3
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 20,
              }}
            >
              {labels.relatedPosts}
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/ai-digest/${rp.slug}`}
                  style={{
                    display: "block",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    padding: "16px 20px",
                    textDecoration: "none",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      color: "rgba(255,255,255,0.85)",
                      fontSize: 15,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {rp.title}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 13,
                    }}
                  >
                    {rp.description.slice(0, 120)}...
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import type { Comment } from "@/lib/types";
import type { User } from "@/lib/types";

interface Props {
  comments: Comment[];
  users: Map<string, User>;
  label: string;
}

export default function CommentSection({ comments, users, label }: Props) {
  if (comments.length === 0) return null;

  return (
    <div style={{ marginTop: 48 }}>
      <h3
        style={{
          color: "rgba(255,255,255,0.9)",
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 24,
        }}
      >
        {label} ({comments.length})
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {comments.map((comment, i) => {
          const user = users.get(comment.authorId);
          return (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                {user && (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: `1.5px solid ${user.color}`,
                    }}
                  />
                )}
                <div>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {user?.name ?? comment.authorId}
                  </span>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.25)",
                      fontSize: 12,
                      marginLeft: 10,
                    }}
                  >
                    {comment.date}
                  </span>
                </div>
              </div>
              <p
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 14,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {comment.content}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

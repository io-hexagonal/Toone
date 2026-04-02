import type { User } from "@/lib/types";

export default function AuthorCard({ user }: { user: User }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 0",
      }}
    >
      <img
        src={user.avatar}
        alt={user.name}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: `2px solid ${user.color}`,
        }}
      />
      <div>
        <div
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {user.name}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 12,
          }}
        >
          {user.role}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Link } from "@/lib/navigation";

interface Props {
  categories: { key: string; label: string; count: number }[];
  active: string | null;
}

export default function CategoryFilter({ categories, active }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        marginBottom: 32,
      }}
    >
      {categories.map((cat) => {
        const isActive = cat.key === "all" ? !active : active === cat.key;
        return (
          <Link
            key={cat.key}
            href={
              cat.key === "all"
                ? "/ai-digest"
                : `/ai-digest?category=${cat.key}`
            }
            style={{
              fontSize: 13,
              fontWeight: 500,
              padding: "6px 16px",
              borderRadius: 20,
              textDecoration: "none",
              transition: "all 0.2s",
              background: isActive
                ? "rgba(100,180,255,0.15)"
                : "rgba(255,255,255,0.04)",
              border: isActive
                ? "1px solid rgba(100,180,255,0.3)"
                : "1px solid rgba(255,255,255,0.08)",
              color: isActive
                ? "rgba(100,180,255,0.9)"
                : "rgba(255,255,255,0.4)",
            }}
          >
            {cat.label}
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                opacity: 0.6,
              }}
            >
              {cat.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

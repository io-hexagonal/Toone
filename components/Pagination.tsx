"use client";

import { Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";

interface Props {
  page: number;
  totalPages: number;
  category?: string | null;
}

export default function Pagination({ page, totalPages, category }: Props) {
  const t = useTranslations("blog");

  if (totalPages <= 1) return null;

  const catParam = category ? `&category=${category}` : "";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        marginTop: 48,
      }}
    >
      {page > 1 && (
        <Link
          href={`/ai-digest?page=${page - 1}${catParam}`}
          style={{
            color: "rgba(255,255,255,0.6)",
            textDecoration: "none",
            fontSize: 13,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            transition: "background 0.2s",
          }}
        >
          {t("previous")}
        </Link>
      )}
      <span
        style={{
          color: "rgba(255,255,255,0.35)",
          fontSize: 13,
        }}
      >
        {t("pageOf", { page, total: totalPages })}
      </span>
      {page < totalPages && (
        <Link
          href={`/ai-digest?page=${page + 1}${catParam}`}
          style={{
            color: "rgba(255,255,255,0.6)",
            textDecoration: "none",
            fontSize: 13,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            transition: "background 0.2s",
          }}
        >
          {t("next")}
        </Link>
      )}
    </div>
  );
}

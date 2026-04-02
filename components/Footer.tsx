"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        display: "flex",
        gap: 20,
        pointerEvents: "auto",
      }}
    >
      <Link
        href="/privacy"
        style={{
          color: "rgba(255,255,255,0.2)",
          textDecoration: "none",
          fontSize: 11,
          letterSpacing: "0.04em",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "rgba(255,255,255,0.45)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "rgba(255,255,255,0.2)")
        }
      >
        {t("privacy")}
      </Link>
    </div>
  );
}

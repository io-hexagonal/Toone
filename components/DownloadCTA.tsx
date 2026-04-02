"use client";

import { useTranslations } from "next-intl";

export default function DownloadCTA() {
  const t = useTranslations("blog");

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: "24px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          {t("downloadCTA")}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 13,
          }}
        >
          {t("downloadCTADescription")}
        </div>
      </div>
      <a
        href="/Toone-1.0.3.dmg"
        target="_blank"
        rel="noopener"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 24px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.9)",
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 500,
          whiteSpace: "nowrap",
          transition: "background 0.2s, border-color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.14)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
        }}
      >
        <svg
          viewBox="0 0 24 24"
          style={{ width: 18, height: 18, fill: "currentColor" }}
        >
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
        macOS
      </a>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";

export default async function Navigation() {
  const t = await getTranslations("nav");

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .minimal-brand { opacity: 0.85; transition: opacity 0.2s; }
            .minimal-brand:hover { opacity: 1; }
            .minimal-link {
              color: rgba(255,255,255,0.68); text-decoration: none;
              font-size: 12px; letter-spacing: 0.04em; font-weight: 500;
              transition: color 0.2s;
            }
            .minimal-link:hover { color: rgba(255,255,255,0.95); }
            .minimal-github { font-size: 0; }
          `,
        }}
      />
      {/* Brand lockup — site identity, top left */}
      <Link
        href="/"
        aria-label="Toone"
        className="minimal-brand"
        style={{
          position: "fixed",
          top: 14,
          left: 18,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 9,
          textDecoration: "none",
          pointerEvents: "auto",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/brand/toone-mark.svg"
          alt=""
          width={28}
          height={28}
          style={{ display: "block" }}
        />
        {/* Wordmark: Rubik 600 lowercase, per the brand law. */}
        <span
          style={{
            color: "rgba(255,255,255,0.75)",
            fontFamily: "var(--font-wordmark), system-ui, sans-serif",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.045em",
          }}
        >
          toone
        </span>
      </Link>

      <nav
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
          pointerEvents: "auto",
        }}
      >
        <a href="/en/resources" className="minimal-link">
          {t("resources")}
        </a>
        <Link
          href="/showcases"
          className="minimal-link"
        >
          {t("showcases")}
        </Link>
        <a
          href="https://github.com/io-hexagonal/Toone"
          target="_blank"
          rel="noopener"
          aria-label="GitHub"
          className="minimal-link minimal-github"
        >
          <svg
            viewBox="0 0 16 16"
            style={{ width: 24, height: 24, fill: "currentColor", display: "block" }}
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </nav>
    </>
  );
}

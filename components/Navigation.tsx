import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";

type Props = {
  homePath?: "/" | "/business";
  showcasesPath?: "/how-to" | "/business/showcases";
};

export default async function Navigation({
  homePath = "/",
  showcasesPath = "/how-to",
}: Props) {
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
        href={homePath}
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
        <Link
          href={showcasesPath}
          className="minimal-link"
        >
          {t(showcasesPath === "/how-to" ? "howTo" : "showcases")}
        </Link>
        <Link href="/early-access" className="minimal-link">{t("download")}</Link>

      </nav>
    </>
  );
}

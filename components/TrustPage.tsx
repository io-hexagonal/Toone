import type { ReactNode } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

type Props = {
  eyebrow: string;
  title: string;
  lede: string;
  updated: string;
  children: ReactNode;
};

export default function TrustPage({ eyebrow, title, lede, updated, children }: Props) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .trust-page {
              max-width: 760px; margin: 0 auto; padding: 132px 24px 112px;
              color: rgba(255,255,255,0.74);
            }
            .trust-eyebrow {
              color: rgba(255,255,255,0.58); font-size: 11px; font-weight: 700;
              letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 18px;
            }
            .trust-page h1 {
              color: rgba(255,255,255,0.96); font-size: clamp(36px, 7vw, 58px);
              font-weight: 600; letter-spacing: -0.035em; line-height: 1.06;
              margin-bottom: 20px;
            }
            .trust-lede {
              max-width: 64ch; color: rgba(255,255,255,0.68); font-size: 18px;
              line-height: 1.7; margin-bottom: 16px;
            }
            .trust-updated {
              color: rgba(255,255,255,0.55); font-size: 12px; margin-bottom: 58px;
            }
            .trust-page section {
              padding: 34px 0; border-top: 1px solid rgba(255,255,255,0.09);
            }
            .trust-page h2 {
              color: rgba(255,255,255,0.92); font-size: 21px; font-weight: 600;
              letter-spacing: -0.015em; margin-bottom: 13px;
            }
            .trust-page p, .trust-page li {
              color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.75;
            }
            .trust-page p + p { margin-top: 13px; }
            .trust-page ul { padding-left: 20px; margin-top: 14px; }
            .trust-page li + li { margin-top: 8px; }
            .trust-page a { color: #b9d9ff; text-underline-offset: 3px; }
            .trust-page a:hover { color: #e0efff; }
            @media (max-width: 640px) {
              .trust-page { padding-top: 112px; padding-bottom: 84px; }
              .trust-lede { font-size: 16px; }
            }
          `,
        }}
      />
      <Navigation />
      <main className="trust-page">
        <p className="trust-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="trust-lede">{lede}</p>
        <p className="trust-updated">Last reviewed: {updated}</p>
        {children}
      </main>
      <Footer />
    </>
  );
}

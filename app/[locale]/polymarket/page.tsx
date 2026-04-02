import { setRequestLocale } from "next-intl/server";
import PolymarketCanvas from "@/components/PolymarketCanvas";
import WaitlistForm from "@/components/WaitlistForm";
import { Link } from "@/lib/navigation";
import Image from "next/image";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: "Toone x Polymarket",
  description:
    "World's first crowd prediction intelligence — a distributed agent network that lets every user's signal detection become everyone's edge.",
};

export default async function PolymarketPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; overflow: hidden; background: #0d0f1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }

            .pm-overlay {
              position: fixed; left: 50%; top: 50%;
              transform: translate(-50%, -50%);
              z-index: 10; display: flex; flex-direction: column;
              align-items: center; pointer-events: none;
              text-align: center;
            }
            .pm-overlay > * { pointer-events: auto; }

            .pm-logo-group {
              display: flex; align-items: center; gap: 14px;
              margin-bottom: 24px;
            }
            .pm-logo-icon { width: 48px; height: 48px; }
            .pm-logo-x {
              font-size: 28px; color: rgba(255,255,255,0.3);
              margin: 0 10px; font-weight: 300;
            }

            .pm-heading {
              font-size: clamp(36px, 6vw, 56px);
              font-weight: 700; line-height: 1.15;
              letter-spacing: -0.02em;
              color: #ffffff;
              margin-bottom: 18px;
            }
            .pm-heading .accent {
              color: #34d399;
            }

            .pm-sub {
              font-size: clamp(18px, 2.5vw, 24px);
              font-weight: 400; line-height: 1.6;
              color: #ffffff;
              max-width: 600px;
              margin-bottom: 40px;
              letter-spacing: -0.01em;
            }

            .pm-tags {
              display: flex; gap: 12px;
              justify-content: center; flex-wrap: wrap;
              margin-bottom: 48px;
            }

            .pm-tag {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 8px;
              font-size: 12px;
              font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
              letter-spacing: 0.5px;
              border: 1px solid rgba(255,255,255,0.12);
              color: rgba(255,255,255,0.35);
            }
            .pm-tag-accent {
              border-color: rgba(139, 92, 246, 0.3);
              color: #8B5CF6;
              background: rgba(139, 92, 246, 0.06);
            }

            .pm-waitlist-label {
              font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
              font-size: 11px;
              letter-spacing: 1.5px;
              color: rgba(255,255,255,0.25);
              text-transform: uppercase;
              margin-bottom: 16px;
            }

            .pm-form {
              display: flex; gap: 8px;
              max-width: 420px; width: 100%;
            }

            .pm-input {
              flex: 1;
              padding: 14px 18px;
              background: rgba(255,255,255,0.06);
              backdrop-filter: blur(12px);
              -webkit-backdrop-filter: blur(12px);
              border: 1px solid rgba(255,255,255,0.12);
              border-radius: 12px;
              color: rgba(255,255,255,0.9);
              font-size: 15px;
              outline: none;
              transition: border-color 0.2s;
            }
            .pm-input::placeholder { color: rgba(255,255,255,0.3); }
            .pm-input:focus { border-color: rgba(139, 92, 246, 0.5); }

            .pm-btn {
              padding: 14px 24px;
              background: rgba(139, 92, 246, 0.2);
              backdrop-filter: blur(12px);
              -webkit-backdrop-filter: blur(12px);
              border: 1px solid rgba(139, 92, 246, 0.4);
              border-radius: 12px;
              color: #A78BFA;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              transition: background 0.2s, border-color 0.2s, transform 0.15s;
              white-space: nowrap;
            }
            .pm-btn:hover {
              background: rgba(139, 92, 246, 0.3);
              border-color: rgba(139, 92, 246, 0.6);
              transform: translateY(-1px);
            }
            .pm-btn:active { transform: translateY(0); }
            .pm-btn:disabled {
              opacity: 0.5;
              cursor: not-allowed;
              transform: none;
            }

            .pm-success {
              font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
              font-size: 13px;
              color: #34d399;
              letter-spacing: 0.5px;
            }

            .pm-back {
              position: fixed; top: 16px; left: 16px; z-index: 20;
              color: rgba(255,255,255,0.25);
              text-decoration: none;
              font-size: 13px;
              letter-spacing: 0.04em;
              display: inline-flex; align-items: center; gap: 6px;
              transition: color 0.2s;
            }
            .pm-back:hover { color: rgba(255,255,255,0.5); }
            .pm-back svg { width: 14px; height: 14px; fill: currentColor; }

            .pm-noise {
              position: fixed; inset: 0; opacity: 0.04;
              pointer-events: none; mix-blend-mode: overlay; z-index: 1;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
            }

            @media (max-width: 640px) {
              .pm-form { flex-direction: column; }
              .pm-overlay { padding: 0 24px; width: 100%; }
              .pm-logo-group { gap: 8px; }
              .pm-logo-x { margin: 0 4px; font-size: 20px; }
            }
          `,
        }}
      />

      <PolymarketCanvas />
      <div className="pm-noise" />

      <Link href="/" className="pm-back">
        <svg viewBox="0 0 16 16">
          <path d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" />
        </svg>
        Toone
      </Link>

      <div className="pm-overlay">
        <div className="pm-logo-group">
          <Image
            src="/assets/toone-icon-dark-512.png"
            alt="Toone"
            width={48}
            height={48}
            className="pm-logo-icon"
          />
          <span className="pm-logo-x">&times;</span>
          <Image
            src="/assets/polymarket-wordmark-white.png"
            alt="Polymarket"
            width={168}
            height={56}
            style={{ opacity: 0.9 }}
          />
        </div>

        <h1 className="pm-heading">
          World&apos;s first <span className="accent">crowd prediction intelligence</span>
        </h1>
        <p className="pm-sub">
          A distributed agent network that lets every user&apos;s signal detection
          become everyone&apos;s edge.
        </p>

        <div className="pm-tags">
          <span className="pm-tag">macOS Native</span>
          <span className="pm-tag">AI Agents</span>
          <span className="pm-tag pm-tag-accent">Launch: May 2, 2026</span>
        </div>

        <div className="pm-waitlist-label">Early Access</div>
        <WaitlistForm />
      </div>
    </>
  );
}

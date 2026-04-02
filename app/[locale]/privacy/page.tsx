import { setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Privacy Policy",
    description: "Toone Privacy Policy",
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#141622",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        color: "rgba(255,255,255,0.8)",
        lineHeight: 1.7,
      }}
    >
      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "60px 24px 80px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "rgba(255,255,255,0.35)",
            textDecoration: "none",
            fontSize: 13,
            letterSpacing: "0.04em",
            marginBottom: 40,
            transition: "color 0.2s",
          }}
        >
          <svg
            viewBox="0 0 16 16"
            style={{ width: 14, height: 14, fill: "currentColor" }}
          >
            <path d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" />
          </svg>
          Back to Toone
        </Link>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "rgba(255,255,255,0.95)",
            marginBottom: 8,
            letterSpacing: "-0.01em",
          }}
        >
          Privacy Policy
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.3)",
            marginBottom: 48,
            letterSpacing: "0.02em",
          }}
        >
          Effective date: March 18, 2025
        </p>

        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Toone is built to work locally on your machine. We believe your data is
          yours, and our architecture reflects that.
        </p>

        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            marginTop: 36,
            marginBottom: 12,
          }}
        >
          What Toone Does Not Collect
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Toone does not collect, transmit, or store any of the following:
        </p>
        <ul
          style={{
            paddingLeft: 20,
            marginBottom: 12,
            fontSize: 14,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <li style={{ marginBottom: 6 }}>
            Personal information (name, email, location)
          </li>
          <li style={{ marginBottom: 6 }}>Usage analytics or telemetry</li>
          <li style={{ marginBottom: 6 }}>
            Conversation content or chat history
          </li>
          <li style={{ marginBottom: 6 }}>File contents or project data</li>
          <li style={{ marginBottom: 6 }}>
            Keystrokes, screenshots, or screen recordings
          </li>
        </ul>

        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            marginTop: 36,
            marginBottom: 12,
          }}
        >
          Local-First Architecture
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          All conversations, files, and project data remain on your device. Toone
          does not operate any backend servers that receive or process your data.
          The desktop and mobile apps communicate directly with each other over
          your local network via an encrypted WebSocket tunnel.
        </p>

        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            marginTop: 36,
            marginBottom: 12,
          }}
        >
          Third-Party AI Providers
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Toone connects to AI providers (such as Anthropic or OpenAI) by letting
          you connect your own Anthropic or OpenAI account. Authentication is
          handled through your terminal using each provider&apos;s CLI. When you send
          a message, it is transmitted directly from your device to the
          provider&apos;s API. Toone does not proxy, log, or retain these requests.
          Please refer to your chosen provider&apos;s privacy policy for how they
          handle your data:
        </p>
        <ul
          style={{
            paddingLeft: 20,
            marginBottom: 12,
            fontSize: 14,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <li style={{ marginBottom: 6 }}>
            <a
              href="https://www.anthropic.com/privacy"
              target="_blank"
              rel="noopener"
              style={{ color: "rgba(100,180,255,0.8)", textDecoration: "none" }}
            >
              Anthropic Privacy Policy
            </a>
          </li>
          <li style={{ marginBottom: 6 }}>
            <a
              href="https://openai.com/privacy"
              target="_blank"
              rel="noopener"
              style={{ color: "rgba(100,180,255,0.8)", textDecoration: "none" }}
            >
              OpenAI Privacy Policy
            </a>
          </li>
        </ul>

        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            marginTop: 36,
            marginBottom: 12,
          }}
        >
          Mobile Companion App
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          The Toone mobile app connects to a running Toone Desktop instance on
          the same network. The connection uses a secure, authenticated WebSocket
          tunnel. No data from the mobile app is sent to Toone or any third party
          — all communication stays between your devices.
        </p>

        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            marginTop: 36,
            marginBottom: 12,
          }}
        >
          Crash Reports &amp; Diagnostics
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Toone does not include any crash reporting or diagnostic SDKs. If you
          choose to report an issue via GitHub, any information you share is
          voluntary and governed by{" "}
          <a
            href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
            target="_blank"
            rel="noopener"
            style={{ color: "rgba(100,180,255,0.8)", textDecoration: "none" }}
          >
            GitHub&apos;s privacy policy
          </a>
          .
        </p>

        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            marginTop: 36,
            marginBottom: 12,
          }}
        >
          Updates
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Desktop releases are distributed through GitHub Releases. The app may
          check for new versions by querying the GitHub API, which is subject to{" "}
          <a
            href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
            target="_blank"
            rel="noopener"
            style={{ color: "rgba(100,180,255,0.8)", textDecoration: "none" }}
          >
            GitHub&apos;s privacy policy
          </a>
          . No personal data is transmitted during this check.
        </p>

        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            marginTop: 36,
            marginBottom: 12,
          }}
        >
          Changes to This Policy
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          If we make material changes to this policy, we will update the effective
          date at the top of this page and note the changes in our release notes.
        </p>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            margin: "36px 0",
          }}
        />

        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            marginTop: 36,
            marginBottom: 12,
          }}
        >
          Contact
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          If you have questions about this policy, open an issue on our{" "}
          <a
            href="https://github.com/mattwebhub/toone"
            target="_blank"
            rel="noopener"
            style={{ color: "rgba(100,180,255,0.8)", textDecoration: "none" }}
          >
            GitHub repository
          </a>{" "}
          or reach out to the maintainers directly.
        </p>

        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.2)",
            marginTop: 48,
          }}
        >
          Toone-oss is an open-source project by hexagonal.io
        </p>
      </div>
    </div>
  );
}

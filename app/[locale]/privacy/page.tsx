import { setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/navigation";
import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Privacy Policy",
    description: "How Toone handles website, account, product, and analytics data.",
    alternates: {
      canonical: "https://trytoone.com/en/privacy",
      languages: {
        en: "https://trytoone.com/en/privacy",
        "x-default": "https://trytoone.com/en/privacy",
      },
    },
    robots: locale === "en" ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== "en") permanentRedirect("/en/privacy");
  setRequestLocale(locale);

  return (
    <main
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
          Updated: August 10, 2026
        </p>

        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Toone is built around local organization files and working context. This
          policy distinguishes that local product data from information you choose
          to submit through the website, waitlist, contact form, or account service.
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
          Local Product Data
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Toone does not receive your local organization files or working context
          merely because you use the desktop app. That includes:
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
            Conversation content and chat history stored in your organization
          </li>
          <li style={{ marginBottom: 6 }}>
            File contents and project data stored on your device
          </li>
          <li style={{ marginBottom: 6 }}>Local checkpoints and organization history</li>
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
          Information You Submit
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          We receive information you deliberately provide when you create or sign
          in to an account, join the early-access waitlist, or send a contact
          request. Depending on the action, this can include your name, email,
          company, message, and authentication data. Waitlist entries are sent to
          the Toone backend, contact requests are delivered to the team&apos;s
          communications system, and account data is processed by the Toone account
          service. We use this information to provide the requested service, respond
          to you, protect the service, and administer early access.
        </p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Website analytics events do not include form text, names, email addresses,
          passwords, authentication tokens, or account identifiers.
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
          Anonymous Usage Analytics
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          The Toone desktop app sends anonymous usage telemetry (feature usage
          events such as &quot;an organization was created&quot; — never
          conversation content, file contents, prompts, or anything that
          identifies you) to our own self-hosted, privacy-focused analytics
          (Umami). Events are tied to a random per-install identifier, not to
          your name or email. You can turn this off at any time in Settings.
        </p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          This website uses the same self-hosted, cookieless analytics to count
          visits and clicks. It sets no cookies, does not track you across
          sites, and does not share data with any third party.
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
          Local-First Architecture
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          All conversations, files, and project data remain on your device. Toone
          does not upload that local working context to its account, website, or
          analytics services. Account data, waitlist requests, contact requests,
          and optional relay connections are handled separately as described in
          this policy.
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
          The Toone mobile app connects to a running Toone Desktop instance over
          a direct local-network WebSocket or the optional Toone cloud relay. The
          cloud-relay transport uses TLS plus application-level end-to-end
          encryption, so the relay forwards encrypted application frames rather
          than readable conversation or project content. AI execution and project
          access remain on the Mac.
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
              href="https://github.com/io-hexagonal/Toone"
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
          Toone is published by Hexagonal.io.
        </p>
      </div>
    </main>
  );
}

import { setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/navigation";
import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { PrivacyChoicesButton } from "@/components/PrivacyChoices";
import { PRIVACY_UPDATED_DATE } from "@/lib/legal/privacy";

type Props = {
  params: Promise<{ locale: string }>;
};

// Release checks behind this copy: docs/legal/privacy-release-review.md.

const h2Style = {
  fontSize: 16,
  fontWeight: 600,
  color: "rgba(255,255,255,0.9)",
  marginTop: 36,
  marginBottom: 12,
} as const;
const pStyle = { fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 } as const;
const ulStyle = {
  paddingLeft: 20,
  marginBottom: 12,
  fontSize: 14,
  color: "rgba(255,255,255,0.6)",
} as const;
const liStyle = { marginBottom: 6 } as const;
const linkStyle = { color: "rgba(100,180,255,0.8)", textDecoration: "none" } as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Privacy Policy",
    description:
      "How Toone handles website, account, relay, Live Share, AI provider, and analytics data across the Direct, Mac App Store, and iPhone editions, and how to reach the team about a privacy request.",
    alternates: {
      canonical: "https://trytoone.com/en/privacy",
      languages: {
        en: "https://trytoone.com/en/privacy",
        "x-default": "https://trytoone.com/en/privacy",
      },
    },
    robots: { index: locale === "en", follow: true },
    // R7: og:url must equal the canonical. Without a route-level `openGraph`
    // this page inherited the root layout's card, whose og:url is the locale
    // home, so the shared URL and the canonical disagreed.
    openGraph: {
      type: "website",
      url: "https://trytoone.com/en/privacy",
      title: "Privacy Policy",
      description:
        "How Toone handles website, account, relay, Live Share, AI provider, and analytics data.",
      siteName: "Toone",
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
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
          Updated: {PRIVACY_UPDATED_DATE}
        </p>

        <p style={pStyle}>
          Toone stores organizations, conversations, and project files on your
          devices. Some features send information off the device: to your AI
          provider, to Toone&apos;s account, relay, and Live Share services, or
          to the website. This policy explains those flows and how they differ
          between editions of Toone.
        </p>

        <h2 style={h2Style}>Toone Editions</h2>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Toone (Direct)</strong>: the Mac app downloaded
            from trytoone.com.
          </li>
          <li style={liStyle}>
            <strong>Toone (Mac App Store)</strong>: the sandboxed Mac
            app distributed by Apple. It does not include usage analytics or
            browser cookie import.
          </li>
          <li style={liStyle}>
            <strong>Toone on iPhone</strong>: the mobile companion app, which
            connects to Toone running on your Mac.
          </li>
        </ul>

        <h2 style={h2Style}>Data Stored on Your Devices</h2>
        <p style={pStyle}>
          Toone stores the following on your Mac. Toone does not receive it
          merely because you use the app:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            Conversation content and chat history stored in your organization
          </li>
          <li style={liStyle}>
            File contents and project data stored on your device
          </li>
          <li style={liStyle}>Local checkpoints and organization history</li>
        </ul>
        <p style={pStyle}>
          This content can leave your Mac when you use a feature that needs it:
          when you send a request to an AI provider, when you connect Toone on
          iPhone through the cloud relay, or when you use Live Share. Each case
          is described below.
        </p>

        <h2 style={h2Style}>Your Toone Account</h2>
        <p style={pStyle}>
          When you create or sign in to a Toone account, the Toone account
          service processes your name, email address, a Toone user ID, and the
          authentication data needed to keep you signed in. We use this to
          provide the account and the Toone services that require it, and to
          protect the service.
        </p>
        <p style={pStyle}>
          If you choose Sign in with Apple, Apple gives Toone an identity token
          containing a stable Apple account identifier and, when available, an
          email address. That address may be an Apple private relay address.
          Apple may also
          provide your name the first time you authorize Toone. The website
          forwards the identity token and any provided name to the Toone
          account service for verification and sign-in. It does not send
          Apple&apos;s authorization code to that service. Apple handles your
          authentication under its own privacy policy.
        </p>

        <h2 style={h2Style}>Information You Submit Through the Website</h2>
        <p style={pStyle}>
          We receive information you deliberately provide when you join the
          early-access waitlist or send a contact request. Depending on the
          action, this can include your name, email, company, and message.
          Waitlist entries are sent to the Toone backend and contact requests
          are forwarded to a team Discord channel. We use this
          information to respond to you, protect the service, and administer
          early access.
        </p>

        <h2 style={h2Style}>AI Providers</h2>
        <p style={pStyle}>
          The Mac App Store edition offers OpenAI Codex. The Direct edition
          may also use Anthropic. When you use an AI feature, the app sends
          the selected provider what the request needs. For
          example, Codex may receive your prompts, files and tool output it
          can access in a workspace you authorize, and content or images from
          pages in Toone&apos;s built-in browser when you grant browser access. The
          provider may retain and use that information under its own terms and
          privacy policy:
        </p>
        <p style={pStyle}>
          Some limited Codex access can use a Toone-funded connection. When that
          connection is enabled for your account, Toone&apos;s server receives
          your Codex requests and responses, forwards them to OpenAI, and records
          usage and cost information to enforce the access limit. The requests
          can include prompts, tool output, and working context selected by the
          agent. Other Codex sign-in methods can connect to OpenAI without this
          Toone relay.
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <a
              href="https://www.anthropic.com/privacy"
              target="_blank"
              rel="noopener"
              style={linkStyle}
            >
              Anthropic Privacy Policy
            </a>
          </li>
          <li style={liStyle}>
            <a
              href="https://openai.com/privacy"
              target="_blank"
              rel="noopener"
              style={linkStyle}
            >
              OpenAI Privacy Policy
            </a>
          </li>
        </ul>

        <h2 style={h2Style}>Speech Input</h2>
        <p style={pStyle}>
          When you use speech input on your Mac, macOS speech recognition
          processes the audio you capture and turns it into text. Depending on the
          language and system settings, Apple may process that audio on its
          servers. If you send the recognized text in a chat, your selected AI
          provider receives it as part of that request.
        </p>

        <h2 style={h2Style}>Toone on iPhone and the Cloud Relay</h2>
        <p style={pStyle}>
          Toone on iPhone connects to Toone on your Mac over a direct
          local-network connection or through the optional Toone cloud relay.
          AI requests and project access run on the Mac.
        </p>
        <p style={pStyle}>
          The mobile relay forwards application frames encrypted by the paired
          devices. It also receives connection metadata. A relay room stores
          the Mac and iPhone device identifiers and the creator&apos;s IP
          address; other connection IP addresses can appear in server logs.
        </p>

        <h2 style={h2Style}>Live Share</h2>
        <p style={pStyle}>
          When you use Live Share, Toone&apos;s services receive the information
          needed to run the share, including share metadata and the email
          address of each person you invite. People you approve for the share
          can receive and view the workspace content you make available to them.
        </p>

        <h2 style={h2Style}>Browser Cookie Import (Direct Only)</h2>
        <p style={pStyle}>
          The Direct edition can, when you ask it to, import cookies from a
          browser on your Mac so Toone&apos;s built-in browser can use your
          existing sign-ins. An all-sites option can import cookies for more
          than one website. The Mac App Store edition does not offer this feature.
          The built-in browser can still store cookies for sites you visit;
          those sites have their own privacy practices.
        </p>

        <h2 style={h2Style}>Usage Analytics</h2>
        <p style={pStyle}>
          <strong>Toone (Direct)</strong> sends product usage events to Umami,
          such as when an organization is created. These events use a stable
          identifier for the installation and can include event and session
          properties, such as app version, operating system, and locale.
          You can turn this analytics off in Settings.
        </p>
        <p style={pStyle}>
          <strong>Toone (Mac App Store)</strong> does not include this
          analytics.
        </p>
        <p style={pStyle}>
          With your permission, this website loads a Umami analytics script
          from analytics.truleaf.org to count visits and selected clicks. That
          host receives ordinary connection information such as your IP address.
          Declining keeps the analytics script unloaded. You can change your
          choice at any time using <PrivacyChoicesButton />.
        </p>

        <h2 style={h2Style}>Cookies &amp; Browser Storage</h2>
        <p style={pStyle}>
          The website&apos;s language middleware can use a NEXT_LOCALE cookie
          to remember your language. When you sign in, the site stores a Toone
          session token, its expiry, and your account name, email, handle, and
          user ID in your browser&apos;s localStorage. Signing out removes that
          stored session; the site also removes expired sessions when it reads
          them. The website stores your analytics choice in localStorage for up
          to 180 days. Announcement dismissals may use localStorage or sessionStorage.
          When Apple sign-in is configured, the sign-in page loads Apple&apos;s
          script and button artwork from Apple&apos;s CDN. Apple receives
          ordinary connection information for those requests and may use its
          own browser storage.
        </p>

        <h2 style={h2Style}>Account and Privacy Requests</h2>
        <p style={pStyle}>
          You can ask us about access, correction, or deletion of your Toone
          account information through the support address below. When the
          in-app deletion service is available, the Mac App Store edition also
          lets you start a request in Settings and see its status. The service
          explains any account records it cannot remove immediately, such as
          records involved in billing, security, moderation, or shared business
          history. Local files on your devices are separate from server account
          records.
        </p>

        <h2 style={h2Style}>Crash Reports &amp; Diagnostics</h2>
        <p style={pStyle}>
          The Mac Store build has no Toone usage analytics pipeline. Apple
          may provide crash and diagnostic information through its platform
          services when a user chooses to share it. If you
          choose to report an issue via GitHub, any information you share is
          voluntary and governed by{" "}
          <a
            href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
            target="_blank"
            rel="noopener"
            style={linkStyle}
          >
            GitHub&apos;s privacy policy
          </a>
          .
        </p>

        <h2 style={h2Style}>Downloads &amp; Updates</h2>
        <p style={pStyle}>
          <strong>Direct edition:</strong> installers are available through
          authenticated Toone downloads. The service receives your account
          session token and ordinary connection information to authorise delivery.
          Existing apps check public update feeds hosted by GitHub, which is subject to{" "}
          <a
            href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
            target="_blank"
            rel="noopener"
            style={linkStyle}
          >
            GitHub&apos;s privacy policy
          </a>
          . GitHub receives ordinary connection information such as your IP address during an update check. Toone does not send your account session token to GitHub for that check.
        </p>
        <p style={pStyle}>
          <strong>Mac App Store and iPhone editions:</strong> Apple delivers
          downloads and updates under Apple&apos;s own terms and privacy policy.
        </p>

        <h2 style={h2Style}>Changes to This Policy</h2>
        <p style={pStyle}>
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

        <h2 style={h2Style}>Contact</h2>
        <p style={pStyle}>
          If you have questions about this policy, contact our{" "}
          <a
              href="mailto:hello@trytoone.com"
            target="_blank"
            rel="noopener"
            style={linkStyle}
          >
            support email
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

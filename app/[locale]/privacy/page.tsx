import { setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/navigation";
import type { Metadata } from "next";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { PrivacyChoicesButton } from "@/components/PrivacyChoices";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: PageSearchParams;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Privacy Policy",
    description:
      "How Toone handles website, account, product, and analytics data, which data stays local on your Mac, and how to reach the team about a privacy request.",
    alternates: {
      canonical: "https://trytoone.com/en/privacy",
      languages: {
        en: "https://trytoone.com/en/privacy",
        "x-default": "https://trytoone.com/en/privacy",
      },
    },
    robots: locale === "en" ? { index: true, follow: true } : { index: false, follow: true },
    // R7: og:url must equal the canonical. Without a route-level `openGraph`
    // this page inherited the root layout's card, whose og:url is the locale
    // home, so the shared URL and the canonical disagreed.
    openGraph: {
      type: "website",
      url: "https://trytoone.com/en/privacy",
      title: "Privacy Policy",
      description: "How Toone handles website, account, product, and analytics data, and what stays on your Mac.",
      siteName: "Toone",
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}

export default async function PrivacyPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") await redirectToEnglish("/en/privacy", searchParams);
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
          Updated: October 3, 2026
        </p>

        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Toone is built around local organization files and working context. This
          policy distinguishes that local product data from information you choose
          to submit through the website, waitlist, contact form, or account service,
          and from the features that send information off your Mac.
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
          Toone Editions
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Toone for Mac comes in two editions: <strong>Toone (Direct)</strong>,
          downloaded from trytoone.com, and <strong>Toone (Mac App Store)</strong>,
          distributed by Apple. Where the editions handle information differently,
          this policy says so.
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
          If you choose Sign in with Apple on the website, Apple returns an
          identity token: a statement signed by Apple that contains a stable Apple
          account identifier and, when available, your email address. That address
          may be an Apple private relay address if you chose to hide your email.
          The first time you authorize Toone, Apple may also provide your name. The
          website sends the identity token, that name, and any invitation code you
          are redeeming to the Toone account service, which checks Apple&apos;s
          signature and uses the identifier, email address, and name to find or
          create your Toone account. The website does not send Apple&apos;s
          authorization code to Toone, and Toone does not store Apple access or
          refresh tokens. Apple handles your authentication under its own{" "}
          <a
            href="https://www.apple.com/legal/privacy/"
            target="_blank"
            rel="noopener"
            style={{ color: "rgba(100,180,255,0.8)", textDecoration: "none" }}
          >
            privacy policy
          </a>
          .
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
          Usage Analytics
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Toone (Direct) sends usage events, such as &quot;an organization
          was created,&quot; to our self-hosted analytics (Umami). Events never
          include prompts, conversations, file contents, file paths, routine
          steps, agent instructions, or organization names. When you are signed
          in, events are linked to your Toone account ID, and your email, name,
          and public handle (if you have claimed one) are stored with the
          analytics session. When you are signed out, events use a random
          per-install identifier instead. You can turn usage analytics off at any
          time in Settings, which also discards events that have not been sent.
          Toone (Mac App Store) does not include usage analytics.
        </p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          With your permission, this website loads our self-hosted, cookieless
          analytics to count visits and clicks. Website analytics is not linked
          to your account. It sets no analytics cookies and does not track you
          across sites. Declining analytics does not affect your access to the
          site. You can change your choice at any time using{" "}
          <PrivacyChoicesButton />.
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
          Cookies &amp; Browser Storage
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Choosing a language in the language menu or the language suggestion
          stores a cookie named toone_locale for up to 12 months, so trytoone.com
          opens in that language next time. Dismissing the language suggestion
          stores toone.locale.dismissed in your browser&apos;s local storage,
          which is not sent to Toone. The site stores your analytics choice in
          your browser for up to six months.
          Sign-in stores an account session in your browser for authenticated
          features, until you sign out or the session expires. If you decline
          analytics, its script is not loaded; allowing it adds no analytics cookie.
          When a sign-in page shows the Sign in with Apple button, it loads
          Apple&apos;s sign-in script and button image from Apple&apos;s servers,
          so Apple receives ordinary connection information such as your IP
          address.
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
          Conversations, files, and project data are stored on your device. Toone
          does not upload that local working context to its account, website, or
          analytics services on its own. It leaves your Mac when you use a feature
          that needs it: requests to your AI provider, the cloud relay, Live Share,
          and sharing a routine on Explore, each described below. If you use speech
          input, macOS speech recognition turns your voice into text; depending on
          your language and system settings, Apple may process that audio on its
          servers. Account data, waitlist requests, contact requests, and Toone Pro
          purchases are handled separately as described in this policy.
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
          Toone connects to AI providers by letting you connect your own account.
          Toone (Direct) supports Anthropic Claude and OpenAI Codex; Toone (Mac App
          Store) supports OpenAI Codex only. You sign in through each
          provider&apos;s own command-line tool, which Toone runs for you and which
          opens the provider&apos;s sign-in page in your browser. When you send a
          message or run a routine, the request is transmitted directly from your
          device to the provider&apos;s API. A request can include your prompts and
          the files, tool output, and built-in browser content the agent works
          with. Toone does not proxy, log, or retain these requests.
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
          than readable conversation or project content. To pair and route
          connections, the relay stores the Mac and phone device identifiers and
          the IP address that created the connection. AI execution and project
          access remain on the Mac. The mobile connection is available in Toone
          (Direct), not in Toone (Mac App Store).
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
          Live Share and Explore
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          These features are available in Toone (Direct). When you use Live Share,
          Toone&apos;s services receive the information needed to run the share,
          including the email address of each person you invite, and pass the live
          session between your Mac and the people you approve. Those people can see
          the workspace content you make available to them.
        </p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          When you share a routine on Explore, the app sends Toone a public copy of
          it for review: its steps, agents, Skills, and any included files you
          confirm, together with its listing page and cover image. Approved
          listings are published on trytoone.com with your account name as the
          author.
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
          Toone Pro (Mac App Store)
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          In Toone (Mac App Store), Toone Pro is an in-app purchase. Apple
          processes the payment under its own terms and privacy policy; Toone does
          not receive your payment card details. The app attaches a random
          identifier for your Toone account to the purchase, then sends Toone&apos;s
          server the signed transaction record Apple provides and, for
          subscriptions, Apple&apos;s signed renewal information. Toone&apos;s
          server can also receive signed notifications from Apple when a purchase
          renews, expires, or is refunded. The server checks Apple&apos;s signature
          and stores what it needs to grant Pro: the purchase identifier, the
          product, whether it is a subscription or a lifetime purchase, its status,
          its expiry, grace-period, and revocation dates, whether it renews
          automatically, the App Store environment, and when Apple signed the
          latest update.
        </p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Without Pro, an account can create a limited number of routines. To
          count them, Toone&apos;s server records each routine creation with a
          random ID, the time, and whether it counted. The app also sends
          Apple&apos;s signed app-transaction record when it can, and Toone stores
          its app-transaction ID so the free limit applies once per Apple Account.
        </p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          If you have Pro, you can give someone a guest month by entering their
          email address. Toone&apos;s server stores that address with the guest
          pass and emails the person an invitation that shows your account name,
          or your email address if your account has no name. So that each person
          receives at most one guest month, Toone also keeps a keyed hash of every
          address that activates one. If Toone gives you complimentary Pro, the
          grant is recorded with your email address, and Toone may email you
          before it ends.
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
          Toone (Direct) installers are available through authenticated Toone downloads.
          The service receives your account session token and ordinary connection information to authorise delivery.
          Existing Direct apps check public update feeds hosted by GitHub, which is subject to{" "}
          <a
            href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
            target="_blank"
            rel="noopener"
            style={{ color: "rgba(100,180,255,0.8)", textDecoration: "none" }}
          >
            GitHub&apos;s privacy policy
          </a>
          . GitHub receives ordinary connection information such as your IP address during an update check. Toone does not send your account credentials to GitHub for that check.
          Apple delivers Toone (Mac App Store) and its updates under Apple&apos;s own terms and privacy policy.
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
          If you have questions about this policy, contact our{" "}
          <a
              href="mailto:hello@trytoone.com"
            target="_blank"
            rel="noopener"
            style={{ color: "rgba(100,180,255,0.8)", textDecoration: "none" }}
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

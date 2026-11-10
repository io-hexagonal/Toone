import { setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/navigation";
import type { Metadata } from "next";
import { localeRobots, localeVersions } from "@/i18n/indexing";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { PrivacyChoicesButton } from "@/components/PrivacyChoices";
import { PRIVACY_CANONICAL, PRIVACY_UPDATED_DATE } from "@/lib/legal/privacy";
import { LEGAL_NOTICE_PATH, LINK_PRIVACY_URL, STRIPE_PRIVACY_URL } from "@/lib/legal/terms";
import { SITE_SESSION_COOKIE } from "@/lib/site-session";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: PageSearchParams;
};

const H2 = {
  fontSize: 16,
  fontWeight: 600,
  color: "rgba(255,255,255,0.9)",
  marginTop: 36,
  marginBottom: 12,
} as const;
const H3 = {
  fontSize: 14,
  fontWeight: 600,
  color: "rgba(255,255,255,0.82)",
  marginTop: 22,
  marginBottom: 8,
} as const;
const P = { fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 } as const;
const UL = { paddingLeft: 20, marginBottom: 12, fontSize: 14, color: "rgba(255,255,255,0.6)" } as const;
const LI = { marginBottom: 6 } as const;
const A = { color: "rgba(100,180,255,0.8)", textDecoration: "none" } as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Privacy Policy",
    description:
      "How Toone handles website, account, product, and analytics data, which data stays local on your Mac, and how to reach the team about a privacy request.",
    alternates: { canonical: PRIVACY_CANONICAL },
    robots: localeRobots(locale),
    other: localeVersions("/privacy", ["en"]),
    // R7: og:url must equal the canonical. Without a route-level `openGraph`
    // this page inherited the root layout's card, whose og:url is the locale
    // home, so the shared URL and the canonical disagreed.
    openGraph: {
      type: "website",
      url: PRIVACY_CANONICAL,
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
          Updated: {PRIVACY_UPDATED_DATE}
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
          If you choose Sign in with Apple on the website or in Toone (Mac App
          Store), Apple returns an identity token: a statement signed by Apple
          that contains a stable Apple account identifier and, when available, your
          email address. That address may be an Apple private relay address if you
          chose to hide your email. The first time you authorize Toone, Apple may
          also provide your name. The website or the app sends the identity token
          and that name to the Toone account service, together with any invitation
          code you are redeeming on the website. The account service checks
          Apple&apos;s signature and uses the identifier, email address, and name
          to find or create your Toone account. Neither the website nor the app
          sends Apple&apos;s authorization code to Toone, and Toone does not store
          Apple access or refresh tokens. The Mac app also keeps Apple&apos;s
          account identifier with your session on your Mac, so it can sign you out
          if you stop using Sign in with Apple with Toone. Apple handles your
          authentication under its own{" "}
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
          Signing in stores your account session in your browser&apos;s local
          storage (toone.session) and in a cookie named {SITE_SESSION_COOKIE}, so
          that pages for signed-in accounts can check that you are signed in. The
          cookie is httpOnly (scripts on the page cannot read it), is sent only to
          trytoone.com, and lasts until you sign out or the session expires, at
          most 30 days. Both are needed for signing in and are not used for
          analytics or advertising. If you decline
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
          that needs it: requests to your AI provider, the cloud relay, a Business,
          Live Share, sharing a routine on Explore, and sharing site maps with the
          Silk Network, each described below. If
          you use speech input, macOS speech recognition turns your voice into
          text; depending on your language and system settings, Apple may process
          that audio on its servers. Account data, waitlist requests, contact
          requests, and Toone Pro purchases are handled separately as described in
          this policy. When you buy Toone Pro on trytoone.com, the payment page
          is Stripe&apos;s checkout on checkout.stripe.com, which sets its own
          cookies under Stripe&apos;s policy; trytoone.com itself loads no Stripe
          script.
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
        </p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          The one exception is a small number of accounts Toone designates for
          Apple&apos;s App Review, so reviewers can try Toone (Mac App Store)
          without their own OpenAI account. For those accounts only, and only
          while a review campaign is running, the app sends AI requests to
          Toone&apos;s server, which forwards them to OpenAI under Toone&apos;s
          own API account and streams the answer back. Toone&apos;s server does
          not log the content of these requests. It keeps a spending record of
          each request&apos;s size and cost under a daily pseudonym, so the
          campaign&apos;s spending limits hold.
        </p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
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
              href="https://www.anthropic.com/legal/privacy"
              target="_blank"
              rel="noopener"
              style={{ color: "rgba(100,180,255,0.8)", textDecoration: "none" }}
            >
              Anthropic Privacy Policy
            </a>
          </li>
          <li style={{ marginBottom: 6 }}>
            <a
              href="https://openai.com/policies/privacy-policy/"
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
          Business, Live Share, and Explore
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Business and Live Share are available in Toone (Direct). If you set up a
          Business, Toone stores its name, the email address and role of each
          person you invite, and the names of the organizations you add to it, and
          emails each invited person an invitation that shows the Business name
          and your email address. When you use Live Share, Toone&apos;s services
          receive the information needed to run the share, including the email
          address of each person you invite, and pass the live session between your
          Mac and the people you approve. Those people can see the workspace
          content you make available to them.
        </p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          When you share a routine on Explore, the app sends Toone a public copy of
          it for review: its steps, agents, Skills, and any included files you
          confirm, together with its listing page and cover image. Toone keeps
          the submission linked to your account. Toone&apos;s team reviews it
          before it is published, with help from an AI reviewer that processes
          the submission through OpenAI under Toone&apos;s own account. Approved
          listings are published on trytoone.com with your account name as the
          author, and you can withdraw your own listings. Explore is available in
          both editions.
        </p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Browsing, searching, and installing from Explore does not send your
          account information. If you report a listing, Toone stores your account
          ID with the report, the listing, the reason you chose, and any note you
          add (up to 1,000 characters). Reviewers see the report but not who sent
          it. If you block a creator, Toone stores that you blocked them so the
          app can hide their listings for you; the creator is not told. Toone
          keeps resolved reports as long as it needs them for moderation and
          safety.
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
          Silk Network
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          When an agent saves or repairs a site map for a website in Toone&apos;s
          built-in browser, the app can share the change with the Silk Network so
          other Toone users can automate the same site. Sharing is on by default.
          You can turn it off with the &quot;Share site maps with the Silk
          Network&quot; option during setup, or later by right-clicking Your Site
          Integrations in your organization and choosing Stop Sharing Site Maps
          with Network.
        </p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          Before anything is sent, the app compares the change with the published
          version and scans it on your Mac for email addresses, tokens, and other
          sensitive values; a change with findings is not shared. Your AI provider
          then reviews the change as part of your normal AI usage. Only a change
          that passes both checks is sent to Toone, with your account: the
          site&apos;s domain, name, and logo address, and the changed page
          structure, such as selectors, URL patterns, and flow steps, with typed
          values replaced by placeholders. Toone&apos;s team reviews it, and
          approved changes are published to all Toone users, with you credited as
          the contributor.
        </p>

        <h2 id="toone-pro" style={H2}>
          Toone Pro
        </h2>
        <p style={P}>
          Toone Pro is the optional upgrade for your Toone account. Toone uses the
          information below only to give Pro to the right account, to apply the
          free plan, codes, and guest months, to handle refunds, cancellations,
          and withdrawals, to keep the records tax law requires, and to prevent
          abuse. The terms of Toone Pro are on the{" "}
          <a href="/en/terms#toone-pro" style={A}>
            Terms page
          </a>
          .
        </p>

        <h3 id="toone-pro-web" style={H3}>
          Buying on trytoone.com (Stripe and Link)
        </h3>
        <p style={P}>
          Toone Pro is sold on trytoone.com through Stripe&apos;s Managed
          Payments service. The payment page runs on Stripe&apos;s servers, and
          the seller of the transaction is Sold through Link, LLC
          (&quot;Link&quot;), a Stripe company. Toone never receives your full
          card number or other payment-method details.
        </p>
        <p style={P}>
          When you start checkout, Toone&apos;s server tells Stripe which plan you
          chose and which Toone account is buying, and can give Stripe your
          account email address so checkout is filled in for you. Stripe and Link collect what they need to take the
          payment: your name, email address, billing country and address, and
          payment method, plus your IP address and country as evidence of where
          VAT or sales tax is due. Stripe then sends Toone&apos;s server what it
          needs to give you Pro and keep records: the Stripe customer,
          subscription, checkout and invoice identifiers, the plan, price,
          currency, tax and any discount, the payment status, the current period
          and its end date, whether the subscription renews, and any refund or
          payment dispute. Toone also records when you agreed to Toone Pro
          starting straight away and which version of that text you saw. Link
          sends your receipts and invoices.
        </p>
        <p style={P}>
          Stripe processes this data for Toone as a service provider, to run
          Toone&apos;s payments. Stripe and Link are also independent controllers
          for their own purposes, as the seller of the transaction and to meet
          their legal, tax, fraud-prevention, and compliance obligations, under
          the{" "}
          <a href={STRIPE_PRIVACY_URL} target="_blank" rel="noopener" style={A}>
            Stripe Privacy Policy
          </a>{" "}
          and the{" "}
          <a href={LINK_PRIVACY_URL} target="_blank" rel="noopener" style={A}>
            Link Privacy Policy
          </a>
          . Stripe is based in Ireland and the United States and may process the
          data in the United States and other countries, relying on the EU-U.S.
          Data Privacy Framework and the European Commission&apos;s Standard
          Contractual Clauses.
        </p>
        <p style={P}>
          If you use Cancel contract here or Withdraw from contract here on
          trytoone.com, Toone receives the email address and order reference you
          enter and which of the two you chose, uses them to find and end your
          purchase, and emails you a confirmation. The request is kept with the
          purchase records.
        </p>

        <h3 id="toone-pro-app-store" style={H3}>
          Toone (Mac App Store) and Apple
        </h3>
        <p style={P}>
          Toone Pro is not sold in Toone (Mac App Store) yet. When it is sold
          there as an in-app purchase, Apple processes the payment under its own terms and privacy policy; Toone does
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

        <h3 id="free-plan" style={H3}>
          The free plan and codes
        </h3>
        <p style={P}>
          Without Pro, an account can create a limited number of routines. To
          count them, Toone&apos;s server records each routine creation with a
          random ID, the time, and whether it counted. In Toone (Mac App Store),
          the app also sends Apple&apos;s signed app-transaction record when it
          can, and Toone stores its app-transaction ID so the free limit applies
          once per Apple Account.
        </p>
        <p style={P}>
          When you check or redeem a code, Toone records which code was used, when,
          by which account, where it was redeemed, and what it gave (days of Pro,
          Pro for life, or extra routine creations). So that the same person
          cannot redeem a code again with a new account, Toone also keeps a keyed
          hash of the email address that redeemed it, without the address itself.
          Discount codes entered at checkout are handled by Stripe, and Toone
          receives which discount was applied.
        </p>

        <h3 style={H3}>
          Guest months and complimentary Pro
        </h3>
        <p style={P}>
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
          Deleting Your Account
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
          In Toone (Mac App Store), you can delete your Toone account under
          Settings &rarr; Account. You can also ask us using the contact details
          below. Deletion erases your name, email address, and sign-in details
          from your account and removes your sessions. Your Explore listings are
          unpublished and their content is erased, and pending submissions are
          withdrawn. Reports you sent stay with the listing they are about, but
          lose your account ID and your note. Blocks you made, and blocks others
          placed on you, are deleted. Pending Silk Network changes are withdrawn,
          and published ones stay, credited to a former contributor.
        </p>
        <p style={P}>
          If you have a Toone Pro subscription bought on trytoone.com, deleting
          your account cancels it at Stripe straight away, so you are not charged
          again. Invoices and the records of your purchases, refunds, and codes are
          kept for as long as tax and accounting law requires, but are no longer
          linked to your Toone account. Link keeps its own records of the
          transaction and lets you ask it to delete your Link data separately.
        </p>
        <p style={P}>
          App Store purchase records for Toone Pro are kept as records of the
          purchase but are no longer linked to you; if you later sign in to a new
          account and restore the purchase, it can be linked to that account.
          Deleting your account does not cancel an Apple subscription. Apple keeps
          its own records of your purchases.
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

        <h2 id="third-parties" style={H2}>
          Service Providers and Other Third Parties
        </h2>
        <p style={P}>
          Toone does not sell your personal data or share it for advertising.
          It shares personal data only with the service providers it needs to run
          the features described in this policy, and only for those features:
        </p>
        <ul style={UL}>
          <li style={LI}>
            <strong>Toone&apos;s hosting providers</strong> run the
            trytoone.com website (Vercel) and Toone&apos;s server, which provides the
            account service, the cloud relay, Explore, the Silk Network, and Toone Pro.
          </li>
          <li style={LI}>
            <strong>Stripe</strong> runs checkout and payments for Toone Pro bought on
            trytoone.com, as described under Toone Pro.
          </li>
          <li style={LI}>
            <strong>Resend</strong> delivers the emails Toone sends, such as
            Business and guest-month invitations, Toone Pro notices, cancellation and
            withdrawal confirmations, and account deletion notices.
          </li>
          <li style={LI}>
            <strong>OpenAI</strong> processes Explore submissions for the AI
            reviewer, and App Review requests during a review campaign, under
            Toone&apos;s own API account, as described above.
          </li>
          <li style={LI}>
            <strong>Discord</strong> receives the messages you send through
            the website&apos;s contact form, so the team can read and answer them.
          </li>
        </ul>
        <p style={P}>
          These providers may use personal data only to provide their service
          to Toone. Toone requires each of them, through its contract and
          data-processing terms, to protect personal data with the same or equal
          protection as this policy. Some of them are based in the United States or
          process data there; those transfers rely on safeguards recognised under
          European law, such as the EU-U.S. Data Privacy Framework or the European
          Commission&apos;s Standard Contractual Clauses.
        </p>
        <p style={P}>
          Apple (for App Store distribution, in-app purchases, and Sign in with
          Apple), Stripe and Link (for their own purposes as the seller of web
          purchases, as described under Toone Pro), GitHub (for Toone (Direct)
          update feeds and any issue you report there), and the AI provider you
          connect with your own account handle your data as independent companies,
          under their own terms and privacy policies. Toone may also disclose
          information when the law requires it.
        </p>

        <h2 id="retention" style={H2}>
          How Long We Keep Data
        </h2>
        <ul style={UL}>
          <li style={LI}>
            <strong>Account data</strong> (your name, email address, sign-in
            details, and sessions) is kept while your account exists and erased when
            you delete it, as described in Deleting Your Account.
          </li>
          <li style={LI}>
            <strong>Content you publish</strong> on Explore stays published
            until you withdraw it or delete your account. Silk Network changes stay as
            described in Deleting Your Account. Reports are kept as long as Toone needs
            them for moderation and safety.
          </li>
          <li style={LI}>
            <strong>Toone Pro purchase records</strong>, from Stripe or from Apple,
            and the invoices for web purchases, are kept while your account exists.
            After you delete your account, Toone keeps them only as records of the
            purchase, for as long as accounting, tax, and other legal obligations
            require (in Portugal, usually ten years) and to handle refunds and
            prevent fraud. They are no longer linked to you. The record of free
            routine creations is kept without your Toone identity, together with
            Apple&apos;s app-transaction ID where there is one, so the free limit
            still applies once per Apple Account.
          </li>
          <li style={LI}>
            <strong>Codes</strong>: the record of each redemption is kept with the
            purchase records. The keyed hash of the email address that redeemed a code
            is kept, without the address itself, for as long as the code exists.
          </li>
          <li style={LI}>
            <strong>Guest months</strong>: a pending invitation is deleted
            when the person who sent it deletes their account. Toone keeps a keyed hash
            of each address that activated a guest month, without the address itself,
            so that each person receives at most one.
          </li>
          <li style={LI}>
            <strong>Waitlist and contact requests</strong> are kept as long as
            needed to answer you and administer early access.
          </li>
        </ul>
        <p style={P}>
          Toone may keep a specific record longer when the law requires it, or
          when it is needed to resolve a dispute or a security incident.
        </p>

        <h2 id="controller" style={H2}>
          Who Is Responsible for Your Data
        </h2>
        <p style={P}>
          Toone is published by Matheus Paranhos, an individual developer
          based in Portugal, under the Hexagonal.io name. He is the controller of the
          personal data described in this policy and can be reached at
          hello@trytoone.com. His full contact details are in the{" "}
          <a href={`/en${LEGAL_NOTICE_PATH}`} style={A}>
            Legal notice
          </a>
          .
        </p>
        <p style={P}>
          Toone processes personal data to provide the services you ask for,
          such as your account, Toone Pro, codes, guest months, Explore, the Silk
          Network, Business, and Live Share, which includes taking and refunding
          payments for Toone Pro; to meet legal obligations, such as keeping
          invoices and purchase records for tax purposes; and for its legitimate
          interests in keeping the service secure, preventing abuse of the free
          plan, codes, and guest months, preventing payment fraud, moderating
          Explore, and understanding how Toone (Direct) is used. Website analytics
          loads only with your consent.
        </p>

        <h2 id="your-rights" style={H2}>
          Your Rights
        </h2>
        <p style={P}>
          You can ask to access, correct, delete, or receive a copy of your
          personal data, to restrict or object to how it is used, and to withdraw
          any consent you gave. To make a request, email hello@trytoone.com from
          the address on your account; Toone answers within one month. You can also
          act directly: delete your account in Toone (Mac App Store) under Settings
          &rarr; Account, turn usage analytics off in Toone (Direct) Settings, stop
          sharing site maps with the Silk Network, and change your website
          analytics choice at any time. For data that Stripe and Link hold as
          independent controllers, you can also contact them directly.
        </p>
        <p style={P}>
          If you think your data has been handled unlawfully, you can complain
          to a data protection authority. In Portugal, that is the Comiss&atilde;o
          Nacional de Prote&ccedil;&atilde;o de Dados (
          <a href="https://www.cnpd.pt" target="_blank" rel="noopener" style={A}>
            cnpd.pt
          </a>
          ); you can also contact the authority where you live or work.
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
          Toone is published by Matheus Paranhos (Hexagonal.io), Portugal.{" "}
          <a href={`/en${LEGAL_NOTICE_PATH}`} style={{ color: "inherit" }}>
            Legal notice
          </a>
        </p>
      </div>
    </main>
  );
}

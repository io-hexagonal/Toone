import type { ReactNode } from "react";
import { PrivacyChoicesButton } from "@/components/PrivacyChoices";
import { LOCALE_CHOICE_COOKIE } from "@/i18n/routing";
import { LOCALE_DISMISSED_KEY } from "@/lib/locale-preference";
import { SITE_SESSION_COOKIE } from "@/lib/site-session";
import { CHECKOUT_KEY_PREFIX, ORDER_REF_KEY_PREFIX } from "@/lib/billing/purchase-storage";
import { PENDING_CODE_STORAGE_KEY } from "@/lib/billing/pending-code";
import { CHECKOUT_SESSION_STORAGE_KEY } from "@/components/billing/CheckoutReturn.helpers";
import { FROM_APP_STORAGE_KEY } from "@/components/billing/PricingPlans.helpers";
import {
  ANALYTICS_CHOICE_STORAGE_KEY,
  PRIVACY_CONTACT,
  PRIVACY_MIN_AGE,
  PRIVACY_PURPOSES,
  SESSION_STORAGE_KEY,
  privacyRecipients,
  privacyRetention,
} from "@/lib/legal/privacy";
import {
  LINK_SELLER_ENTITY,
  STRIPE_EU_ENTITY,
  newPurchasesSentence,
  type TooneProSeller,
} from "@/lib/legal/seller";
import { TRADER_DETAILS_COMPLETE } from "@/lib/legal/trader";
import {
  APPLE_STANDARD_EULA_URL,
  CANCEL_CONTRACT_PATH,
  LEGAL_NOTICE_PATH,
  LINK_PRIVACY_URL,
  STRIPE_PRIVACY_URL,
  TOONE_PRO_FIRST_PAYMENT_REFUND_DAYS,
  TOONE_PRO_GUEST_PASS_MARGIN_DAYS,
} from "@/lib/legal/terms";

type ContentProps = {
  /**
   * Who sells NEW purchases, as the API says (null when it does not say).
   * The policy describes both sellers whatever it is; this only adds the
   * "new purchases are currently sold …" sentence.
   */
  seller?: TooneProSeller | null;
  /**
   * Whether the Legal notice is published (lib/legal/trader.ts complete).
   * While it is not, the policy points to the contact email instead of
   * linking to it.
   */
  traderDetails?: boolean;
};

const CONTACT = PRIVACY_CONTACT;
const REFUND_DAYS = TOONE_PRO_FIRST_PAYMENT_REFUND_DAYS;
const ext = { target: "_blank", rel: "noopener" } as const;

/**
 * Who sells Toone Pro on the web, and who controls the payment data. Both
 * ways are always described: a purchase keeps the seller it was made under,
 * so after a switch the buyers of either still find their own text here.
 */
function WebPurchase({ seller, traderDetails }: { seller: TooneProSeller | null; traderDetails: boolean }) {
  const current = newPurchasesSentence(seller);
  return (
    <>
      <p id="seller-of-your-purchase">
        Toone Pro on trytoone.com is sold in one of two ways: sold through Link, or sold by Toone.
        Checkout shows which one applies before you pay, your purchase confirmation email names it,
        and a purchase keeps it for its renewals and refunds, even if Toone later changes how it
        sells Toone Pro. What follows under each heading applies only to purchases sold that way.
        {current ? <> {current}</> : null}
      </p>

      <h4 id="sold-through-link">Purchases sold through Link</h4>
      <p>
        These are sold through Stripe&apos;s Managed Payments service. The payment page runs on
        Stripe&apos;s servers, and the seller of the transaction is {LINK_SELLER_ENTITY}{" "}
        (&quot;Link&quot;), a Stripe company. Toone never receives your full card number or other
        payment-method details.
      </p>
      <p>
        When you start checkout, Toone&apos;s server tells Stripe which plan you chose and which
        Toone account is buying. Stripe and Link collect what they need to take the payment: your name,
        email address, billing country and address, and payment method, plus your IP address and
        country as evidence of where VAT or sales tax is due. Stripe then sends Toone&apos;s
        server what it needs to give you Toone Pro and keep records: the Stripe customer,
        subscription, checkout and invoice identifiers, the plan, price, currency, tax and any
        discount, the payment status, the current period and its end date, whether the
        subscription renews, and any refund or payment dispute. Link sends your receipts and
        invoices.
      </p>
      <p>
        Stripe processes this data for Toone as a service provider, to run Toone&apos;s payments.
        Stripe and Link are also independent controllers for their own purposes, as the seller of
        the transaction and to meet their legal, tax, fraud-prevention and compliance
        obligations, under the{" "}
        <a href={STRIPE_PRIVACY_URL} {...ext}>
          Stripe Privacy Policy
        </a>{" "}
        and the{" "}
        <a href={LINK_PRIVACY_URL} {...ext}>
          Link Privacy Policy
        </a>
        . You can ask Link to delete the data it holds as the seller separately.
      </p>

      <h4 id="sold-by-toone">Purchases sold by Toone</h4>
      <p>
        For these, the seller is{" "}
        {traderDetails ? (
          <>the trader named in the <a href={`/en${LEGAL_NOTICE_PATH}`}>Legal notice</a></>
        ) : (
          <>Toone&apos;s publisher, named under <a href="#controller">Who is responsible for your data</a></>
        )}
        , who is also the controller of the purchase data. Payments are processed by {STRIPE_EU_ENTITY} (&quot;Stripe&quot;), in
        Ireland, on Stripe&apos;s checkout page. Toone never receives your full card number or
        other payment-method details.
      </p>
      <p>
        When you start checkout, Toone&apos;s server tells Stripe which plan you chose and which
        Toone account is buying. Checkout collects your name, email address, billing country and address,
        payment method and, if you buy for a business, its name and VAT number. Stripe Tax,
        Stripe&apos;s tax service, uses your billing address, and your IP address and country as
        evidence, to work out the VAT due. A VAT number is checked in VIES, the EU&apos;s VAT
        register. Stripe then sends Toone&apos;s server the Stripe customer, subscription, checkout
        and invoice identifiers, the plan, price, currency, tax and any discount, the payment
        status, the current period and its end date, whether the subscription renews, and any
        refund or payment dispute.
      </p>
      <p>
        For every accepted payment, Toone issues a Portuguese legal invoice, and a credit note for
        every refund of one, and emails each to you as a PDF. A payment refused because Toone Pro
        can&apos;t be sold yet to its billing country is refunded in full and gets neither. Each invoice carries the name, country and tax
        number you gave at checkout and the amount and VAT, and its details are communicated to
        the Portuguese tax authority, as Portuguese law requires. Stripe also sends you its own
        receipt for each payment.
      </p>
      <p>
        Stripe processes payment data for Toone as a processor. Stripe is also an independent
        controller for its own fraud-prevention, legal and compliance purposes, under the{" "}
        <a href={STRIPE_PRIVACY_URL} {...ext}>
          Stripe Privacy Policy
        </a>
        .
      </p>
    </>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="trust-table">
      <table>
        <thead>
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyContent({ seller = null, traderDetails = TRADER_DETAILS_COMPLETE }: ContentProps) {
  const recipients = privacyRecipients();
  const retention = privacyRetention();

  return (
    <>
      <section id="controller">
        <h2>Who is responsible for your data</h2>
        <p>
          Toone is published by Matheus Paranhos, an individual trader based in Portugal, under the
          Hexagonal.io name. He is the controller of the personal data described in this policy and
          can be reached at <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          {traderDetails ? (
            <>
              {" "}His full name, address and tax number are in the{" "}
              <a href={`/en${LEGAL_NOTICE_PATH}`}>Legal notice</a>.
            </>
          ) : (
            <> His address and tax number are available on request at the same email address.</>
          )}{" "}
          Toone has not appointed a data protection officer, because the law does not require one
          for its activity.
        </p>
        <p>
          When you buy Toone Pro on trytoone.com, who controls your purchase data depends on how
          your purchase is sold. For a purchase sold through Link, {LINK_SELLER_ENTITY} is the
          seller of the transaction and decides, for its own purposes, how it uses your payment
          data. For a purchase sold by Toone, the same trader is the seller and the controller of
          your purchase data. See Toone Pro below.
        </p>
      </section>

      <section id="editions">
        <h2>Toone editions</h2>
        <p>
          Toone for Mac comes in two editions: <strong>Toone (Direct)</strong>, downloaded from
          trytoone.com, and <strong>Toone (Mac App Store)</strong>, distributed by Apple. Where the
          editions handle information differently, this policy says so.
        </p>
      </section>

      <section id="local-data">
        <h2>Local product data</h2>
        <p>
          Toone is built around local organization files and working context. Toone does not
          receive them merely because you use the desktop app. That includes:
        </p>
        <ul>
          <li>Conversation content and chat history stored in your organization</li>
          <li>File contents and project data stored on your device</li>
          <li>Local checkpoints and organization history</li>
          <li>Keystrokes, screenshots, or screen recordings</li>
        </ul>
        <p>
          That working context leaves your Mac only when you use a feature that needs it: requests
          to your AI provider, the cloud relay, a Business, Live Share, sharing a routine on
          Explore, and sharing site maps with the Silk Network, each described below. If you use
          speech input, macOS speech recognition turns your voice into text; depending on your
          language and system settings, Apple may process that audio on its servers.
        </p>
      </section>

      <section id="information-you-submit">
        <h2>Information you submit</h2>
        <p>
          We receive information you deliberately provide when you create or sign in to an account,
          join the early-access waitlist, or send a contact request. Depending on the action, this
          can include your name, email, company, message, and authentication data. Waitlist
          entries are sent to the Toone backend, contact requests are delivered to the team&apos;s
          communications system, and account data is processed by the Toone account service.
        </p>
        <p>
          If you choose Sign in with Apple on the website or in Toone (Mac App Store), Apple returns
          an identity token: a statement signed by Apple that contains a stable Apple account
          identifier and, when available, your email address. That address may be an Apple private
          relay address if you chose to hide your email. The first time you authorize Toone, Apple
          may also provide your name. The website or the app sends the identity token and that name
          to the Toone account service, together with any invitation code you are redeeming on the
          website. The account service checks Apple&apos;s signature and uses the identifier, email
          address, and name to find or create your Toone account. Neither the website nor the app
          sends Apple&apos;s authorization code to Toone, and Toone does not store Apple access or
          refresh tokens. The Mac app also keeps Apple&apos;s account identifier with your session
          on your Mac, so it can sign you out if you stop using Sign in with Apple with Toone.
          Apple handles your authentication under its own{" "}
          <a href="https://www.apple.com/legal/privacy/" {...ext}>
            privacy policy
          </a>
          .
        </p>
        <p>
          If you choose Sign in with Google, Google returns a signed identity token with your
          Google account identifier, email address and name. The Toone account service checks
          Google&apos;s signature and uses them to find or create your Toone account. Toone does
          not receive your Google password or access to your Google data. Google handles your
          authentication under its own{" "}
          <a href="https://policies.google.com/privacy" {...ext}>
            privacy policy
          </a>
          .
        </p>
      </section>

      <section id="analytics">
        <h2>Usage analytics</h2>
        <p>
          Toone (Direct) sends usage events, such as &quot;an organization was created,&quot; to our
          self-hosted analytics (Umami). Events never include prompts, conversations, file contents,
          file paths, routine steps, agent instructions, or organization names. When you are signed
          in, events are linked to your Toone account ID, and your email, name, and public handle
          (if you have claimed one) are stored with the analytics session. When you are signed out,
          events use a random per-install identifier instead. You can turn usage analytics off at
          any time in Settings, which also discards events that have not been sent. Toone (Mac App
          Store) does not include usage analytics.
        </p>
        <p>
          With your permission, this website loads the same self-hosted, cookieless analytics to
          count visits and clicks. Website analytics is not linked to your account, sets no
          cookies, does not track you across sites, and never includes form text, names, email
          addresses, passwords, authentication tokens, or account identifiers. Declining analytics
          does not affect your access to the site. You can change your choice at any time using{" "}
          <PrivacyChoicesButton />.
        </p>
      </section>

      <section id="cookies">
        <h2>Cookies and browser storage</h2>
        <p>
          trytoone.com sets two cookies, keeps up to five items in your browser&apos;s local storage
          and up to three in its session storage. All of them are needed for what you asked for,
          and none is used for analytics or advertising:
        </p>
        <Table
          head={["Name", "Kind", "What it does", "How long"]}
          rows={[
            [
              <code key="c">{SITE_SESSION_COOKIE}</code>,
              "Cookie, httpOnly",
              "Lets pages for signed-in accounts check that you are signed in. Scripts on the page cannot read it, and it is sent only to trytoone.com.",
              "Until you sign out or the session expires, at most 30 days",
            ],
            [
              <code key="c">{LOCALE_CHOICE_COOKIE}</code>,
              "Cookie",
              "Remembers the language you chose in the language menu or the language suggestion.",
              "12 months",
            ],
            [
              <code key="c">{SESSION_STORAGE_KEY}</code>,
              "Local storage",
              "Keeps your account session in your browser.",
              "Until you sign out or the session expires",
            ],
            [
              <code key="c">{ANALYTICS_CHOICE_STORAGE_KEY}</code>,
              "Local storage",
              "Remembers whether you allowed or declined analytics. It is not sent to Toone.",
              "Six months",
            ],
            [
              <code key="c">{LOCALE_DISMISSED_KEY}</code>,
              "Local storage",
              "Remembers that you dismissed the language suggestion. It is not sent to Toone.",
              "Until you clear it",
            ],
            [
              <code key="c">{ORDER_REF_KEY_PREFIX}…</code>,
              "Local storage",
              "Remembers, for your account, the order reference of your last Toone Pro purchase in this browser, so your account page can show it.",
              "Until you sign out",
            ],
            [
              <code key="c">{CHECKOUT_KEY_PREFIX}…</code>,
              "Local storage",
              "Remembers, for your account, the checkout of that purchase, so your account page can show the status of its invoice.",
              "Until you sign out",
            ],
            [
              <code key="c">{CHECKOUT_SESSION_STORAGE_KEY}</code>,
              "Session storage",
              "Keeps the checkout being confirmed, so reloading the payment confirmation page still works.",
              "Until you close the tab",
            ],
            [
              <code key="c">{FROM_APP_STORAGE_KEY}</code>,
              "Session storage",
              "Remembers that the Toone app opened the pricing page, so the confirmation page can offer a way back to the app.",
              "Until you close the tab",
            ],
            [
              <code key="c">{PENDING_CODE_STORAGE_KEY}</code>,
              "Session storage",
              "Keeps the code from a redeem link while you sign in.",
              "Until the code is redeemed, you sign out or you close the tab",
            ],
          ]}
        />
        <p>
          If you decline analytics, its script is not loaded; allowing it adds no cookie.
          trytoone.com sets no Stripe cookies and loads no Stripe script. When you buy Toone Pro or
          manage a subscription, you leave trytoone.com for Stripe&apos;s checkout on
          checkout.stripe.com or Stripe&apos;s billing portal on billing.stripe.com, which set their
          own cookies under Stripe&apos;s policy (and, for a purchase sold through Link, under
          Link&apos;s policy). When a sign-in page shows the
          Sign in with Apple or Sign in with Google button, it loads that company&apos;s sign-in
          script from its servers, so Apple or Google receives ordinary connection information such
          as your IP address, and Google may use its own cookies on its own domain.
        </p>
      </section>

      <section id="ai-providers">
        <h2>Third-party AI providers</h2>
        <p>
          Toone connects to AI providers by letting you connect your own account. Toone (Direct)
          supports Anthropic Claude and OpenAI Codex; Toone (Mac App Store) supports OpenAI Codex
          only. You sign in through each provider&apos;s own command-line tool, which Toone runs for
          you and which opens the provider&apos;s sign-in page in your browser. When you send a
          message or run a routine, the request is transmitted directly from your device to the
          provider&apos;s API. A request can include your prompts and the files, tool output, and
          built-in browser content the agent works with. Toone does not proxy, log, or retain these
          requests.
        </p>
        <p>
          The one exception is a small number of accounts Toone designates for Apple&apos;s App
          Review, so reviewers can try Toone (Mac App Store) without their own OpenAI account. For
          those accounts only, and only while a review campaign is running, the app sends AI
          requests to Toone&apos;s server, which forwards them to OpenAI under Toone&apos;s own API
          account and streams the answer back. Toone&apos;s server does not log the content of these
          requests. It keeps a spending record of each request&apos;s size and cost under a daily
          pseudonym, so the campaign&apos;s spending limits hold.
        </p>
        <p>
          Please refer to your chosen provider&apos;s privacy policy for how they handle your data:{" "}
          <a href="https://www.anthropic.com/legal/privacy" {...ext}>
            Anthropic Privacy Policy
          </a>
          ,{" "}
          <a href="https://openai.com/policies/privacy-policy/" {...ext}>
            OpenAI Privacy Policy
          </a>
          .
        </p>
      </section>

      <section id="mobile">
        <h2>Mobile companion app</h2>
        <p>
          The Toone mobile app connects to a running Toone Desktop instance over a direct
          local-network WebSocket or the optional Toone cloud relay. The cloud-relay transport uses
          TLS plus application-level end-to-end encryption, so the relay forwards encrypted
          application frames rather than readable conversation or project content. To pair and
          route connections, the relay stores the Mac and phone device identifiers and the IP
          address that created the connection. AI execution and project access remain on the Mac.
          The mobile connection is available in Toone (Direct), not in Toone (Mac App Store).
        </p>
      </section>

      <section id="business-explore">
        <h2>Business, Live Share, and Explore</h2>
        <p>
          Business and Live Share are available in Toone (Direct). If you set up a Business, Toone
          stores its name, the email address and role of each person you invite, and the names of
          the organizations you add to it, and emails each invited person an invitation that shows
          the Business name and your email address. When you use Live Share, Toone&apos;s services
          receive the information needed to run the share, including the email address of each
          person you invite, and pass the live session between your Mac and the people you approve.
          Those people can see the workspace content you make available to them.
        </p>
        <p>
          When you share a routine on Explore, the app sends Toone a public copy of it for review:
          its steps, agents, Skills, and any included files you confirm, together with its listing
          page and cover image. Toone keeps the submission linked to your account. Toone&apos;s team
          reviews it before it is published, with help from an AI reviewer that processes the
          submission through OpenAI under Toone&apos;s own account. Approved listings are published
          on trytoone.com with your account name as the author, and you can withdraw your own
          listings. Explore is available in both editions.
        </p>
        <p>
          Browsing, searching, and installing from Explore does not send your account information.
          If you report a listing, Toone stores your account ID with the report, the listing, the
          reason you chose, and any note you add (up to 1,000 characters). Reviewers see the report
          but not who sent it. If you block a creator, Toone stores that you blocked them so the app
          can hide their listings for you; the creator is not told.
        </p>
      </section>

      <section id="silk-network">
        <h2>Silk Network</h2>
        <p>
          When an agent saves or repairs a site map for a website in Toone&apos;s built-in browser,
          the app can share the change with the Silk Network so other Toone users can automate the
          same site. Sharing is on by default. You can turn it off with the &quot;Share site maps
          with the Silk Network&quot; option during setup, or later by right-clicking Your Site
          Integrations in your organization and choosing Stop Sharing Site Maps with Network.
        </p>
        <p>
          Before anything is sent, the app compares the change with the published version and scans
          it on your Mac for email addresses, tokens, and other sensitive values; a change with
          findings is not shared. Your AI provider then reviews the change as part of your normal
          AI usage. Only a change that passes both checks is sent to Toone, with your account: the
          site&apos;s domain, name, and logo address, and the changed page structure, such as
          selectors, URL patterns, and flow steps, with typed values replaced by placeholders.
          Toone&apos;s team reviews it, and approved changes are published to all Toone users, with
          you credited as the contributor.
        </p>
      </section>

      <section id="toone-pro">
        <h2>Toone Pro</h2>
        <p>
          Toone Pro is the optional upgrade for your Toone account. Toone uses the information below
          only to give Toone Pro to the right account, to apply the free plan, codes, and guest
          months, to handle refunds, cancellations, and withdrawals, to keep the records tax law
          requires, and to prevent abuse. The terms of Toone Pro are on the{" "}
          <a href="/en/terms#toone-pro">Terms page</a>.
        </p>

        <h3 id="toone-pro-web">Buying on trytoone.com</h3>
        <WebPurchase seller={seller} traderDetails={traderDetails} />

        <h3 id="withdrawal-records">Your consent, withdrawals and cancellations</h3>
        <p>
          At checkout you ask for Toone Pro to start straight away and confirm what that means for
          your withdrawal right. Toone records when you agreed and which version of that text you
          saw.
        </p>
        <p>
          If you use Cancel contract here or Withdraw from contract here on trytoone.com (
          <a href={`/en${CANCEL_CONTRACT_PATH}`}>trytoone.com/cancel-contract</a>), Toone receives
          the email address and order reference you enter, your name if you add it, which of the
          two you chose and, for a cancellation, the type of termination, the reason you give for
          an extraordinary one and the end date you ask for. The email address is compared with
          your Toone account&apos;s address and with the one entered at checkout for that order,
          which Toone reads from Stripe. If they match a purchase, the request takes effect when it
          is received: a withdrawal ends Toone Pro from that purchase and refunds the payment
          through Stripe, as the <a href="/en/terms#withdrawal">Terms</a> describe; a cancellation
          stops the renewal. Toone emails that address an acknowledgement with what you declared,
          the date and time it was received and what was done. Toone stores the request with a
          keyed hash of the email address, never the address itself, together with your name if
          you gave it, the order, the termination details, when the request was made and carried
          out, any refund, and its outcome.
        </p>

        <h3 id="toone-pro-app-store">Toone (Mac App Store) and Apple</h3>
        <p>
          Toone (Mac App Store) has no Stripe checkout and no web purchase: it does not sell Toone
          Pro through Stripe and does not link to trytoone.com to buy it. Apple distributes it under Apple&apos;s terms, including
          Apple&apos;s{" "}
          <a href={APPLE_STANDARD_EULA_URL} {...ext}>
            standard End User License Agreement
          </a>
          , and Apple&apos;s privacy policy applies to what Apple processes there.
        </p>
        <p>
          Toone Pro is not sold in Toone (Mac App Store) yet. When it is sold there as an in-app
          purchase, Apple processes the payment under its own terms and privacy policy; Toone does
          not receive your payment card details. The app attaches a random identifier for your
          Toone account to the purchase, then sends Toone&apos;s server the signed transaction record
          Apple provides and, for subscriptions, Apple&apos;s signed renewal information.
          Toone&apos;s server can also receive signed notifications from Apple when a purchase
          renews, expires, or is refunded. The server checks Apple&apos;s signature and stores what
          it needs to grant Toone Pro: the purchase identifier, the product, whether it is a
          subscription or a lifetime purchase, its status, its expiry, grace-period, and revocation
          dates, whether it renews automatically, the App Store environment, and when Apple signed
          the latest update.
        </p>

        <h3 id="free-plan">The free plan and codes</h3>
        <p>
          Without Toone Pro, an account can create a limited number of routines. To count them,
          Toone&apos;s server records each routine creation with a random ID, the time, and whether
          it counted. In Toone (Mac App Store), the app also sends Apple&apos;s signed
          app-transaction record when it can, and Toone stores its app-transaction ID so the free
          limit applies once per Apple Account. Extra routine creations that a code or Toone gives
          your account are recorded with the account.
        </p>
        <p>
          When you check or redeem a code, Toone records which code was used, when, by which
          account, where it was redeemed, and what it gave (days of Toone Pro, Toone Pro for life,
          or extra routine creations). So that the same person cannot redeem a code again with a
          new account, Toone also keeps a keyed hash of the email address that redeemed it, without
          the address itself; the hash stays after the account is deleted, for as long as the code
          exists. Discount codes entered at checkout are handled by Stripe, and Toone receives which
          discount was applied.
        </p>

        <h3 id="guest-months">Guest months and complimentary Toone Pro</h3>
        <p>
          If you have bought Toone Pro, you can give someone a guest month by entering their email
          address. For a purchase on the web, this becomes possible{" "}
          {TOONE_PRO_FIRST_PAYMENT_REFUND_DAYS + TOONE_PRO_GUEST_PASS_MARGIN_DAYS} days after the
          purchase, once its withdrawal period has passed, and not while a withdrawal from it is
          pending or after it has been withdrawn. Toone&apos;s server stores that address with the guest pass and emails the person
          an invitation that shows your account name, or your email address if your account has no
          name. So that each person receives at most one guest month, Toone also keeps a keyed hash
          of every address that activates one. If Toone gives you complimentary Toone Pro, the grant
          is recorded with your email address, and Toone may email you before it ends.
        </p>
      </section>

      <section id="deleting-your-account">
        <h2>Deleting your account</h2>
        <p>
          In Toone (Mac App Store), you can delete your Toone account under Settings &rarr; Account.
          You can also ask us using the contact details above. Deletion erases your name, email
          address, and sign-in details from your account and removes your sessions. Your Explore
          listings are unpublished and their content is erased, and pending submissions are
          withdrawn. Reports you sent stay with the listing they are about, but lose your account
          ID and your note. Blocks you made, and blocks others placed on you, are deleted. Pending
          Silk Network changes are withdrawn, and published ones stay, credited to a former
          contributor. Extra routine creations are deleted.
        </p>
        <p>
          If you have a Toone Pro subscription bought on trytoone.com, deleting your account
          cancels it at Stripe straight away, so you are not charged again. If you paid for it less
          than {REFUND_DAYS} days before, it is refunded as for a withdrawal (see the{" "}
          <a href="/en/terms#withdrawal">Terms</a>); otherwise nothing is refunded. Invoices and
          the records of your purchases and refunds are kept for as long as tax and accounting law
          requires. They stay under your former account&apos;s ID, but your name and email address
          are erased from the account itself. The Stripe customer record they point to, with the
          name, email address and billing address you gave at checkout, and its invoices stay at
          Stripe. Code redemption records lose the link to your account. For a purchase sold through
          Link, Link keeps its own records of the transaction and lets you ask it to delete your
          Link data separately.
        </p>
        <p>
          App Store purchase records for Toone Pro are kept as records of the purchase but are no
          longer linked to you; if you later sign in to a new account and restore the purchase, it
          can be linked to that account. Deleting your account does not cancel an Apple
          subscription. Apple keeps its own records of your purchases.
        </p>
      </section>

      <section id="diagnostics-updates">
        <h2>Crash reports, diagnostics and updates</h2>
        <p>
          Toone does not include any crash reporting or diagnostic SDKs. If you choose to report an
          issue via GitHub, any information you share is voluntary and governed by{" "}
          <a
            href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
            {...ext}
          >
            GitHub&apos;s privacy statement
          </a>
          .
        </p>
        <p>
          Toone (Direct) installers are available through authenticated Toone downloads. The
          service receives your account session token and ordinary connection information to
          authorise delivery. Existing Direct apps check public update feeds hosted by GitHub, which
          receives ordinary connection information such as your IP address during an update check.
          Toone does not send your account credentials to GitHub for that check. Apple delivers
          Toone (Mac App Store) and its updates under Apple&apos;s own terms and privacy policy.
        </p>
      </section>

      <section id="purposes">
        <h2>Why we use your data, and on what legal basis</h2>
        <p>
          Toone uses personal data only for these purposes, each on the basis the General Data
          Protection Regulation (GDPR) names:
        </p>
        <Table
          head={["Purpose", "Legal basis"]}
          rows={PRIVACY_PURPOSES.map((row) => [row.purpose, row.basis])}
        />
      </section>

      <section id="third-parties">
        <h2>Who receives your data</h2>
        <p>
          Toone does not sell your personal data or share it for advertising. It shares personal
          data only with the recipients below, and only for the purposes listed:
        </p>
        <Table
          head={["Recipient", "Role", "What for", "Where"]}
          rows={recipients.map((row) => [<strong key="n">{row.name}</strong>, row.role, row.purpose, row.where])}
        />
        <p>
          A processor may use personal data only to provide its service to Toone, under a contract
          and data-processing terms that require it to protect the data with the same or equal
          protection as this policy. An independent controller decides for itself how it uses the
          data it receives, under its own privacy policy. The AI provider you connect with your own
          account also handles your data as an independent company. Toone may also disclose
          information when the law requires it.
        </p>
      </section>

      <section id="transfers">
        <h2>Transfers outside the European Union</h2>
        <p>
          Toone&apos;s server and database are in the European Union. Some recipients above are based
          in the United States or process data there. Those transfers rely on the EU-U.S. Data
          Privacy Framework, where the recipient is certified under it, or on the European
          Commission&apos;s Standard Contractual Clauses. You can ask for a copy of the safeguards at{" "}
          <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </section>

      <section id="retention">
        <h2>How long we keep data</h2>
        <Table
          head={["Data", "How long"]}
          rows={retention.map((row) => [
            row.data,
            row.why ? `${row.period} ${row.why}` : row.period,
          ])}
        />
        <p>
          Toone may keep a specific record longer when the law requires it, or when it is needed to
          resolve a dispute or a security incident.
        </p>
      </section>

      <section id="automated-decisions">
        <h2>Automated decisions</h2>
        <p>
          Stripe screens every payment for fraud automatically, and may decline a payment it judges
          risky. If that happens, you can contact us or Stripe, and the payment can be looked at by
          a person. Toone itself makes no decision about you based solely on automated processing
          that has legal or similarly significant effects. Automatic checks, such as counting
          routine creations against the free plan or refusing a code already redeemed, only apply
          the rules described on the <a href="/en/terms#toone-pro">Terms page</a>.
        </p>
      </section>

      <section id="security">
        <h2>Security</h2>
        <p>
          Checkout and the billing portal are hosted by Stripe, so Toone never sees or stores your
          card number. Connections to trytoone.com and Toone&apos;s server are encrypted with TLS.
          Where Toone only needs to recognise an email address again, such as for codes, guest
          months, and withdrawal and cancellation requests, it stores a keyed hash instead of the
          address. Access to Toone&apos;s server and data is limited to the people who run Toone.
        </p>
      </section>

      <section id="children">
        <h2>Children</h2>
        <p>
          Toone is not for anyone under {PRIVACY_MIN_AGE}. Toone does not knowingly collect personal
          data from anyone under {PRIVACY_MIN_AGE}. If you think a child has given us personal data,
          write to <a href={`mailto:${CONTACT}`}>{CONTACT}</a> and we will delete it.
        </p>
      </section>

      <section id="your-rights">
        <h2>Your rights</h2>
        <p>
          You can ask to access, correct, delete, or receive a copy of your personal data, to
          restrict or object to how it is used, and to withdraw any consent you gave, without
          affecting what was done before. To make a request, email{" "}
          <a href={`mailto:${CONTACT}`}>{CONTACT}</a> from the address on your account; Toone
          answers within one month. You can also act directly: delete your account in Toone (Mac App
          Store) under Settings &rarr; Account, turn usage analytics off in Toone (Direct) Settings,
          stop sharing site maps with the Silk Network, and change your website analytics choice at
          any time. For data that Stripe holds as an independent controller, and Link for a
          purchase sold through Link, you can also contact them directly. Toone may keep records the law requires even after
          you ask for erasure, as described in How long we keep data.
        </p>
        <p>
          If you think your data has been handled unlawfully, you can complain to a data protection
          authority. In Portugal, that is the Comiss&atilde;o Nacional de Prote&ccedil;&atilde;o de
          Dados (CNPD,{" "}
          <a href="https://www.cnpd.pt" {...ext}>
            cnpd.pt
          </a>
          ); you can also contact the authority where you live or work.
        </p>
      </section>

      <section id="changes">
        <h2>Changes to this policy</h2>
        <p>
          When this policy changes, the date at the top of this page changes. If a change affects
          how Toone uses your data, such as a new purpose or a new kind of recipient, Toone
          announces it on this page and in the release notes before it applies and, if you have an
          account, by email.
        </p>
      </section>

      <section id="contact">
        <h2>Contact</h2>
        <p>
          Questions about this policy can be sent to <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          Toone is published by Matheus Paranhos (Hexagonal.io), Portugal
          {traderDetails ? (
            <>
              ; see the <a href={`/en${LEGAL_NOTICE_PATH}`}>Legal notice</a>.
            </>
          ) : (
            "."
          )}
        </p>
      </section>
    </>
  );
}

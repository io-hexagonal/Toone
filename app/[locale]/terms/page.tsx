import type { Metadata } from "next";
import { localeRobots, localeVersions } from "@/i18n/indexing";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { setRequestLocale } from "next-intl/server";
import TrustPage from "@/components/TrustPage";
import {
  ACCOUNT_PATH,
  APPLE_MANAGE_SUBSCRIPTIONS_URL,
  APPLE_REPORT_A_PROBLEM_URL,
  APPLE_STANDARD_EULA_URL,
  CANCEL_CONTRACT_PATH,
  LEGAL_NOTICE_PATH,
  LINK_ACCOUNT_URL,
  LINK_SUPPORT_URL,
  LINK_TERMS_URL,
  PRICING_PATH,
  TERMS_CANONICAL,
  TERMS_UPDATED_DATE,
  TOONE_PRO_CODE_MAX_DAYS,
  TOONE_PRO_FIRST_PAYMENT_REFUND_DAYS,
  TOONE_PRO_FREE_ROUTINE_CREATIONS,
  TOONE_PRO_GUEST_MONTH_DAYS,
  TOONE_PRO_GUEST_PASSES,
  TOONE_PRO_PREVIOUS_FREE_ROUTINE_CREATIONS,
} from "@/lib/legal/terms";

type Props = { params: Promise<{ locale: string }>; searchParams: PageSearchParams };

const REFUND_DAYS = TOONE_PRO_FIRST_PAYMENT_REFUND_DAYS;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    // Root template appends "| Toone"; the brand stays out of this title (F33).
    title: "Terms and Licenses",
    description:
      "License terms for Toone from the Mac App Store and Toone downloaded directly, and the terms for buying Toone Pro, the free plan, and redeemable codes.",
    alternates: { canonical: TERMS_CANONICAL },
    robots: localeRobots(locale),
    other: localeVersions("/terms", ["en"]),
    openGraph: {
      type: "website",
      url: TERMS_CANONICAL,
      title: "Toone Terms and Licenses",
      description:
        "License information for the Mac App Store and direct editions of Toone, and the terms for Toone Pro.",
      siteName: "Toone",
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}

export default async function TermsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") await redirectToEnglish("/en/terms", searchParams);
  setRequestLocale(locale);

  return (
    <TrustPage
      eyebrow="Legal"
      title="Toone Terms and Licenses"
      lede="The license for Toone depends on where you obtained the app. Toone Pro, the optional upgrade, has its own purchase terms below."
      updated={TERMS_UPDATED_DATE}
      updatedLabel="Updated"
    >
      <section>
        <h2>Mac App Store edition</h2>
        <p>
          The Mac App Store edition of Toone uses Apple&apos;s{" "}
          <a href={APPLE_STANDARD_EULA_URL}>standard Licensed Application End User License Agreement</a>.
          Toone has not provided a custom App Store license agreement. Apple presents the applicable
          license when you obtain the app through the Mac App Store.
        </p>
      </section>

      <section>
        <h2>Other distributions</h2>
        <p>
          The Apple standard EULA above describes the Mac App Store edition. For a Toone copy
          obtained elsewhere, such as Toone (Direct) downloaded from trytoone.com, use the license
          terms supplied with that distribution or contact Toone if you need a copy.
        </p>
      </section>

      <section id="toone-pro">
        <h2>Toone Pro</h2>
        <p>
          Toone Pro is an optional upgrade for your Toone account. It removes the limit on how many
          routines your account can create. Everything else in Toone works without it. Toone Pro is
          provided by Toone, published by Matheus Paranhos under the Hexagonal.io name in Portugal.
          The full trader details, address and tax number are in the{" "}
          <a href={`/en${LEGAL_NOTICE_PATH}`}>Legal notice</a>.
        </p>
        <p>
          Toone Pro bought on trytoone.com applies to your Toone account in Toone (Direct), the
          edition downloaded from trytoone.com. Toone Pro is not sold inside Toone (Mac App Store)
          yet; the terms that will apply there are under{" "}
          <a href="#app-store">Toone Pro in the Mac App Store edition</a>.
        </p>

        <h3 id="free-plan">The free plan</h3>
        <p>
          Without Toone Pro, each Toone account can create {TOONE_PRO_FREE_ROUTINE_CREATIONS}{" "}
          routines over its lifetime. Installing a routine from Explore counts as creating one.
          Running routines is never limited, and the routines you have already created keep running
          if you never upgrade or if your Toone Pro ends.
        </p>
        <p>
          Until November 10, 2026, the free plan allowed{" "}
          {TOONE_PRO_PREVIOUS_FREE_ROUTINE_CREATIONS} routine creations. If your account had
          already created more than {TOONE_PRO_FREE_ROUTINE_CREATIONS}, it keeps all of them and
          they keep running; creating more needs Toone Pro. Toone (Mac App Store) is in Early
          Access and does not apply the limit while it does not sell Toone Pro.
        </p>

        <h3 id="web-purchases">Who sells Toone Pro on trytoone.com</h3>
        <p>
          Toone Pro is sold on trytoone.com through Stripe&apos;s Managed Payments service. The
          seller of the transaction and merchant of record is Sold through Link, LLC
          (&quot;Link&quot;), a Stripe company: checkout shows &quot;Sold through Link&quot;, and
          your statement shows LINK.COM followed by Toone&apos;s name. Link takes your payment,
          calculates and collects VAT or sales tax, sends your receipts and invoices, and handles
          payment support. Link&apos;s{" "}
          <a href={LINK_TERMS_URL}>Sold through Link terms</a> also apply to your purchase. Toone
          provides Toone Pro, is responsible for delivering it and for product support, and never
          sees your full card number.
        </p>

        <h3>Plans and prices</h3>
        <ul>
          <li>
            <strong>Toone Pro Monthly</strong> and <strong>Toone Pro Yearly</strong>: subscriptions
            that renew automatically every month or every year until you cancel.
          </li>
          <li>
            <strong>Toone Pro Lifetime</strong>: a single payment, with no renewal.
          </li>
        </ul>
        <p>
          The <a href={`/en${PRICING_PATH}`}>pricing page</a> and checkout show the total price
          before you pay. Prices in euros include VAT. Prices in US dollars are shown before
          sales tax, which checkout adds where it applies. Checkout may offer to charge you in your
          local currency and shows the converted amount before you pay. There is no free trial.
          You must have a Toone account and be signed in to buy.
        </p>

        <h3>Payment, renewal and cancellation</h3>
        <p>
          You are charged when you confirm the purchase and, for a subscription, at the start of
          each new period. If a renewal payment fails, Link retries it; if it keeps failing, the
          subscription ends and Toone Pro ends with it.
        </p>
        <p>
          You can cancel a subscription at any time: on your{" "}
          <a href={`/en${ACCOUNT_PATH}`}>Toone account page</a> (Manage subscription), in your{" "}
          <a href={LINK_ACCOUNT_URL}>Link account</a>, or without signing in at{" "}
          <a href={`/en${CANCEL_CONTRACT_PATH}`}>Cancel contract here</a>. Cancelling stops the next
          renewal. Toone Pro stays on until the end of the period you have paid for, and you are not
          charged again. If Toone changes the price of a subscription, you are told by email at
          least 30 days before the new price applies, and you can cancel before it does.
        </p>
        <p>
          If you are a consumer in Germany and your Yearly subscription has renewed at least once,
          you can cancel it at any time with one month&apos;s notice, and the unused part of the
          period you paid for is refunded.
        </p>
        <p>
          Switching between Monthly and Yearly is not offered yet. To change, cancel your
          subscription and buy the other plan when the current period ends. You can buy Lifetime
          while a web subscription is active: the subscription then stops renewing and ends with the
          period you have paid for.
        </p>

        <h3 id="withdrawal">{REFUND_DAYS}-day refund and your right of withdrawal</h3>
        <p>
          Whatever the plan, you can ask for a full refund of your first payment within{" "}
          {REFUND_DAYS} days of making it, even if you have already used Toone Pro. Toone Pro ends
          when the refund is made. At checkout you ask for Toone Pro to start straight away and
          confirm that you understand what that means for your withdrawal right; whatever the law
          would otherwise allow, this refund still applies. It covers your right, if you are a
          consumer in the EU, the EEA or the UK, to withdraw from the contract within{" "}
          {REFUND_DAYS} days without giving a reason.
        </p>
        <p>
          To withdraw, use <a href={`/en${CANCEL_CONTRACT_PATH}`}>Withdraw from contract here</a>.
          It needs no sign-in: enter the email address you bought with and your order reference
          from the receipt, then confirm. You receive a confirmation by email straight away. You can
          also email <a href="mailto:hello@trytoone.com">hello@trytoone.com</a> or ask{" "}
          <a href={LINK_SUPPORT_URL}>Link support</a> and give &quot;withdrawal period&quot; as the
          reason. You can use these words, though you don&apos;t have to:
        </p>
        <blockquote>
          To Toone (contact details in the Legal notice): I hereby give notice that I withdraw from
          my contract for the supply of the following digital service: Toone Pro (plan: ___),
          ordered on ___. Name: ___. Email address of the Toone account: ___. Order reference: ___.
          Date: ___.
        </blockquote>
        <p>
          The refund goes back to the payment method you used, within 14 days of your request. Payments after the first one, such as renewals, are not refunded, except where
          the law requires it or as stated for Germany above. Link may also refund a payment under
          its own policy. If a payment is refunded or reversed by your bank, the Toone Pro it paid
          for ends.
        </p>

        <h3>Lifetime</h3>
        <p>
          Toone Pro Lifetime gives the Toone account it is linked to Toone Pro for the life of the
          product, for as long as Toone (Direct) is available. It does not expire and does not
          renew. It ends if its payment is refunded or reversed.
        </p>

        <h3 id="account">Your purchase belongs to one Toone account</h3>
        <p>
          A Toone Pro purchase is linked to the Toone account that is signed in when you buy it, and
          cannot be moved to another account. Checkout is refused while your account already has a
          paid Toone Pro plan, from the web or from Apple, so you are not charged twice; the one
          exception is upgrading a web subscription to Lifetime, described above. If you bought on
          the wrong account, ask for the {REFUND_DAYS}-day refund or contact us before buying again.
        </p>
        <p>
          Deleting your Toone account cancels a web subscription at once: Toone Pro ends straight
          away and you are not charged again. The rest of the period is not refunded, except that
          the {REFUND_DAYS}-day refund of the first payment still applies. Lifetime ends with the
          account. Link and Toone keep the invoices and purchase records the law requires, as
          described in the <a href="/en/privacy#toone-pro">Privacy Policy</a>. Deleting your account
          does not cancel a subscription bought from Apple.
        </p>

        <h3 id="codes">Redeemable codes</h3>
        <p>
          Toone may give out codes that you redeem with your Toone account on trytoone.com. A code
          can give Toone Pro for a stated number of days (at most {TOONE_PRO_CODE_MAX_DAYS}), Toone
          Pro for the life of the product, or extra free routine creations on top of the free plan.
          A code may also let you create an account while sign-ups are by invitation. Discount codes
          are different: you enter them at checkout, and the discount, the plan it applies to, and
          for how many payments are shown there before you pay.
        </p>
        <ul>
          <li>Codes are free. They have no cash value and cannot be bought, sold or exchanged for money.</li>
          <li>
            Each code can be redeemed once per person and per Toone account, and only on an account
            with a verified email address. A code may expire or be limited to a number of uses; the
            redeem page tells you if it no longer works.
          </li>
          <li>
            A code that gives days of Toone Pro or Toone Pro for life cannot be redeemed while your
            account has a paid Toone Pro plan, and the code is not used up when it is refused. Codes
            for extra routine creations can always be redeemed.
          </li>
          <li>
            Days of Toone Pro from a code add to any days you already have from another code, a
            complimentary grant or a guest month. They end without renewing or charging anyone.
          </li>
          <li>
            Extra routine creations stay with the account and do not expire.
          </li>
          <li>
            Toone may withdraw what a code gave if the code was obtained by fraud, by mistake, or
            against these terms.
          </li>
        </ul>

        <h3>Guest months</h3>
        <p>
          If you have bought Toone Pro, on the web or from Apple, you can give up to{" "}
          {TOONE_PRO_GUEST_PASSES} people a free {TOONE_PRO_GUEST_MONTH_DAYS}-day month of Toone
          Pro each, by entering their email address in the app. Toone Pro from a code or a guest
          month does not include guest months to give. Guest months are free. They cannot be bought,
          sold or exchanged for money or anything else. Each email address can receive only one
          guest month, ever, and a guest month ends after {TOONE_PRO_GUEST_MONTH_DAYS} days without
          renewing or charging anyone.
        </p>

        <h3 id="app-store">Toone Pro in the Mac App Store edition</h3>
        <p>
          Toone Pro is not sold in Toone (Mac App Store) yet. When it is, it will be sold there as
          an Apple in-app purchase, in the same Monthly, Yearly and Lifetime options, and these
          terms will apply to it:
        </p>
        <ul>
          <li>
            The App Store shows the price in your currency before you buy. Payment is charged to
            your Apple Account when you confirm the purchase.
          </li>
          <li>
            A subscription renews automatically, and your Apple Account is charged for the next
            period, unless you cancel at least 24 hours before the end of the current period. You
            can manage or cancel it in your App Store account settings (on a Mac, open the App
            Store, click your name, then Account Settings); Apple explains how in{" "}
            <a href={APPLE_MANAGE_SUBSCRIPTIONS_URL}>Cancel a subscription from Apple</a>.
          </li>
          <li>
            Apple handles all payments and refunds for purchases made in the App Store. To ask for a
            refund, use <a href={APPLE_REPORT_A_PROBLEM_URL}>reportaproblem.apple.com</a>. If Apple
            refunds or revokes a purchase, Toone Pro ends for the account it was linked to.
          </li>
          <li>
            The purchase is linked to the Toone account that is signed in when you buy it. Restore
            Purchases links it again only to that same account. Deleting the app or your Toone
            account does not cancel an Apple subscription.
          </li>
          <li>
            The free plan also applies once per Apple Account, so creating new Toone accounts on the
            same Apple Account does not reset it. Test purchases made through Apple&apos;s sandbox,
            such as in TestFlight builds, are never charged and end after 30 days.
          </li>
        </ul>
        <p>
          Buying Toone Pro there does not replace Apple&apos;s{" "}
          <a href={APPLE_STANDARD_EULA_URL}>standard Licensed Application End User License Agreement</a>,
          which continues to govern your use of Toone (Mac App Store). Those purchases are also
          subject to Apple&apos;s Media Services Terms and Conditions.
        </p>

        <h3>If Toone Pro does not work as described</h3>
        <p>
          Toone Pro must work as described on this page and on the pricing page for as long as you
          have it. If it does not, tell us and we will fix it. As a consumer you also keep the
          rights the law gives you for digital content and digital services, including, in
          Portugal, those of Decreto-Lei 84/2021: to have it brought into conformity, or to get a
          price reduction or a refund.
        </p>
      </section>

      <section id="complaints">
        <h2>Complaints, disputes and governing law</h2>
        <p>
          If something goes wrong, email{" "}
          <a href="mailto:hello@trytoone.com">hello@trytoone.com</a> first. Payment questions can also go to{" "}
          <a href={LINK_SUPPORT_URL}>Link support</a>. You can file a complaint in the Livro de
          Reclamações Eletrónico, and as a consumer you can take a dispute to an alternative dispute
          resolution entity. Both are listed in the{" "}
          <a href={`/en${LEGAL_NOTICE_PATH}`}>Legal notice</a>.
        </p>
        <p>
          These terms are governed by Portuguese law. If you are a consumer, you keep the protection
          of the mandatory rules of the country where you live, and you can bring a claim in its
          courts.
        </p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>
          When these terms change, the date at the top of this page changes. Changes to the price
          or the main features of a plan you have already bought are announced by email in advance,
          and a change never takes away a period you have already paid for. If you do not agree, you
          can cancel before the change applies to you.
        </p>
      </section>

      <section>
        <h2>Connected services and privacy</h2>
        <p>
          If you connect an AI provider, your use of that provider is also subject to its own
          terms. For information about Toone accounts, website data, the cloud relay, AI requests,
          and Toone Pro purchases, read the <a href="/en/privacy">Privacy Policy</a>.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms and licenses can be sent to{" "}
          <a href="mailto:hello@trytoone.com">hello@trytoone.com</a>.
        </p>
      </section>
    </TrustPage>
  );
}

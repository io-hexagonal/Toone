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
  TOONE_PRO_CODE_MAX_DAYS,
  TOONE_PRO_FIRST_PAYMENT_REFUND_DAYS,
  TOONE_PRO_FREE_ROUTINE_CREATIONS,
  TOONE_PRO_GUEST_MONTH_DAYS,
  TOONE_PRO_GUEST_PASS_MARGIN_DAYS,
  TOONE_PRO_GUEST_PASSES,
  TOONE_PRO_PREVIOUS_FREE_ROUTINE_CREATIONS,
} from "@/lib/legal/terms";
import {
  DIRECT_INVOICE_WORKING_DAYS,
  LINK_SELLER_ENTITY,
  STRIPE_EU_ENTITY,
  newPurchasesSentence,
  type TooneProSeller,
} from "@/lib/legal/seller";
import { LEGAL_TRADER, TRADER_DETAILS_COMPLETE } from "@/lib/legal/trader";

const REFUND_DAYS = TOONE_PRO_FIRST_PAYMENT_REFUND_DAYS;
const CONTACT = "hello@trytoone.com";
/** Where a code is redeemed, or used to create an account. */
const REDEEM_PATH = "/redeem";
/** The authorised reseller selling lifetime codes now, and its refund window. */
const RESELLER = "AppSumo";
const RESELLER_REFUND_DAYS = 60;

export type TermsContentProps = {
  /**
   * Who sells NEW purchases, as the API says (null when it does not say).
   * The Terms describe both sellers whatever it is; this only adds the
   * "new purchases are currently sold …" sentence.
   */
  seller?: TooneProSeller | null;
  /**
   * Whether the Legal notice is published (lib/legal/trader.ts complete).
   * While it is not, the Terms name the trader and point to the contact email
   * instead of linking to it.
   */
  traderDetails?: boolean;
};

/** The trader who sells Toone Pro in the Direct model. */
function TraderName({ traderDetails }: { traderDetails: boolean }) {
  if (traderDetails) {
    return <>the trader named in the <a href={`/en${LEGAL_NOTICE_PATH}`}>Legal notice</a></>;
  }
  return <>Toone&apos;s publisher, Matheus Paranhos, the sole trader named above</>;
}

/**
 * Who sells Toone Pro on the web. Both ways are always described: a purchase
 * keeps the seller it was made under, so after a switch the buyers of either
 * still find their own terms here.
 */
function WebSeller({ seller, traderDetails }: { seller: TooneProSeller | null; traderDetails: boolean }) {
  const current = newPurchasesSentence(seller);
  return (
    <>
      <p id="seller-of-your-purchase">
        Toone Pro on trytoone.com is sold in one of two ways: sold through Link, or sold by Toone.
        Checkout shows which one applies before you pay, and your purchase confirmation email names
        it. A purchase keeps the seller it was made under, including its renewals, invoices and
        refunds, even if Toone later changes how it sells Toone Pro. Where these terms say
        &quot;sold through Link&quot; or &quot;sold by Toone&quot;, that part applies only to
        purchases sold that way.{current ? <> {current}</> : null}
      </p>
      <p id="sold-through-link">
        <strong>Sold through Link.</strong> If checkout shows &quot;Sold through Link&quot;, Toone
        Pro is sold through Stripe&apos;s Managed Payments service. The seller of the transaction
        and merchant of record is {LINK_SELLER_ENTITY} (&quot;Link&quot;), a Stripe company, and
        your statement shows LINK.COM followed by Toone&apos;s name. Link takes your payment,
        calculates and collects VAT or sales tax, sends your receipts and invoices, and handles
        payment support. Link&apos;s <a href={LINK_TERMS_URL}>Sold through Link terms</a> also apply
        to your purchase. Toone provides Toone Pro, is responsible for delivering it and for product
        support, and never sees your full card number.
      </p>
      <p id="sold-by-toone">
        <strong>Sold by Toone.</strong> Any other purchase on trytoone.com is sold by Toone: the
        seller is <TraderName traderDetails={traderDetails} />, who is responsible for the sale, for
        delivering Toone Pro, and for support. Payments are processed by {STRIPE_EU_ENTITY}{" "}
        (&quot;Stripe&quot;), in Ireland, on Stripe&apos;s secure checkout page, and your statement
        shows Toone&apos;s name. Toone never sees your full card number. Stripe sends a receipt when
        a payment goes through, and Toone sends you a Portuguese legal invoice for every payment, as
        described under <a href="#invoices">Receipts, invoices and VAT</a>.
      </p>
    </>
  );
}

function PriceTax() {
  return (
    <>
      The pricing page shows prices in euros, including VAT for consumers. Checkout may show and
      charge the price in your local currency instead, with any sales tax that applies where you
      are; it shows the exact amount and currency before you pay, and that is the amount you are
      charged. For a purchase sold by Toone, if you buy for a business with a valid EU VAT number,
      VAT may not be charged, as described under <a href="#invoices">Receipts, invoices and VAT</a>.
    </>
  );
}

function Invoices() {
  return (
    <>
      <h3 id="invoices">Receipts, invoices and VAT</h3>
      <p id="invoices-link">
        <strong>Sold through Link.</strong> As the seller, Link works out the VAT or sales tax due
        in your country and sends you a receipt and an invoice for every payment, by email. You can
        also find them in your <a href={LINK_ACCOUNT_URL}>Link account</a>. Toone does not issue its
        own invoice for a purchase sold through Link.
      </p>
      <p id="invoices-toone">
        <strong>Sold by Toone.</strong> Stripe Tax, Stripe&apos;s tax service, calculates the VAT
        from where you are, based on your billing address. Each accepted payment then gets two
        documents, both sent by email to the address you gave at checkout:
      </p>
      <ul>
        <li>
          <strong>Stripe&apos;s receipt</strong>, straight away. It only confirms that the payment
          went through.
        </li>
        <li>
          <strong>A Portuguese legal invoice</strong> (fatura), as a PDF, issued in Portugal by the
          trader. It carries its number and its ATCUD, the code every Portuguese invoice carries.
          It is issued within {DIRECT_INVOICE_WORKING_DAYS} working days of the payment, and
          usually sooner. It is a separate document from Stripe&apos;s receipt.
        </li>
      </ul>
      <p>
        If you buy for a business established in another EU country and give a VAT number that is
        valid in VIES, the EU&apos;s VAT register, no VAT is charged: the invoice says that the
        reverse charge applies, and your business accounts for the VAT. Without a valid VAT number,
        or with a billing address in Portugal, VAT is charged. If an accepted payment is refunded, in
        full or in part, you also receive a credit note (nota de crédito) for that amount by email. If you
        need a copy of an invoice, or one is missing, write to{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
      {/* The blocked countries are server configuration: checkout names them, these terms don't. */}
      <p id="not-sold-in">
        Toone can&apos;t sell Toone Pro yet to some countries. When a purchase is sold by Toone,
        the countries where we can&apos;t sell yet are named at checkout, judged by the billing
        address you give there. A payment from one of them is refused: it is refunded in full,
        doesn&apos;t start Toone Pro, and gets no legal invoice and no credit note, because no sale
        took place. Stripe emails you the confirmation of the refund.
      </p>
    </>
  );
}

export default function TermsContent({ seller = null, traderDetails = TRADER_DETAILS_COMPLETE }: TermsContentProps) {
  return (
    <>
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
          routines your account can create. Everything else in Toone works without it. Toone and
          Toone Pro are provided by Matheus Paranhos, a sole trader (empresário em nome individual)
          established in Portugal, trading as Toone (Hexagonal.io), tax and VAT number{" "}
          {LEGAL_TRADER.taxId.value}, tax address {LEGAL_TRADER.address.value}. Contact:{" "}
          <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          {traderDetails ? (
            <>
              {" "}The full trader details are in the{" "}
              <a href={`/en${LEGAL_NOTICE_PATH}`}>Legal notice</a>.
            </>
          ) : (
            <>
              {" "}For the other trader details, write to{" "}
              <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
            </>
          )}
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
        <WebSeller seller={seller} traderDetails={traderDetails} />

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
          before you pay. <PriceTax /> There is no free trial.
          You must have a Toone account and be signed in to buy.
        </p>

        <Invoices />

        <h3>Payment, renewal and cancellation</h3>
        <p>
          You are charged when you confirm the purchase and, for a subscription, at the start of
          each new period. If a renewal payment fails, it is retried over the following days; if it
          keeps failing, the subscription ends and Toone Pro ends with it.
        </p>
        <p>
          You can cancel a subscription at any time: on your{" "}
          <a href={`/en${ACCOUNT_PATH}`}>Toone account page</a> (Manage subscription), in your{" "}
          <a href={LINK_ACCOUNT_URL}>Link account</a> for a purchase sold through Link, or without
          signing in at <a href={`/en${CANCEL_CONTRACT_PATH}`}>Cancel contract here</a>.
          Cancelling stops the next renewal. Toone Pro stays on until the end of the period you have
          paid for, and you are not charged again. If Toone changes the price of a subscription, you
          are told by email at least 30 days before the new price applies, and you can cancel
          before it does.
        </p>
        <p id="germany">
          If you are a consumer with a billing address in Germany and your Yearly subscription has
          renewed at least once, you can cancel it at any time with one month&apos;s notice: the
          subscription then ends one month after the day we receive your cancellation, and the part
          of the period you paid for that falls after that date is refunded automatically, pro rata,
          to the payment method you used. <a href={`/en${CANCEL_CONTRACT_PATH}`}>Cancel contract
          here</a> applies this by itself. If you cancel on the billing page instead, it stops the
          renewal at the end of the period; write to <a href={`mailto:${CONTACT}`}>{CONTACT}</a> and
          we apply the one-month notice and the refund for you.
        </p>
        <p>
          Switching between Monthly and Yearly is not offered yet. To change, cancel your
          subscription and buy the other plan when the current period ends. You can buy Lifetime
          while a web subscription is active: the subscription then stops renewing and ends with the
          period you have paid for.
        </p>

        <h3 id="withdrawal">{REFUND_DAYS}-day refund and your right of withdrawal</h3>
        <p>
          <strong>Your first paid Toone Pro purchase.</strong> If you withdraw from your Toone
          account&apos;s first paid Toone Pro purchase within {REFUND_DAYS} days of paying, it is
          refunded in full, whatever the plan and even if you have already used Toone Pro. At
          checkout you ask for Toone Pro to start straight away and confirm that you understand what
          that means for your withdrawal right; whatever the law would otherwise allow, this full
          refund still applies. It applies once per Toone account.
        </p>
        <p>
          <strong>Later purchases.</strong> If you are a consumer in the EU, the EEA or the UK, you
          can withdraw from a later subscription within {REFUND_DAYS} days of paying for it,
          without giving a reason. Because you asked for Toone Pro to start straight away, you pay
          for the days you had it: the unused part of the period you paid for is refunded, pro
          rata. A later Lifetime purchase is digital content: you asked for it to start straight
          away and confirmed that your right of withdrawal ends when it does, so it is not refunded
          on withdrawal.
        </p>
        <p>
          A withdrawal counts as made within {REFUND_DAYS} days when you send it within{" "}
          {REFUND_DAYS} days, even if the refund is made later. Toone Pro from the purchase you
          withdraw from ends when your withdrawal takes effect.
        </p>

        <h3 id="withdraw-or-cancel">How to withdraw or cancel without signing in</h3>
        <p>
          Use <a href={`/en${CANCEL_CONTRACT_PATH}`}>Withdraw from contract here</a> to withdraw.
          Cancelling works the same way, at{" "}
          <a href={`/en${CANCEL_CONTRACT_PATH}`}>Cancel contract here</a>. Both are linked at the
          bottom of every page of trytoone.com, and neither needs a sign-in. Enter the email address
          of your Toone account or the one you entered at checkout, and the order reference
          (TOONE-…) from the purchase confirmation email Toone sends after every purchase. Your{" "}
          <a href={`/en${ACCOUNT_PATH}`}>Toone account page</a> also shows it for a purchase made in
          the browser you use there. You can add your name. To cancel, you also say whether it is an ordinary or an extraordinary
          termination (with the reason), and when the contract should end: at the next possible
          date, or on a later date you choose.
        </p>
        <p>
          Then press the confirm button. Pressing it is your declaration: if the details match a
          Toone Pro purchase, your withdrawal or cancellation takes effect at that moment, with no
          further step and no link to open. We then email you an acknowledgement with what you
          declared, the date and time we received it and, for a cancellation, the date the
          contract ends. If the details match no purchase, nothing changes: check the order
          reference in your purchase confirmation email and send the request again, or write to{" "}
          <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
        <p id="no-order-reference">
          If you don&apos;t have the order reference, you can still cancel a subscription on your
          Toone account page (Manage subscription), or withdraw or cancel by email to{" "}
          <a href={`mailto:${CONTACT}`}>{CONTACT}</a> from the email address of your Toone account
          or the one you entered at checkout. The order reference helps us find your purchase, but
          you don&apos;t need it there.
        </p>
        <ul>
          <li>
            <strong>Cancel a subscription</strong>: it stops renewing. Toone Pro stays on until the
            end of the period you have paid for, and nothing is refunded, except as described{" "}
            <a href="#germany">for Germany</a> above.
          </li>
          <li>
            <strong>Withdraw from a subscription within {REFUND_DAYS} days of paying for
            it</strong>: the subscription ends straight away and Toone Pro ends. The payment is
            refunded in full if it was your account&apos;s first paid Toone Pro purchase; otherwise
            the unused part of the period is refunded.
          </li>
          <li>
            <strong>Withdraw from a subscription later</strong>: the request is treated as a
            cancellation, as above.
          </li>
          <li>
            <strong>Withdraw from Lifetime within {REFUND_DAYS} days of the payment, when it was
            your account&apos;s first paid Toone Pro purchase</strong>: the payment is refunded in
            full and Toone Pro is removed from the account.
          </li>
          <li>
            <strong>Withdraw from Lifetime bought while a web subscription was active</strong>:
            buying Lifetime had set that subscription to stop renewing. If the subscription is still
            running when you withdraw, it renews again as before. If it has already ended, it is not
            restarted, and Toone Pro ends with the Lifetime purchase; you can buy a plan again.
          </li>
          <li>
            <strong>Cancel Lifetime, or withdraw from it later</strong>: there is nothing to cancel,
            because Lifetime never renews. The email explains this, and Toone Pro stays on.
          </li>
        </ul>
        <p>
          You can also withdraw by email to <a href={`mailto:${CONTACT}`}>{CONTACT}</a> or, for a
          purchase sold through Link, ask <a href={LINK_SUPPORT_URL}>Link support</a> and give
          &quot;withdrawal period&quot; as the reason. You can use these words, though you don&apos;t
          have to:
        </p>
        <blockquote>
          To Toone ({traderDetails ? "contact details in the Legal notice" : CONTACT}): I hereby give
          notice that I withdraw from
          my contract for the supply of the following digital service: Toone Pro (plan: ___),
          ordered on ___. Name: ___. Email address of the Toone account: ___. Order reference: ___.
          Date: ___.
        </blockquote>
        <p>
          The refund goes back to the payment method you used, within 14 days of your request.
          Renewals are not refunded, except where the law requires it or as stated{" "}
          <a href="#germany">for Germany</a> above. For a purchase sold through Link, Link may also
          refund a payment under its own policy. If a payment is refunded or reversed by your bank,
          the Toone Pro it paid for ends.
        </p>

        <h3>Lifetime</h3>
        <p>
          Toone Pro Lifetime gives the Toone account it is linked to Toone Pro for the life of the
          product, for as long as Toone (Direct) is available. It does not expire and does not
          renew. It ends if its payment is refunded or reversed.
        </p>
        <p id="lifetime-codes">
          Toone Pro for the life of the product from a code, including a code bought from an
          authorised reseller (see <a href="#reseller-codes">Codes sold by authorised
          resellers</a>), lasts the same way: for as long as Toone (Direct) is available, on the
          Toone account that redeemed the code. It does not expire and does not renew. It ends if
          the code is refunded or revoked.
        </p>

        <h3 id="account">Your purchase belongs to one Toone account</h3>
        <p>
          A Toone Pro purchase is linked to the Toone account that is signed in when you buy it, and
          cannot be moved to another account. Checkout is refused while your account already has a
          paid Toone Pro plan, from the web or from Apple, so you are not charged twice; the one
          exception is upgrading a web subscription to Lifetime, described above. If you bought on
          the wrong account, withdraw within {REFUND_DAYS} days as described above, or contact us
          before buying again.
        </p>
        <p>
          Deleting your Toone account cancels a web subscription at once: Toone Pro ends straight
          away and you are not charged again. If you paid for it less than {REFUND_DAYS} days
          before, it is refunded automatically, as for a withdrawal (see above); otherwise the rest
          of the period is not refunded. Lifetime ends with the account. Toone keeps the purchase
          records the law requires, with the invoices and credit notes of purchases sold by Toone,
          and Link keeps the invoices of purchases sold through Link, as described in the{" "}
          <a href="/en/privacy#retention">Privacy Policy</a>. Deleting your account does not cancel
          a subscription bought from Apple.
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
          <li>
            Codes have no cash value. Codes that Toone gives out are free, and no code may be
            bought, sold or exchanged for money, except a code that Toone issued to an authorised
            reseller, sold by that reseller as described under{" "}
            <a href="#reseller-codes">Codes sold by authorised resellers</a>. Anyone else who sells
            or resells a code breaks these terms.
          </li>
          <li>
            Each code can be redeemed once per person and per Toone account. Redeeming a code on an
            existing account needs a verified email address. A code used to create a Toone account
            applies when the account is created; a code shared by many people that is used to sign
            up with an email address and password applies once you confirm that address. A code may
            expire or be limited to a number of uses; the redeem page tells you if it no longer
            works.
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

        <h3 id="reseller-codes">Codes sold by authorised resellers</h3>
        <p>
          Toone also sells codes for Toone Pro through authorised resellers, such as {RESELLER}. A
          code bought from an authorised reseller gives the Toone account that redeems it Toone Pro
          for the life of the product, as described under <a href="#lifetime-codes">Lifetime</a>.
          You redeem it on <a href={`/en${REDEEM_PATH}`}>trytoone.com/en/redeem</a>, with your Toone
          account or by creating a Toone account with the code there.
        </p>
        <ul>
          <li>
            The reseller is the seller of the code: you buy it under the reseller&apos;s terms, the
            reseller takes your payment, and the reseller handles refunds of the code within its
            own refund window ({RESELLER}: {RESELLER_REFUND_DAYS} days). Toone provides Toone Pro to
            the account that redeems the code and gives product support. The refund and withdrawal
            rules above are for purchases from Toone on trytoone.com; for a code, the
            reseller&apos;s refund policy and your rights against the reseller apply.
          </li>
          <li>
            A refunded code is revoked: it can no longer be redeemed, and if it was already
            redeemed, the Toone Pro it gave ends.
          </li>
          <li>
            One code per Toone account: codes do not stack. A code cannot be redeemed on an account
            that already has Toone Pro for the life of the product, or while the account has a paid
            Toone Pro plan, and the code is not used up when it is refused. If you cannot use a code
            you bought, write to <a href={`mailto:${CONTACT}`}>{CONTACT}</a> within the
            reseller&apos;s refund window and we help you get it refunded.
          </li>
          <li>
            Toone Pro from a reseller&apos;s code belongs to the account that redeemed it and cannot
            be moved to another account.
          </li>
        </ul>

        <h3>Guest months</h3>
        <p>
          If you have bought Toone Pro, on the web or from Apple, you can give up to{" "}
          {TOONE_PRO_GUEST_PASSES} people a free {TOONE_PRO_GUEST_MONTH_DAYS}-day month of Toone
          Pro each, by entering their email address in the app. For a purchase on the web, guest
          months become available only once its {REFUND_DAYS}-day withdrawal period has passed,
          plus one more day, so {REFUND_DAYS + TOONE_PRO_GUEST_PASS_MARGIN_DAYS} days after the
          purchase. They are not available while a withdrawal from that purchase is being carried
          out, nor after it has been withdrawn. Toone Pro from a code or a guest month does not
          include guest months to give. Guest months are free. They cannot be bought,
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
          If something goes wrong, email <a href={`mailto:${CONTACT}`}>{CONTACT}</a> first. Payment
          questions about a purchase sold through Link can also go to{" "}
          <a href={LINK_SUPPORT_URL}>Link support</a>. You can file a complaint in the Livro de Reclamações Eletrónico, and as a consumer you can
          take a dispute to an alternative dispute resolution entity.
          {traderDetails ? (
            <>
              {" "}Both are listed in the <a href={`/en${LEGAL_NOTICE_PATH}`}>Legal notice</a>.
            </>
          ) : (
            <>
              {" "}Write to <a href={`mailto:${CONTACT}`}>{CONTACT}</a> and we send you the details
              of both.
            </>
          )}
        </p>
        <p>
          These terms are governed by Portuguese law. If you are a consumer, you keep the protection
          of the mandatory rules of the country where you live, and you can bring a claim in its
          courts.
        </p>
      </section>

      <section id="language">
        <h2>Language</h2>
        <p>
          These terms and the other legal pages of trytoone.com are published in English, and a
          Toone Pro purchase is made under the English text. The pricing page and the Withdraw from
          contract here and Cancel contract here pages are also available in Portuguese, Spanish,
          French, German, Italian and Dutch, and the withdraw and cancel pages in Russian too.
          Anything that is not available in your language, including these terms and some emails,
          is shown in English.
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
          <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </section>
    </>
  );
}

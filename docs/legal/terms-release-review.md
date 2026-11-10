# Store terms page release review

Updated 2026-09-28. The public `/en/terms` route is an informational license
directory. It does **not** submit or assert a custom App Store EULA. The owner
chose Apple's standard EULA for the Mac App Store edition; the Direct edition
remains separate. This page does not reproduce the source tree's
`LICENSE-BINARY`, and no assertion is made that every Direct package includes
that file until packaging is verified.

Apple's [App Store Connect guidance](https://developer.apple.com/help/app-store-connect/manage-app-information/provide-a-custom-license-agreement)
says the standard EULA applies unless a custom EULA is entered in App Store
Connect. The page links to [Apple's current standard EULA](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/).

## Before deploying and submitting

1. Verify App Store Connect has **no custom EULA** set for the shared Toone app
   record. A custom EULA in that record would also affect the iPhone edition
   and make the website's statement false.
2. Verify where the Direct distribution exposes its `LICENSE-BINARY` terms.
   They were deliberately not copied onto the Store page or entered in App
   Store Connect.
3. Confirm the public `/terms` redirect and `/en/terms` route return 200 after
   Vercel deployment and that the Store sign-in legal link opens this page.
4. Superseded on 2026-11-10: the page now carries the Toone Pro purchase
   terms (see below), so it does create subscription obligations.

The route is indexable, English only, and listed in the sitemap. Other locale
routes redirect to `/en/terms`.

## Shipped 2026-10-03

The page, its footer link, sitemap entry and reserved slug were ported alone
from `apple-sign-in-release` (1a43f17) onto `main`, because the Toone Pro
paywall links to `https://trytoone.com/terms` and Guideline 3.1.2 requires a
working Terms of Use link. The privacy-policy rewrite and website Sign in with
Apple from that branch were **not** included and remain unmerged. Item 1 above
(no custom EULA in App Store Connect) is still unverified.

## Toone Pro on the web (2026-11-10, branch `site/pro-legal`)

Built on `main`; the unpushed `pro-terms-2026-10-29` branch was **not** merged.
Its Apple disclosures, service-provider list, retention, controller, rights and
CNPD text were reused, without its "Apple-only" and "5 free" statements.

- `/en/terms#toone-pro`: web purchases first (Stripe Managed Payments; the
  seller and merchant of record is Sold through Link, LLC), plans, VAT-inclusive
  euro prices and US prices before tax, renewal and cancellation, a German
  annual-renewal clause, no plan switching, a full refund of the first payment
  within 14 days with the withdrawal right and a model form, Lifetime, one
  account per purchase and no double billing, account deletion cancelling the
  web subscription, codes, guest months, the Apple section for when Pro is sold
  in the Mac App Store edition, conformity, complaints and governing law.
  Free plan = 2 creations (`lib/legal/terms.ts`), with a transition clause for
  accounts created under the former 5.
- The Terms link to `/en/cancel-contract` ("Withdraw from contract here",
  "Cancel contract here"), `/en/account` and `/en/pricing`. Those pages are
  built in other packages; the links 404 until they ship, so ship them together.
- `/en/privacy`: Stripe and Link (processor, plus independent controllers for
  their own purposes), data categories, transfers, the withdrawal-consent
  record, cancel/withdraw requests, codes, account deletion cancelling the
  Stripe subscription and keeping invoices, the `toone_site_session` cookie,
  service providers, retention, controller, legal bases, rights.
- `/en/legal-notice`: new, English only, indexable, in the footer and the
  sitemap. Its values come from `lib/legal/trader.ts`.

### Release gate: owner data

Every value in `lib/legal/trader.ts` starts with `TODO_OWNER` until the owner
provides it. The check is skipped in `npm test` and must pass before the first
live checkout:

```sh
LEGAL_RELEASE_CHECK=1 npm run test:legal
```

The values must match the EU trader details on the App Store listing.

### Before the first live sale

The checklist for counsel and the accountant is kept with the payments plan,
outside this repository. Until it is cleared, do not deploy this branch.

## Seller model switch (2026-11-10, branch `site/pro-legal-followup`)

Toone Pro can be sold on trytoone.com in one of two ways. `TOONE_PRO_SELLER`
in `lib/legal/seller.ts` picks the one the Terms, the Privacy Policy and the
Legal notice describe:

- `"managed_payments"` (default): Stripe Managed Payments. Sold through Link,
  LLC is the seller and merchant of record; it handles VAT, receipts and
  invoices.
- `"direct"`: the trader in `lib/legal/trader.ts` is the seller. Stripe
  Payments Europe processes the payments, Stripe Tax calculates VAT, a
  Portuguese legal invoice (with ATCUD) is emailed as a PDF for every payment,
  separate from Stripe's receipt, EU businesses with a VIES-checked VAT number
  get the reverse charge, refunds get credit notes, and purchases from a
  country in `DIRECT_BLOCKED_COUNTRIES` (the United Kingdom for now) are
  refunded and not activated.

Withdrawal, cancellation, the 14-day first-payment refund, codes, account
deletion and the Mac App Store edition read the same in both. Change the
constant only in the release that switches checkout, never ahead of it. The
tests render both variants.

The Privacy Policy now uses the same page layout as the Terms and carries a
recipients table (role and country), a purposes and legal-bases table, a
retention table, transfers, automated decisions, security, children, cookies
and browser storage by name, the Mac App Store edition and how changes are
announced. Retention periods still waiting for counsel or the accountant are
flagged `confirm: true` in `lib/legal/privacy.ts`; the flag is never rendered.

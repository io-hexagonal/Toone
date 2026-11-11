# Terms, Privacy and Legal notice: release review

The public `/en/terms` route covers the Mac App Store edition's license and the
Toone Pro purchase terms. It does **not** submit or assert a custom App Store
EULA: the Mac App Store edition uses Apple's standard EULA, and the Direct
edition remains separate. The page does not reproduce the source tree's
`LICENSE-BINARY`, and no assertion is made that every Direct package includes
that file until packaging is verified.

Apple's [App Store Connect guidance](https://developer.apple.com/help/app-store-connect/manage-app-information/provide-a-custom-license-agreement)
says the standard EULA applies unless a custom EULA is entered in App Store
Connect. The page links to [Apple's current standard EULA](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/).

The Terms and the Privacy Policy are indexable, English only, and listed in
the sitemap. Other locale routes redirect to the English page.

## Before deploying and submitting

1. Verify App Store Connect has **no custom EULA** set for the shared Toone app
   record. A custom EULA in that record would also affect the iPhone edition
   and make the website's statement false.
2. Verify where the Direct distribution exposes its `LICENSE-BINARY` terms.
   They are deliberately not copied onto the Terms page or entered in App
   Store Connect.
3. Confirm `/terms` and `/en/terms` return 200 after deployment and that the
   app's legal links open this page.
4. The Terms link to `/en/cancel-contract`, `/en/account` and `/en/pricing`.
   Ship them in the same release.

## What the pages cover

- `/en/terms#toone-pro`: who sells Toone Pro on the web (the seller shown at
  checkout stays the seller of that purchase), plans, VAT-inclusive euro prices
  with checkout's local currency shown before paying, renewal and cancellation,
  the German one-month notice for renewed Yearly plans (ends one month after
  receipt, unused remainder refunded pro rata), no plan switching, a full
  refund of an account's first paid Pro purchase within 14 days, a pro-rata
  refund for a later subscription withdrawn within 14 days, the withdrawal
  right and a model form, the login-free withdraw and cancel pages (pressing
  confirm is the declaration; cancellations state their type and end date),
  Lifetime, one
  account per purchase and no double billing, account deletion cancelling the
  web subscription, codes, guest months, the Apple section for when Pro is sold
  in the Mac App Store edition, conformity, complaints, governing law and the
  language clause (legal pages in English; the withdraw and cancel pages in
  every site locale; anything untranslated falls back to English). The
  free plan allowance comes from `lib/legal/terms.ts`, with a transition clause
  for accounts created under the former allowance.
- `/en/privacy`: Stripe (and Link under Managed Payments) with their roles, data
  categories, transfers, the withdrawal-consent record, cancel and withdraw
  requests, codes, account deletion, cookies and browser storage by name, a
  recipients table, a purposes and legal-bases table, a retention table,
  automated decisions, security, children, the controller and your rights.
  Retention periods still waiting for professional confirmation are flagged
  `confirm: true` in `lib/legal/privacy.ts`; the flag is never rendered.
- `/en/legal-notice`: English only. Its values come from `lib/legal/trader.ts`.

## Seller model switch

The API's `features.billing_seller` on `GET /capabilities` (`"managed_payments"`
or `"direct"`) picks what the Terms, the Privacy Policy and the Legal notice
describe; the pages re-read it every five minutes. `TOONE_PRO_SELLER` in
`lib/legal/seller.ts` is only the fallback for when the API does not say:

- `"managed_payments"` (default): Stripe Managed Payments. Sold through Link,
  LLC is the seller and merchant of record; it handles VAT, receipts and
  invoices.
- `"direct"`: the trader in `lib/legal/trader.ts` is the seller. Stripe
  Payments Europe processes the payments, Stripe Tax calculates VAT, a
  Portuguese legal invoice (with ATCUD) is emailed as a PDF for every accepted payment,
  separate from Stripe's receipt, EU businesses with a VIES-checked VAT number
  get the reverse charge, and refunds get credit notes. Countries where Toone
  Pro can't be sold yet are named at checkout, not in the Terms; a payment from
  one is refused: refunded in full, no Pro, and no legal invoice or credit note
  (Stripe's refund confirmation is the only record).

Withdrawal, cancellation, the 14-day refunds, codes, account deletion and the
Mac App Store edition read the same in both. Keep the fallback constant equal
to the live setting. The tests render both variants.

## Release gate: owner data

Every value in `lib/legal/trader.ts` starts with `TODO_OWNER` until the owner
provides it. While any does, `TRADER_DETAILS_COMPLETE` is false and the site
keeps the Legal notice unpublished: the page is a 404, it is not in the sitemap
or the footer, and the Terms and the Privacy Policy point to the contact email
instead of linking to it.

A production build (`VERCEL_ENV=production`, or `LEGAL_RELEASE_CHECK=1`) never
offers web checkout while any value is missing: the pricing buttons, the
Pricing link and the account page's upgrade button stay hidden. The prebuild
step also fails that build outright when the API already has web checkout on.

The owner-data test is skipped in a plain `npm test`. It runs, and fails while
any value is missing, with `LEGAL_RELEASE_CHECK=1` or `VERCEL_ENV=production`.
It must pass before the first live checkout:

```sh
LEGAL_RELEASE_CHECK=1 npm run test:legal
```

The values must match the EU trader details on the App Store listing.

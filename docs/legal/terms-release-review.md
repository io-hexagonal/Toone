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
  receipt, unused remainder refunded pro rata), no plan switching, a pro-rata
  refund for any subscription withdrawn within 14 days (no reason needed),
  no withdrawal refund for Lifetime (digital content; the right ends once
  access starts) but a goodwill refund on request within 14 days, with a
  reason, decided by Toone (`#goodwill-refund`), purchases made under earlier
  Terms keeping the first-purchase full refund (`#earlier-terms`, linking the
  2026-11-13 version), the withdrawal
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

Toone Pro on the web is sold in one of two ways, and a purchase keeps the
seller it was made under (renewals, invoices and refunds included). The
Terms, the Privacy Policy and the Legal notice therefore always describe both,
and say which applies to a purchase: the one checkout showed and the purchase
confirmation email names.

- Sold through Link (Stripe Managed Payments): Sold through Link, LLC is the
  seller and merchant of record; it handles VAT, receipts and invoices.
- Sold by Toone (direct): the trader in `lib/legal/trader.ts` is the seller.
  Stripe Payments Europe processes the payments, Stripe Tax calculates VAT, a
  Portuguese legal invoice (with ATCUD) is emailed as a PDF for every accepted
  payment, separate from Stripe's receipt, EU businesses with a VIES-checked
  VAT number get the reverse charge, and refunds get credit notes. Countries
  where Toone Pro can't be sold yet are named at checkout, not in the Terms; a
  payment from one is refused: refunded in full, no Pro, and no legal invoice
  or credit note (Stripe's refund confirmation is the only record).

The API's top-level `billing_seller` on `GET /capabilities` (`"managed_payments"`
or `"direct"`) only adds one sentence, "New purchases are currently sold …";
the pages re-read it every five minutes and leave the sentence out when the API
does not say. There is no fallback constant, so a switch needs no website step
and an unreachable API can never name the wrong seller.

Withdrawal, cancellation, the 14-day refunds, goodwill refunds, codes, account deletion and the
Mac App Store edition read the same for both. The tests render the pages for
either seller and for an unknown one.

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

## Terms versions and the checkout consent

Each version of the Terms is kept readable at `/en/terms?version=<date>`
(`lib/legal/terms-versions.ts`; a replaced text is frozen under
`app/[locale]/terms/versions/`). The server keeps the same list
(`ProTermsVersions`) to link a purchase confirmation to the Terms in force when
the buyer accepted them, and versions the consent text Checkout shows
(`ProCheckoutConsentVersion`); each purchase records the consent version it
showed, and the refund rules follow that version.

- 2026-11-11: first web-sales Terms.
- 2026-11-13: codes sold by authorised resellers (AppSumo).
- 2026-11-20: reviewed refunds. Subscriptions withdrawn within 14 days are
  refunded pro rata (also the first purchase); Lifetime is not refunded on
  withdrawal, but a goodwill refund can be asked for within 14 days, with a
  reason of at least 20 characters, on `/en/cancel-contract#goodwill-refund`
  (posted through `/api/contact` to the team's Discord channel; the owner
  decides and refunds by hand in the Stripe Dashboard). Purchases made before
  then, or whose checkout showed the earlier consent text, keep the full refund
  of an account's first paid purchase. Checkout consent version 2026-11-20
  goes with it.

Release the website version and the server's consent version together, and
not before the version's date: `termsVersionAt` treats a version dated after
today as not yet in force (`?version=2026-11-20` shows the current text with a
note until that day), and the server picks the Terms version by date. A new
consent text live before the new Terms would sell under Terms that still
promise the full refund; the Terms already say that a purchase whose checkout
showed the earlier consent keeps it, so the safe order is: Terms first (on or
after 2026-11-20 UTC), then the server's consent version.

The goodwill form and `/api/contact` have no rate limit; the route checks the
input again and posts only well-formed requests.

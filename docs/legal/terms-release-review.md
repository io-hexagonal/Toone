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
4. An account or website service contract, if desired, needs its own approved
   text. This page creates no new account, subscription, or website obligation.

The route is indexable, English only, and listed in the sitemap. Other locale
routes redirect to `/en/terms`.
